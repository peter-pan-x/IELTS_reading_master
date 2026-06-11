# IELTS Reading Master Product Requirements

Last updated: 2026-06-11

## 1. Product Positioning

IELTS Reading Master is a focused learning app and future web product for IELTS reading article study. Its core purpose is to help learners understand reading passages, master IELTS synonym substitution, and build essential reading vocabulary and phrase recognition.

The product should not start as an IELTS question bank or answer-strategy course. Its first version should focus on article comprehension, vocabulary memory, phrase memory, and synonym substitution awareness.

## 2. Target Users

Primary users:

- Chinese-speaking IELTS learners preparing for Academic IELTS Reading.
- Learners whose reading score is limited by vocabulary, long sentence comprehension, and synonym substitution.
- Learners who want structured reading material by difficulty instead of random article lists.

Secondary users:

- IELTS tutors who want to assign reading passages and vocabulary sets to students.
- Repeat test takers who want to review high-frequency reading themes and expressions.

## 3. Core Value Proposition

The app helps learners:

- Choose reading passages at a suitable difficulty level.
- Read IELTS-style articles with quick word and sentence support.
- Notice high-frequency synonym substitutions directly inside passages.
- Practice essential IELTS reading vocabulary and phrases through active recall.
- Track article learning frequency, completion progress, and review history.

## 4. Product Principles

- Clean and calm interface: simple, spacious, professional, and distraction-free.
- Reading-first experience: the passage itself should be the center of the screen.
- Lightweight explanations: word definitions should be concise, not dictionary-heavy.
- Active recall over passive browsing: vocabulary and phrase learning should require user input.
- Progressive difficulty: users should feel they can move from simple to medium to hard passages.
- Copyright-safe content strategy: article and vocabulary data should be sourced, licensed, user-created, or independently compiled.

## 5. MVP Scope

The first usable version should include:

- Difficulty-based article library.
- Article list under each difficulty.
- Article detail reading page.
- Word definition interaction.
- Sentence translation interaction.
- Synonym substitution highlight toggle.
- Synonym detail popover.
- IELTS reading vocabulary training.
- IELTS high-frequency phrase training.
- Basic learning records.

The MVP should not include:

- Full IELTS question-answer simulation.
- AI essay or speaking features.
- Social community features.
- Paid subscription flow.
- Tutor classroom management.
- Complex gamification.

## 6. Information Architecture

Recommended main navigation:

- Articles
- Vocabulary
- Phrases
- Records
- Settings

Recommended article flow:

1. User opens Articles.
2. User selects a difficulty: Easy, Medium, Hard.
3. User sees all passages in that difficulty.
4. User selects one passage.
5. User enters the reading page.
6. User reads, checks words, checks sentence translation, and optionally turns on synonym highlights.
7. Learning records update after meaningful reading activity.

## 7. Feature Requirements

### 7.1 Article Difficulty Categories

The article library should be divided into three levels:

- Easy: shorter passages, clearer structure, lower vocabulary density.
- Medium: standard IELTS-style passage difficulty.
- Hard: longer passages, denser academic vocabulary, more complex sentence structures.

Each difficulty page should show:

- Article title.
- Short topic label, such as science, history, environment, education, technology, culture.
- Estimated reading difficulty.
- Learning count.
- Learning progress.
- IELTS hit count, if available.

### 7.2 Article List

Each article card or row should display:

- Title.
- Difficulty.
- Topic.
- Estimated word count.
- Learning count.
- Progress status: Not started, In progress, Completed.
- Optional IELTS hit count.

Sorting and filtering for later versions:

- Sort by newest.
- Sort by difficulty.
- Sort by IELTS hit count.
- Filter by topic.
- Filter by completed or uncompleted.

### 7.3 Article Reading Page

The reading page should display:

- Article title.
- Difficulty.
- Topic labels.
- Article content.
- Synonym highlight toggle.
- Reading progress indicator.

Core interactions:

- Double-click or tap a word to see a concise Chinese definition.
- Long-press or select a sentence to see Chinese translation.
- Turn synonym highlight on or off.
- Tap a highlighted synonym word or phrase to view:
  - Meaning.
  - Common IELTS substitution forms.
  - Example usage if available.

Desktop and mobile behavior should be adjusted separately:

- Desktop web: double-click word, drag/select sentence, right-side or inline popover.
- Mobile app: tap word, long-press sentence, bottom sheet popover.

### 7.4 Synonym Substitution Highlighting

This is the product's most important IELTS-specific feature.

When enabled, high-frequency IELTS synonym substitution words and phrases should be highlighted inside the article with a distinct but calm color.

