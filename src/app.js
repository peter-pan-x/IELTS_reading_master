import { articles, synonymLibrary } from "./data.js?v=20260611-offline-translations";

const app = document.querySelector("#app");
const recordKey = "ielts-reading-master-records";
const vocabularyKey = "ielts-reading-master-vocabulary";
const missingTranslationPattern = /待生成|段落释义|句子释义|暂无精确句子释义|正在生成/;
const quietAutoHighlightTerms = new Set([
  "a",
  "an",
  "and",
  "as",
  "but",
  "for",
  "it",
  "or",
  "that",
  "the",
  "these",
  "they",
  "this",
  "those",
  "yet",
]);
const synonymTermIndex = buildSynonymTermIndex(synonymLibrary);
const highlightRegex = buildHighlightRegex(synonymTermIndex);
const localDictionary = globalThis.__LOCAL_DICTIONARIES__?.ecdict || null;
const localDictionaryByWord = buildLocalDictionaryIndex(localDictionary?.entries || []);

const difficultyLabels = {
  easy: "简单",
  medium: "中等",
  hard: "高难度",
};

const dictionary = new Map([
  ...synonymLibrary.map((item) => [
    normalizeTerm(item.headword),
    {
      word: item.headword,
      partOfSpeech: item.partOfSpeech,
      meaningZh: item.meaningZh,
    },
  ]),
  ["urban", { partOfSpeech: "adj.", meaningZh: "城市的" }],
  ["crowded", { partOfSpeech: "adj.", meaningZh: "拥挤的" }],
  ["residents", { partOfSpeech: "n.", meaningZh: "居民" }],
  ["planners", { partOfSpeech: "n.", meaningZh: "规划者" }],
  ["landmarks", { partOfSpeech: "n.", meaningZh: "地标" }],
  ["travellers", { partOfSpeech: "n.", meaningZh: "旅行者" }],
  ["archaeologists", { partOfSpeech: "n.", meaningZh: "考古学家" }],
  ["channels", { partOfSpeech: "n.", meaningZh: "水渠；通道" }],
  ["settlements", { partOfSpeech: "n.", meaningZh: "定居点" }],
  ["resources", { partOfSpeech: "n.", meaningZh: "资源" }],
  ["structures", { partOfSpeech: "n.", meaningZh: "结构；建筑物" }],
  ["societies", { partOfSpeech: "n.", meaningZh: "社会" }],
]);
const dictionarySourceLabel = localDictionary?.source?.name || "ECDICT";

const state = {
  difficulty: "easy",
  selectedArticleId: null,
  highlightSynonyms: true,
  records: loadRecords(),
  vocabulary: loadVocabulary(),
  longPressTimer: null,
  translationAuditStarted: false,
  translationAudit: {
    checked: false,
    missing: 0,
    scanned: 0,
    total: 0,
  },
};

render();
startBackgroundTranslationAudit();
document.addEventListener("click", handleOutsideClick);

