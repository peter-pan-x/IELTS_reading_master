import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const sourceRoot = process.env.READING_SOURCE_ROOT;

if (!sourceRoot) {
  throw new Error("READING_SOURCE_ROOT is required");
}

const examRoot = join(sourceRoot, "reading-exams");
const targetFile = new URL("../src/articles.js", import.meta.url);
const existingTranslationBySentence = loadExistingTranslations();

const difficultyByCategory = {
  P1: "easy",
  P2: "medium",
  P3: "hard",
};

function loadRegisteredData(filePath, registryName) {
  if (!existsSync(filePath)) {
    return new Map();
  }

  const store = new Map();
  const context = {
    window: {},
    globalThis: {},
  };
  context.window[registryName] = {
    register(id, data) {
      store.set(id, data);
    },
  };
  context.globalThis = context.window;

  const code = readFileSync(filePath, "utf8");
  vm.runInNewContext(code, context, { filename: filePath });

  return store;
}

function loadReadingIndex() {
  const context = {
    window: {},
    globalThis: {},
  };
  context.globalThis = context.window;

  const manifestPath = join(examRoot, "manifest.js");
  const code = readFileSync(manifestPath, "utf8");
  vm.runInNewContext(code, context, { filename: manifestPath });

  return (context.window.__READING_EXAM_INDEX__ || []).filter(
    (entry) => entry.sourceKind === "generated-reading" && entry.hasHtml,
  );
}

function htmlToParagraphs(html) {
  const paragraphs = [];
  const paragraphMatches = html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);

  for (const match of paragraphMatches) {
    const text = cleanupHtml(match[1]);

    if (!text || /^You should spend\b/i.test(text)) {
      continue;
    }

    if (/compiled,\s*formatted\b/i.test(text) || /reading walks/i.test(text)) {
      continue;
    }

    if (text.length < 40) {
      continue;
    }

    const labelMatch = text.match(/^([A-H])\s+/);

    paragraphs.push({
      label: labelMatch?.[1] || "",
      text: text.replace(/^[A-H]\s+/, ""),
    });
  }

  return paragraphs;
}

function cleanupHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSentence(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function loadExistingTranslations() {
  if (!existsSync(targetFile)) {
    return new Map();
  }

  const context = {};

  try {
    const code = readFileSync(targetFile, "utf8")
      .replace(/export\s+const\s+articles\s+=/, "const articles =")
      .replace(/;\s*$/, "\nthis.articles = articles;");
    vm.runInNewContext(code, context, { filename: targetFile.pathname });
  } catch {
    return new Map();
  }

  const translations = new Map();

  (context.articles || []).forEach((article) => {
    article.paragraphs?.forEach((paragraph) => {
      paragraph.forEach((sentence) => {
        const text = normalizeSentence(sentence.text);
        const translation = sentence.translation || "";

        if (text && translation && !needsTranslation(translation)) {
          translations.set(text, translation);
        }
      });
    });
  });

  return translations;
}

function needsTranslation(value) {
  return !value || /待生成|段落释义|句子释义|暂无精确句子释义|正在生成/.test(value);
}

function splitSentences(paragraph) {
  const parts = paragraph
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/g)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.map((text) => ({
    text,
    translation: existingTranslationBySentence.get(normalizeSentence(text)) || "本句中文释义待生成。",
  }));
}

function countWords(paragraphs) {
  return paragraphs
    .join(" ")
    .split(/\s+/)
    .filter((word) => /[A-Za-z]/.test(word)).length;
}

function normalizeFrequency(value) {
  if (value === "high" || value === "高频") return "高频";
  if (value === "次高频") return "次高频";
  return "练习";
}

function stableShuffleValue(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function sortArticlesInStableShuffleOrder(items) {
  return items.sort((a, b) => {
    const aValue = stableShuffleValue(`${a.difficulty}|${a.id}|${a.title}`);
    const bValue = stableShuffleValue(`${b.difficulty}|${b.id}|${b.title}`);
    return aValue - bValue || a.id.localeCompare(b.id);
  });
}

function loadArticle(indexEntry) {
  const id = indexEntry.id;
  const examStore = loadRegisteredData(
    join(examRoot, `${id}.js`),
    "__READING_EXAM_DATA__",
  );
  const exam = examStore.get(id);

  if (!exam) {
    throw new Error(`Missing exam data for ${id}`);
  }

  const html = exam.passage.blocks
    .map((block) => block.html || block.bodyHtml || "")
    .filter(Boolean)
    .join("\n");
  const paragraphInfos = htmlToParagraphs(html);
  const paragraphs = paragraphInfos.map((paragraphInfo) => splitSentences(paragraphInfo.text));
  const category = exam.meta.category || "P1";

  return {
    id,
    title: exam.meta.title || indexEntry.title,
    difficulty: difficultyByCategory[category] || "easy",
    topic: `${category} ${normalizeFrequency(exam.meta.frequency)}`,
    wordCount: countWords(paragraphInfos.map((paragraph) => paragraph.text)),
    paragraphs,
  };
}

const index = loadReadingIndex();
const failed = [];
const articles = [];

for (const indexEntry of index) {
  try {
    const article = loadArticle(indexEntry);

    if (!article.paragraphs.length) {
      failed.push({ id: indexEntry.id, reason: "no paragraphs" });
      continue;
    }

    articles.push(article);
  } catch (error) {
    failed.push({ id: indexEntry.id, reason: error.message });
  }
}

sortArticlesInStableShuffleOrder(articles);

const output = `// Generated by scripts/import-reading-articles.mjs from local reading data.
// Do not edit this file by hand when refreshing imported passages.

export const articles = ${JSON.stringify(articles, null, 2)};
`;

writeFileSync(targetFile, output, "utf8");

console.log(
  JSON.stringify(
    {
      indexed: index.length,
      imported: articles.length,
      failed,
      byDifficulty: articles.reduce((acc, article) => {
        acc[article.difficulty] = (acc[article.difficulty] || 0) + 1;
        return acc;
      }, {}),
      reusedTranslations: existingTranslationBySentence.size,
      pendingTranslations: articles
        .flatMap((article) => article.paragraphs.flat())
        .filter((sentence) => needsTranslation(sentence.translation)).length,
      sample: articles.slice(0, 10).map((article) => ({
        id: article.id,
        title: article.title,
        difficulty: article.difficulty,
        wordCount: article.wordCount,
        paragraphs: article.paragraphs.length,
      })),
    },
    null,
    2,
  ),
);