Example behavior:

- Original article contains `significant`.
- The word is highlighted.
- User taps it.
- The app shows:
  - Chinese meaning: 重要的；显著的
  - Common substitutions: important, major, considerable, substantial, notable
  - Possible IELTS reading role: used to replace idea intensity or importance

Data source requirement:

- The product may support importing a legally obtained synonym list inspired by common IELTS resources, including Liu Hongbo's 538 substitution words.
- The repository should not directly copy a copyrighted full list unless permission or a license is confirmed.
- A self-compiled synonym database can be created from public-domain examples, user notes, official-style passages, and manually reviewed learning material.

Recommended fields for each synonym item:

- `id`
- `headword`
- `part_of_speech`
- `chinese_meaning`
- `synonyms`
- `example_sentence`
- `difficulty`
- `tags`
- `source_note`

### 7.5 Vocabulary Training

The app should include an IELTS essential reading vocabulary module.

Two training modes:

- English to Chinese: show an English word, user inputs Chinese meaning.
- Chinese to English: show Chinese meaning, user spells the English word.

Interaction requirements:

- User types the answer.
- User presses Enter or taps submit.
- Correct answer turns green and moves to the next item.
- Wrong answer shows correction and allows retry or next.
- User can switch mode with a clear control.

Recommended learning states:

- New.
- Learning.
- Familiar.
- Mastered.
- Needs review.

Recommended future enhancement:

- Spaced repetition review scheduling.
- Wrong-word notebook.
- Daily target.
- Pronunciation audio.

### 7.6 Phrase Training

The app should include high-frequency IELTS reading phrases, especially phrases common in question stems and original passages.

Examples of phrase categories:

- Cause and effect.
- Contrast.
- Comparison.
- Research and evidence.
- Trend and change.
- Attitude and evaluation.
- Time sequence.
- Academic reporting verbs.

Training modes should match vocabulary:

- English phrase to Chinese.
- Chinese meaning to English phrase.

Phrase items should support:

- Phrase.
- Chinese meaning.
- Example sentence.
- Common paraphrases.
- Topic tags.
- Difficulty.

### 7.7 Learning Records

The product should track learning activity at article and item level.

Article record requirements:

- Number of times opened.
- Last opened time.
- Reading progress percentage.
- Completion status.
- Number of words checked.
- Number of sentence translations viewed.
- Synonym highlight usage count.

Vocabulary and phrase record requirements:

- Total practiced.
- Correct count.
- Incorrect count.
- Accuracy rate.
- Last practiced time.
- Mastery state.

Privacy note:

- If the first version has no login system, records can be stored locally.
- If cross-device sync is needed, a user account system will be required.

### 7.8 IELTS Hit Count

The app can display how often an article, topic, or similar source appears in IELTS reading contexts.

This feature needs a careful definition before implementation.

Possible definitions:

- Exact article hit: the same article appeared in a real IELTS reading test.
- Source hit: the same source publication or topic appeared in IELTS-style material.
- Theme hit: similar topic appears frequently in IELTS reading.
- User-reported hit: learners report seeing the article or topic in exams.

Recommended MVP approach:

- Add an optional `hit_count` field to article metadata.
- Show it only when the data is manually verified.
- Avoid making unverified marketing claims.

## 8. Suggested Content Strategy

Article sources should be handled carefully because IELTS passages and many published materials are copyrighted.

Recommended content options:

- Use public-domain or openly licensed articles.
- Create original IELTS-style passages.
- Store source notes and license information for every article.
- Allow admin import of passages for private study.
- Avoid storing copied official Cambridge IELTS passages unless there is a clear right to use them.

Vocabulary and phrase data options:

- Build an original list from common IELTS reading themes.
- Manually compile and review public learning materials.
- Support importing personal study lists.
- Keep `source_note` fields for traceability.

## 9. Data Model Draft

### Article

- `id`
- `title`
- `difficulty`
- `topic_tags`
- `word_count`
- `content`
- `source_name`
- `source_url`
- `license_note`
- `hit_count`
- `created_at`
- `updated_at`

### ArticleLearningRecord

- `id`
- `user_id`
- `article_id`
- `open_count`
- `progress_percent`
- `completed`
- `words_checked_count`
- `sentences_translated_count`
- `synonym_detail_open_count`
- `last_opened_at`

### SynonymItem

- `id`
- `headword`
- `part_of_speech`
- `chinese_meaning`
- `synonyms`
- `example_sentence`
- `difficulty`
- `tags`
- `source_note`

### VocabularyItem