function render() {
  const selectedArticle = articles.find((item) => item.id === state.selectedArticleId);

  app.innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <h1 class="brand-title">IELTS Reading Master</h1>
          <p class="brand-subtitle">雅思阅读精读 · 同义替换敏感度训练</p>
        </div>
        <div class="topbar-actions">
          <span class="translation-status" data-translation-status hidden></span>
          <button class="ghost-button" data-action="reset-records" type="button">清空记录</button>
        </div>
      </div>
    </header>
    <main class="main-layout ${selectedArticle ? "is-reading" : ""}">
      <aside class="library-panel">
        <h2 class="section-title">选择难度</h2>
        <div class="difficulty-tabs">
          ${Object.entries(difficultyLabels)
            .map(
              ([key, label]) => `
                <button class="tab-button ${state.difficulty === key ? "is-active" : ""}" data-difficulty="${key}" type="button">
                  ${label}
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="article-list">
          ${renderArticleCards()}
        </div>
      </aside>
      <section class="reader">
        ${selectedArticle ? renderReader(selectedArticle) : renderEmptyReader()}
      </section>
    </main>
    <div id="popover-root"></div>
  `;

  bindEvents();
}

function renderArticleCards() {
  return articles
    .filter((article) => article.difficulty === state.difficulty)
    .map((article) => {
      const record = getRecord(article.id);
      const progress = Math.round(record.progressPercent || 0);
      return `
        <button class="article-card ${state.selectedArticleId === article.id ? "is-selected" : ""}" data-article-id="${article.id}" type="button">
          <h3 class="article-card-title">${article.title}</h3>
          <div class="meta-row">
            <span class="pill">${difficultyLabels[article.difficulty]}</span>
            <span class="pill">${article.topic}</span>
            <span class="pill">${article.wordCount} words</span>
            <span class="pill">学习 ${record.openCount || 0} 次</span>
            <span class="pill">进度 ${progress}%</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderEmptyReader() {
  return `
    <div class="reader-empty">
      <h2>从左侧选择一篇文章</h2>
      <p>第一版先专注文章学习。打开文章后，你可以切换同义替换高亮，双击单词查看释义，长按句子查看中文释义。</p>
    </div>
  `;
}

function renderReader(article) {
  const record = getRecord(article.id);

  return `
    <article class="reader-surface" data-reader-id="${article.id}">
      <header class="reader-header">
        <div>
          <div class="meta-row">
            <span class="pill">${difficultyLabels[article.difficulty]}</span>
            <span class="pill">${article.topic}</span>
            <span class="pill">${article.wordCount} words</span>
            <span class="pill">学习 ${record.openCount || 0} 次</span>
          </div>
          <h2 class="reader-title">${article.title}</h2>
          <p class="hint-line">双击单词看释义；长按句子看中文释义。</p>
        </div>
        <div class="reader-controls">
          <button class="ghost-button" data-action="back" type="button">返回</button>
          <button class="toggle-button ${state.highlightSynonyms ? "is-active" : ""}" data-action="toggle-highlight" type="button">
            同义替换 ${state.highlightSynonyms ? "开" : "关"}
          </button>
        </div>
      </header>
      <div class="progress-wrap" aria-label="reading progress">
        <div class="progress-bar" style="width: ${Math.round(record.progressPercent || 0)}%"></div>
      </div>
      <div class="article-body">
        ${article.paragraphs.map((paragraph, paragraphIndex) => renderParagraph(paragraph, paragraphIndex)).join("")}
      </div>
    </article>
  `;
}

function renderParagraph(paragraph, paragraphIndex) {
  const sentences = paragraph
    .map((sentence, sentenceIndex) => {
      const sentenceId = `${paragraphIndex}-${sentenceIndex}`;
      return `
        <span class="sentence" data-sentence-id="${sentenceId}" data-translation="${escapeAttribute(sentence.translation)}">
          ${renderTextWithTerms(sentence.text)}
        </span>
      `;
    })
    .join(" ");

  return `<p class="paragraph">${sentences}</p>`;
}

function renderTextWithTerms(text) {
  if (!highlightRegex) {
    return renderPlainWords(text);
  }

  let rendered = "";
  let cursor = 0;

  for (const match of text.matchAll(highlightRegex)) {
    const matchedText = match[0];
    const start = match.index || 0;

    if (start > cursor) {
      rendered += renderPlainWords(text.slice(cursor, start));
    }

    rendered += renderTermSpan(matchedText, true);
    cursor = start + matchedText.length;
  }

  rendered += renderPlainWords(text.slice(cursor));
  return rendered;
}

function renderPlainWords(text) {
  const parts = text.match(/[A-Za-z]+(?:-[A-Za-z]+)?|[^A-Za-z]+/g) || [];

  return parts
    .map((part) => {
      if (!/^[A-Za-z]/.test(part)) {
        return escapeHtml(part);
      }

      return renderTermSpan(part, false);
    })
    .join("");
}

function renderTermSpan(text, matchedByHighlightRegex) {
  const normalized = normalizeTerm(text);
  const synonym = synonymTermIndex.get(normalized);
  const isVocabularyWord = Boolean(state.vocabulary[normalized]);
  const canAutoHighlight = matchedByHighlightRegex || shouldAutoHighlightTerm(normalized);
  const classes = [
    "word",
    synonym ? "has-synonym" : "",
    synonym && canAutoHighlight && state.highlightSynonyms ? "highlight-on" : "",
    isVocabularyWord ? "is-vocabulary-word" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<span class="${classes}" data-term="${escapeAttribute(normalized)}">${escapeHtml(text)}</span>`;
}

function bindEvents() {
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      state.difficulty = button.dataset.difficulty;
      state.selectedArticleId = null;
      closePopover();
      render();
    });
  });

  document.querySelectorAll("[data-article-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedArticleId = button.dataset.articleId;
      incrementOpenCount(state.selectedArticleId);
      closePopover();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button));
  });

  document.querySelectorAll(".word").forEach((wordElement) => {
    wordElement.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showWordDefinition(wordElement);
    });
  });

  document.querySelectorAll(".sentence").forEach((sentenceElement) => {
    sentenceElement.addEventListener("pointerdown", () => startLongPress(sentenceElement));
    sentenceElement.addEventListener("pointerup", cancelLongPress);
    sentenceElement.addEventListener("pointerleave", cancelLongPress);
    sentenceElement.addEventListener("pointercancel", cancelLongPress);
  });

  window.removeEventListener("scroll", updateReadingProgress);
  window.addEventListener("scroll", updateReadingProgress, { passive: true });

}

