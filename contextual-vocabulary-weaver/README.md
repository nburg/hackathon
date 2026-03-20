# Contributing to Contextual Vocabulary Weaver

## Initial Setup

1. Clone the repository:
   `git clone https://github.com/nburg/hackathon`
2. Navigate into the extension directory:
   `cd contextual-vocabulary-weaver`
3. Install dependencies:
   `npm install`

## Development

1. Start the development server:
   `npm run dev`
2. A new Chrome window will automatically open with the extension loaded.
3. Edits to files in `src/` will automatically reload the extension in that browser window.

## Building

```bash
npm run build       # production build
npm run dev         # dev build with hot reload
```

## Code Standards

```bash
npm run lint        # check for lint errors (covers src/ and lib/)
```

Lint is also enforced in CI on every push and pull request (`.github/workflows/lint.yml`).

## Folder Structure

```
src/
  entrypoints/
    background.ts        Service worker — owns Translator, handles translation proxy
    content/
      index.ts           Content script — extracts candidates and drives replacements
      styles.css         Styles for translated word highlights
    popup/               Toolbar popup (React)
    dashboard/           Vocabulary progress dashboard (React)
    options/             Settings page (React)
  lib/
    storage/
      api.ts             Chrome storage helpers used by UI entrypoints
  types/
    index.ts             Shared TypeScript types for the extension

lib/                     Shared algorithm/data layer (imported by both src/ and tests)
  constants.ts           Top-200 word lists + getTop200ForLanguage() for all 83 languages
  constants-*.ts         Per-language word lists
  storage-manager.ts     BKT/SRS engine and chrome.storage CRUD
  translation-pipeline.ts  Candidate selection & DOM replacement logic
  types.ts               Core data types (WordStats, ExtensionSettings, etc.)
  index.ts               Public exports for lib/

public/
  setup.html             One-time setup guide page
  setup.js               Setup guide logic (external JS required by MV3 CSP)
```

## Key Concepts

- **Language support**: 83 languages via `getTop200ForLanguage(langCode)` in `lib/constants.ts`.
- **Translation**: The background service worker owns the `Translator` instance and proxies requests from content scripts via `browser.runtime.sendMessage({ type: 'translate', text })`.
- **SRS**: `lib/storage-manager.ts` implements Bayesian Knowledge Tracing to prioritise which words to show.
- **Phase 2**: Sentence-level replacement is unlocked automatically when the user knows ≥ 70% of the top-200 words in their target language.
