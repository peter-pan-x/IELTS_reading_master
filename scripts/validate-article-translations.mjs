import { articles } from "../src/articles.js";

function needsTranslation(value) {
  return !value || /待生成|段落释义|句子释义|暂无精确句子释义|正在生成/.test(value);
}

const report = {
  articles: articles.length,
  sentences: 0,
  pending: [],
};

articles.forEach((article) => {
  article.paragraphs.forEach((paragraph, paragraphIndex) => {
    paragraph.forEach((sentence, sentenceIndex) => {
      report.sentences += 1;

      if (needsTranslation(sentence.translation)) {
        report.pending.push({
          articleId: article.id,
          title: article.title,
          paragraphIndex,
          sentenceIndex,
          text: sentence.text,
        });
      }
    });
  });
});

console.log(
  JSON.stringify(
    {
      articles: report.articles,
      sentences: report.sentences,
      pending: report.pending.length,
      samplePending: report.pending.slice(0, 10),
    },
    null,
    2,
  ),
);

if (report.pending.length) {
  process.exitCode = 1;
}