function handleAction(action, button) {
  if (action === "back") {
    state.selectedArticleId = null;
    closePopover();
    render();
  }

  if (action === "toggle-highlight") {
    state.highlightSynonyms = !state.highlightSynonyms;
    closePopover();
    render();
  }

  if (action === "reset-records") {
    state.records = {};
    saveRecords();
    closePopover();
    render();
  }

  if (action === "add-vocabulary") {
    addVocabulary(button);
  }
}

function startLongPress(sentenceElement) {
  cancelLongPress();
  sentenceElement.classList.add("is-pressing");
  state.longPressTimer = window.setTimeout(() => {
    showSentenceTranslation(sentenceElement);
    sentenceElement.classList.remove("is-pressing");
  }, 650);
}

function cancelLongPress() {
  if (state.longPressTimer) {
    window.clearTimeout(state.longPressTimer);
    state.longPressTimer = null;
  }

  document.querySelectorAll(".sentence.is-pressing").forEach((item) => {
    item.classList.remove("is-pressing");
  });
}

function showWordDefinition(wordElement) {
  clearSelectedSentence();

  const term = wordElement.dataset.term;
  const synonymMatch = synonymTermIndex.get(term);
  const synonym = synonymMatch?.entry;
  const localDefinition = lookupLocalDictionary(term);
  const fallbackDefinition =
    dictionary.get(term) ||
    (synonym
      ? {
          partOfSpeech: synonym.partOfSpeech,
          meaningZh: synonym.meaningZh,
        }
      : null);
  const definition = localDefinition || fallbackDefinition || {
    partOfSpeech: "",
    meaningZh: "暂无内置释义，后续可接入词典或 AI 释义。",
  };
  const rect = wordElement.getBoundingClientRect();
  const selectedText = wordElement.textContent || term;
  const synonymTerms = synonym ? uniqueTerms([synonym.headword, ...synonym.substitutions]) : [];
  const isSaved = Boolean(state.vocabulary[term]);

  showPopover(
    rect,
    `
      <div class="popover-title">
        <strong>${escapeHtml(selectedText)}</strong>
        <span>${escapeHtml(definition.phonetic || definition.partOfSpeech || synonym?.partOfSpeech || "")}</span>
      </div>
      <p>${escapeHtml(definition.meaningZh || synonym?.meaningZh)}</p>
      ${
        localDefinition?.englishDefinition
          ? `<p class="definition-en">${escapeHtml(localDefinition.englishDefinition)}</p>`
          : ""
      }
      ${
        localDefinition
          ? `<div class="definition-source">${escapeHtml(dictionarySourceLabel)} 本地词典</div>`
          : ""
      }
      ${
        synonym
          ? `
            <div class="synonym-block">
              <div class="synonym-label">考点词：${escapeHtml(synonym.headword)}</div>
              <div class="synonym-list">
                ${synonymTerms.map((item) => `<span class="synonym-chip">${escapeHtml(item)}</span>`).join("")}
              </div>
            </div>
          `
          : ""
      }
      <button
        class="vocabulary-button ${isSaved ? "is-saved" : ""}"
        data-action="add-vocabulary"
        data-term="${escapeAttribute(term)}"
        data-word="${escapeAttribute(selectedText)}"
        data-phonetic="${escapeAttribute(definition.phonetic || "")}"
        data-part-of-speech="${escapeAttribute(definition.partOfSpeech || synonym?.partOfSpeech || "")}"
        data-meaning-zh="${escapeAttribute(definition.meaningZh || synonym?.meaningZh || "")}"
        data-article-id="${escapeAttribute(state.selectedArticleId || "")}"
        type="button"
      >
        ${isSaved ? "已加入生词本" : "加入生词本"}
      </button>
    `,
  );
}

