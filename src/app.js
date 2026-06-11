import { articles, synonymLibrary } from "./data.js";

const app = document.querySelector("#app");
const recordKey = "ielts-reading-master-records";
const synonymByWord = new Map(
  synonymLibrary.map((item) => [item.headword.toLowerCase(), item]),
);

const difficultyLabels = {
  easy: "简单",
  medium: "中等",
  hard: "高难度",
};

const dictionary = new Map([
  ...synonymLibrary.map((item) => [
    item.headword.toLowerCase(),
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

const state = {
  difficulty: "easy",
  selectedArticleId: null,
  highlightSynonyms: true,
  records: loadRecords(),
  longPressTimer: null,
};

render();
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
        <button class="ghost-button" data-action="reset-records" type="button">清空记录</button>
      </div>
    </header>
    <main class="main-layout">
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
      <p>第一版先专注文章学习。打开文章后，你可以切换同义替换高亮，双击单词查看释义，长按整句查看中文翻译。</p>
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
          <p class="hint-line">双击单词看释义；长按句子看整句翻译。</p>
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
          ${renderWords(sentence.text)}
        </span>
      `;
    })
    .join(" ");

  return `<p class="paragraph">${sentences}</p>`;
}

function renderWords(text) {
  const parts = text.match(/[A-Za-z]+(?:-[A-Za-z]+)?|[^A-Za-z]+/g) || [];

  return parts
    .map((part) => {
      if (!/^[A-Za-z]/.test(part)) {
        return part;
      }

      const normalized = normalizeWord(part);
      const hasSynonym = synonymByWord.has(normalized);
      const classes = [
        "word",
        hasSynonym ? "has-synonym" : "",
        hasSynonym && state.highlightSynonyms ? "highlight-on" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `<span class="${classes}" data-word="${normalized}">${part}</span>`;
    })
    .join("");
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
    button.addEventListener("click", () => handleAction(button.dataset.action));
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

function handleAction(action) {
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
  const word = wordElement.dataset.word;
  const synonym = synonymByWord.get(word);
  const definition = dictionary.get(word) || {
    partOfSpeech: "",
    meaningZh: "暂无内置释义，后续可接入词典或 AI 释义。",
  };
  const rect = wordElement.getBoundingClientRect();

  showPopover(
    rect,
    `
      <div class="popover-title">
        <strong>${wordElement.textContent}</strong>
        <span>${definition.partOfSpeech || synonym?.partOfSpeech || ""}</span>
      </div>
      <p>${definition.meaningZh || synonym?.meaningZh}</p>
      ${
        synonym
          ? `
            <div class="synonym-block">
              <div class="synonym-label">常见同义替换</div>
              <div class="synonym-list">
                ${synonym.substitutions.map((item) => `<span class="synonym-chip">${item}</span>`).join("")}
              </div>
            </div>
          `
          : ""
      }
    `,
  );
}

function showSentenceTranslation(sentenceElement) {
  const rect = sentenceElement.getBoundingClientRect();
  showPopover(
    rect,
    `
      <div class="popover-title">
        <strong>整句释义</strong>
        <span>AI-style</span>
      </div>
      <p>${sentenceElement.dataset.translation}</p>
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
}

function closePopover() {
  const root = document.querySelector("#popover-root");
  if (root) {
    root.innerHTML = "";
  }
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

function normalizeWord(word) {
  return word.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
}

function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