- `id`
- `word`
- `part_of_speech`
- `chinese_meaning`
- `example_sentence`
- `difficulty`
- `tags`
- `source_note`

### PhraseItem

- `id`
- `phrase`
- `chinese_meaning`
- `example_sentence`
- `paraphrases`
- `difficulty`
- `tags`
- `source_note`

### PracticeRecord

- `id`
- `user_id`
- `item_type`
- `item_id`
- `mode`
- `attempt_count`
- `correct_count`
- `wrong_count`
- `mastery_state`
- `last_practiced_at`

## 10. UI and Visual Direction

The interface should be:

- Minimal.
- Clean.
- Spacious.
- Calm.
- Professional.
- Suitable for long reading sessions.

Recommended style:

- White or very light background.
- Strong typography for article reading.
- Limited accent colors.
- Highlight colors should be meaningful and not visually noisy.
- Article pages should avoid excessive cards and decorations.
- Vocabulary practice pages should feel focused and fast.

Important reading page design goals:

- The article text should be highly readable.
- Translation and definition popovers should not cover too much content.
- The synonym toggle should be easy to find but not distracting.
- Highlighted words should remain readable.

## 11. MVP User Stories

- As a learner, I want to select Easy, Medium, or Hard articles so I can study at the right level.
- As a learner, I want to open an article and read it clearly without distractions.
- As a learner, I want to tap or double-click a word to see a short Chinese definition.
- As a learner, I want to long-press or select a sentence to see a Chinese translation.
- As a learner, I want to turn on synonym highlights so I can notice IELTS paraphrasing patterns.
- As a learner, I want to tap highlighted words to see related substitution words.
- As a learner, I want to practice IELTS reading vocabulary by typing answers.
- As a learner, I want to practice high-frequency phrases by typing answers.
- As a learner, I want to see how many times I have studied each article.
- As a learner, I want to see my progress so I know what to review.

## 12. Version Roadmap

### Version 0.1: Requirements and Prototype

- Product requirements document.
- Basic information architecture.
- Low-fidelity page structure.
- Sample data format.

### Version 0.2: MVP App or Web Prototype

- Article difficulty categories.
- Article list.
- Article reading page.
- Word definition mock interaction.
- Sentence translation mock interaction.
- Synonym highlight toggle with sample data.
- Vocabulary and phrase practice prototype.
- Local learning records.

### Version 0.3: Real Learning Data

- Curated article set.
- Synonym database.
- Vocabulary database.
- Phrase database.
- Better progress tracking.

### Version 0.4: Account and Sync

- User accounts.
- Cross-device learning records.
- Cloud data storage.
- Optional web version synchronization.

### Version 0.5: Content Operations

- Admin import workflow.
- Article metadata editor.
- Vocabulary and phrase editor.
- Source and license tracking.

## 13. Open Questions

These points need confirmation before development:

1. Should the first version be mobile app first, web first, or responsive web first?
2. Will users need login and cross-device sync in the first version?
3. Where will the first batch of articles come from?
4. Should article translations be manually prepared, machine translated, or generated by AI?
5. Should word definitions come from a fixed local dictionary, an API, or an internal curated vocabulary table?
6. How should the app legally handle the Liu Hongbo 538 synonym list?
7. What exactly should `IELTS hit count` mean in the product?
8. Should the product include audio pronunciation in the MVP?
9. Should vocabulary answers require exact matching, fuzzy matching, or manual self-check?
10. Should phrase answers support multiple acceptable spellings or paraphrases?

## 14. Recommendations

Recommended first development direction:

1. Build a responsive web prototype first, then package or rebuild as an app after the learning flow is validated.
2. Start with 9 to 15 sample articles: 3 to 5 for each difficulty.
3. Use a small curated synonym set first, then expand after the highlighting interaction feels good.
4. Treat synonym substitution as the core differentiator.
5. Keep IELTS question-answer training out of the MVP to protect the product focus.
6. Add local learning records early, even before login exists.
7. Define content source and license rules before importing large article or word datasets.

## 15. Success Metrics

Early product metrics:

- Number of articles opened per user.
- Average article reading completion rate.
- Synonym highlight toggle usage rate.
- Number of highlighted items opened.
- Vocabulary practice completion count.
- Phrase practice completion count.
- Vocabulary and phrase accuracy trend.
- Repeat learning count per article.

Qualitative success signals:

- Learners say the app helps them understand passages faster.
- Learners become more sensitive to IELTS synonym substitutions.
- Learners return to review vocabulary and phrases.
- Tutors find the article and synonym system useful for assigning study tasks.