function showSentenceTranslation(sentenceElement) {
  clearSelectedSentence();
  sentenceElement.classList.add("is-selected-for-translation");

  const rect = sentenceElement.getBoundingClientRect();
  const translation = getLocalSentenceTranslation(sentenceElement.dataset.translation || "");

  showPopover(
    rect,
    `
      <div class="popover-title">
        <strong>中文释义</strong>
      </div>
      <p class="translation-result">${escapeHtml(translation)}</p>
    `,
    "translation-popover",
  );
}

function showPopover(rect, html, extraClass = "") {
  const root = document.querySelector("#popover-root");
  const left = Math.min(rect.left, window.innerWidth - 360);
  const top = Math.min(rect.bottom + 10, window.innerHeight - 220);

  root.innerHTML = `
    <div class="popover ${extraClass}" style="left: ${Math.max(14, left)}px; top: ${Math.max(14, top)}px">
      ${html}
    </div>
  `;

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button));
  });
}

function closePopover() {
  const root = document.querySelector("#popover-root");
  if (root) {
    root.innerHTML = "";
  }

  clearSelectedSentence();
}

function clearSelectedSentence() {
  document.querySelectorAll(".sentence.is-selected-for-translation").forEach((item) => {
    item.classList.remove("is-selected-for-translation");
  });
}

function handleOutsideClick(event) {
  if (!event.target.closest(".popover") && !event.target.closest(".word")) {
    closePopover();
  }
}

function updateReadingProgress() {
  if (!state.selectedArticleId) {
    return;
  }

  const reader = document.querySelector(".reader-surface");
  if (!reader) {
    return;
  }

  const rect = reader.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const total = Math.max(1, rect.height - viewportHeight * 0.45);
  const read = Math.min(total, Math.max(0, -rect.top));
  const progressPercent = Math.max(0, Math.min(100, (read / total) * 100));
  const record = getRecord(state.selectedArticleId);

  record.progressPercent = Math.max(record.progressPercent || 0, progressPercent);
  record.lastOpenedAt = new Date().toISOString();
  state.records[state.selectedArticleId] = record;
  saveRecords();

  const progressBar = document.querySelector(".progress-bar");
  if (progressBar) {
    progressBar.style.width = `${Math.round(record.progressPercent)}%`;
  }
}

function incrementOpenCount(articleId) {
  const record = getRecord(articleId);
  record.openCount = (record.openCount || 0) + 1;
  record.lastOpenedAt = new Date().toISOString();
  state.records[articleId] = record;
  saveRecords();
}

function getRecord(articleId) {
  return state.records[articleId] || {
    articleId,
    openCount: 0,
    progressPercent: 0,
    lastOpenedAt: null,
  };
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(recordKey)) || {};
  } catch {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(recordKey, JSON.stringify(state.records));
}

function loadVocabulary() {
  try {
    return JSON.parse(localStorage.getItem(vocabularyKey)) || {};
  } catch {
    return {};
  }
}

function saveVocabulary() {
  localStorage.setItem(vocabularyKey, JSON.stringify(state.vocabulary));
}

function startBackgroundTranslationAudit() {
  if (state.translationAuditStarted) {
    return;
  }

  state.translationAuditStarted = true;

  const sentences = articles.flatMap((article) => article.paragraphs.flat());
  const chunkSize = 320;
  let cursor = 0;
  let missing = 0;

  state.translationAudit.total = sentences.length;
  updateTranslationStatus();

  function scanChunk() {
    const end = Math.min(cursor + chunkSize, sentences.length);

    for (let index = cursor; index < end; index += 1) {
      if (needsLocalTranslation(sentences[index].translation)) {
        missing += 1;
      }
    }

    cursor = end;
    state.translationAudit.scanned = cursor;
    state.translationAudit.missing = missing;
    updateTranslationStatus();

    if (cursor < sentences.length) {
      window.setTimeout(scanChunk, 24);
      return;
    }

    state.translationAudit.checked = true;
    updateTranslationStatus();
  }

  window.setTimeout(scanChunk, 120);
}

function updateTranslationStatus() {
  const status = document.querySelector("[data-translation-status]");
  if (!status) {
    return;
  }

  if (state.translationAudit.missing > 0) {
    status.hidden = false;
    status.textContent = `释义待补 ${state.translationAudit.missing} 句`;
    status.classList.add("needs-attention");
    return;
  }

  status.classList.remove("needs-attention");
  status.hidden = true;
}

