# IELTS Reading Master Product Requirements

Last updated: 2026-06-11

## 1. Product Positioning

IELTS Reading Master is a clean web-first IELTS reading learning product. The first version focuses on article learning, not question answering.

The product helps learners read IELTS-style passages, understand words and sentences quickly, and notice high-frequency synonym substitutions directly inside the article.

## 2. Version 1 Scope

Version 1 is a web MVP only.

Included in Version 1:

- Web article learning interface.
- Difficulty-based article browsing: Easy, Medium, Hard.
- Article list under each difficulty.
- Article reading page.
- Synonym substitution highlight toggle.
- Double-click word definition.
- Long-press sentence translation.
- If the selected word has synonym substitutions, show them below the definition.
- Basic article learning record: open count and reading progress.
- Clean, calm, spacious interface.

Not included in Version 1:

- Native mobile app.
- IELTS question answering.
- Paid membership.
- Login and cloud sync.
- Tutor management.
- Community features.

## 3. Target Users

Primary users:

- Chinese-speaking IELTS learners preparing for Academic IELTS Reading.
- Learners who can read some English but struggle with long passages.
- Learners who lose points because they cannot recognize paraphrases and synonym substitutions.

Secondary users:

- IELTS tutors who want a clean reading material tool for students.
- Learners who want to review IELTS-style articles without being distracted by question strategy.

## 4. Core Product Logic

Version 1 should follow this learning path:

1. User chooses a difficulty level.
2. User selects an article.
3. User reads the article in a focused reading page.
4. User turns synonym highlighting on or off.
5. User double-clicks a word to see a concise Chinese meaning.
6. If the word is in the synonym substitution library, the popup also shows common substitutions.
7. User long-presses a sentence to see an AI-style Chinese translation.
8. User's article open count and reading progress are recorded locally.

## 5. Information Architecture

Main screens:

- Article Library
- Article Reading Page

Optional secondary panel:

- Local learning record summary.

The first version should not show navigation entries outside the article learning experience.

## 6. Article Library Requirements

The article library should provide three difficulty tabs:

- Easy
- Medium
- Hard

Each article item should display:

- Article title.
- Difficulty.
- Topic tag.
- Estimated word count.
- Study count.
- Progress status.

Article list behavior:

- Clicking an article opens the reading page.
- The selected difficulty should remain visually clear.
- The interface should feel simple and direct.

## 7. Article Reading Page Requirements

The reading page should display:

- Back control.
- Article title.
- Difficulty.
- Topic tag.
- Article content.
- Synonym highlight toggle.
- Reading progress.

The article content should be the visual center of the page. Text should be comfortable for long reading sessions.

## 8. Word Definition Interaction

User action:

- Double-click a word.

System response:

- Show a small definition popup near the selected word.
- Display concise Chinese meaning.
- Display part of speech if available.
- If the word belongs to the synonym substitution library, display common substitutions below the meaning.

Example:

- Selected word: `significant`
- Meaning: 显著的；重要的
- Synonym substitutions: important, major, considerable, substantial, notable

Definition style:

- Short.
- Clear.
- Not dictionary-heavy.
- Designed for reading flow rather than deep lexical research.

## 9. Sentence Translation Interaction

User action:

- Long-press a sentence.

System response:

- Show the whole sentence's Chinese translation.

Translation strategy:

- Version 1 can use AI-style prepared translations in the article data.
- Later versions can connect to an AI translation service.
- The user experience should be the same either way: long-press sentence, see Chinese translation.

## 10. Synonym Substitution Highlighting

This is the core IELTS-specific feature.

The reading page should provide a toggle:

- Highlight off: article appears as normal reading text.
- Highlight on: high-frequency synonym substitution words and phrases are highlighted inside the article.

Highlight behavior:

- Highlighted words should use a calm but visible color.
- Highlighting should not damage readability.
- Double-clicking a highlighted word should show definition and substitutions.
- If a normal word also exists in the synonym library, the same popup should include substitutions.

Synonym data requirements:

- The product should include a built-in high-frequency IELTS synonym substitution library.
- The library should support at least 538 common substitution entries when the full dataset is available.
- Entries should be structured, not stored as plain text only.

Recommended fields:

- `id`
- `headword`
- `partOfSpeech`
- `meaningZh`
- `substitutions`
- `example`
- `difficulty`
- `tags`

## 11. Learning Records

Version 1 should support local learning records.

Article record fields:

- `articleId`
- `openCount`
- `progressPercent`
- `lastOpenedAt`

Behavior:

- Opening an article increases its study count.
- Scrolling through an article updates reading progress.
- Article cards show study count and progress.

No login or cloud sync is required in Version 1.

## 12. Content Requirements

Version 1 needs sample IELTS-style articles for development and testing.

Minimum sample content:

- 1 Easy article.
- 1 Medium article.
- 1 Hard article.

Recommended next content step:

- Expand to 3 to 5 articles per difficulty after the reading interaction is stable.

Article fields:

- `id`
- `title`
- `difficulty`
- `topic`
- `wordCount`
- `paragraphs`
- `sentenceTranslations`

## 13. UI Direction

The interface should be:

- Minimal.
- Clean.
- Spacious.
- Calm.
- Professional.
- Suitable for focused study.

Design requirements:

- Use a light background.
- Keep article typography highly readable.
- Avoid decorative clutter.
- Avoid marketing-style landing page.
- Keep the first screen as the actual article learning experience.
- Controls should be obvious but quiet.

## 14. MVP Acceptance Criteria

Version 1 is acceptable when:

- User can open the web page.
- User can select Easy, Medium, or Hard.
- User can see articles under the selected difficulty.
- User can open an article.
- User can turn synonym highlights on and off.
- User can double-click a word and see a Chinese meaning.
- If the word has substitutions, they appear below the meaning.
- User can long-press a sentence and see Chinese translation.
- Article study count updates after opening.
- Article progress updates after reading.
- The interface remains clean and readable on desktop and mobile widths.

## 15. Later Versions

Potential later features:

- Full 538-entry synonym library import and editing.
- More articles per difficulty.
- AI translation API integration.
- AI long-sentence explanation.
- Additional learning modules.
- Login and cloud sync.
- User-uploaded articles with automatic synonym highlighting.
- Web-to-app packaging.