function getLocalSentenceTranslation(value) {
  if (needsLocalTranslation(value)) {
    return "本句中文释义尚未内置，请先运行内容更新脚本生成离线释义。";
  }

  return value;
}

function needsLocalTranslation(value) {
  return !value || missingTranslationPattern.test(value);
}

function addVocabulary(button) {
  const term = button?.dataset.term;
  if (!term) {
    return;
  }

  state.vocabulary[term] = {
    term,
    word: button.dataset.word || term,
    phonetic: button.dataset.phonetic || "",
    partOfSpeech: button.dataset.partOfSpeech || "",
    meaningZh: button.dataset.meaningZh || "",
    articleId: button.dataset.articleId || null,
    savedAt: new Date().toISOString(),
  };
  saveVocabulary();

  button.classList.add("is-saved");
  button.textContent = "已加入生词本";
  render();
}

function normalizeSentenceText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function buildLocalDictionaryIndex(entries) {
  const index = new Map();

  entries.forEach((entry) => {
    const word = normalizeTerm(entry.w || "");
    if (word && !index.has(word)) {
      index.set(word, entry);
    }
  });

  return index;
}

function lookupLocalDictionary(term) {
  const candidates = getLookupCandidates(term);

  for (const candidate of candidates) {
    const entry = localDictionaryByWord.get(candidate);
    if (!entry) {
      continue;
    }

    return {
      partOfSpeech: "",
      phonetic: entry.p ? `/${entry.p}/` : "",
      meaningZh: shortenDefinition(entry.t || ""),
      englishDefinition: shortenDefinition(entry.d || ""),
      sourceWord: entry.w,
    };
  }

  return null;
}

function getLookupCandidates(term) {
  const normalized = normalizeTerm(term);
  const candidates = [normalized];

  if (normalized.endsWith("ies") && normalized.length > 4) {
    candidates.push(`${normalized.slice(0, -3)}y`);
  }

  if (normalized.endsWith("es") && normalized.length > 3) {
    candidates.push(normalized.slice(0, -2));
  }

  if (normalized.endsWith("s") && normalized.length > 3) {
    candidates.push(normalized.slice(0, -1));
  }

  if (normalized.endsWith("ing") && normalized.length > 5) {
    candidates.push(normalized.slice(0, -3));
    candidates.push(`${normalized.slice(0, -3)}e`);
  }

  if (normalized.endsWith("ed") && normalized.length > 4) {
    candidates.push(normalized.slice(0, -2));
    candidates.push(`${normalized.slice(0, -1)}`);
  }

  return [...new Set(candidates.filter(Boolean))];
}

function shortenDefinition(value) {
  return value
    .replace(/\s+/g, " ")
    .split(/；|;(?=\s)|\|/)
    .slice(0, 3)
    .join("；")
    .trim();
}

function normalizeWord(word) {
  return word.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
}

function normalizeTerm(term) {
  return term
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/^[^a-z]+|[^a-z]+$/g, "")
    .trim();
}

function buildSynonymTermIndex(entries) {
  const index = new Map();

  entries.forEach((entry) => {
    uniqueTerms([entry.headword, ...entry.substitutions]).forEach((term) => {
      const normalized = normalizeTerm(term);
      if (!isUsableTerm(normalized) || index.has(normalized)) {
        return;
      }

      index.set(normalized, {
        entry,
        term,
      });
    });
  });

  return index;
}

function buildHighlightRegex(index) {
  const terms = [...index.keys()]
    .filter(shouldAutoHighlightTerm)
    .sort((a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length);

  if (!terms.length) {
    return null;
  }

  const pattern = terms
    .map((term) => escapeRegExp(term).replace(/\\ /g, "\\s+"))
    .join("|");

  return new RegExp(`\\b(?:${pattern})\\b`, "gi");
}

function shouldAutoHighlightTerm(term) {
  if (!isUsableTerm(term) || quietAutoHighlightTerms.has(term)) {
    return false;
  }

  return term.includes(" ") || term.length >= 4;
}

function isUsableTerm(term) {
  return /^[a-z][a-z\s'-]*[a-z]$/.test(term) && !/[….]/.test(term);
}

function uniqueTerms(terms) {
  const seen = new Set();
  const result = [];

  terms.forEach((term) => {
    const normalized = normalizeTerm(term);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(term.trim());
  });

  return result;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
