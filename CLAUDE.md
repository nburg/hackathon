# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Contextual Vocabulary Weaver** — A browser extension for passive language learning that replaces words and sentences on web pages with Spanish translations, using spaced repetition and Bayesian Knowledge Tracing (BKT).

The extension is built with WXT (Web Extension Toolkit) targeting Manifest V3 / Chrome. The project is divided across 5 contributor tracks:

| Module | Role | Status |
|--------|------|--------|
| P1 | Infrastructure — WXT scaffold, build pipeline, manifest | Complete |
| P2 | Frontend/UI — options page, vocabulary dashboard, hover mechanics | Complete |
| P3 | DOM & NLP — text extraction, POS tagging, candidate API | Complete (47/47 tests) |
| P4 | Translation Pipeline — Chrome AI Translation API, DOM replacement | Complete |
| P5 | Algorithm & Data — spaced repetition (BKT), chrome.storage | Complete |

## Repository Structure

```
P3/                                  # DOM & NLP module (standalone npm package)
  src/                               # TypeScript source
  tests/                             # Vitest unit tests
  dist/                              # Compiled output (Node + browser bundle)

contextual-vocabulary-weaver/        # WXT browser extension (P1–P5 integrated)
  lib/                               # Shared logic (not bundled by WXT directly)
    index.ts                         # SRS/storage public API (re-exports everything)
    storage-manager.ts               # BKT engine, word tracking, chrome.storage
    translation-pipeline.ts          # P4: candidate selection, DOM replacement, Phase 1 & 2
    types.ts                         # Shared TypeScript types and storage schema
    constants.ts                     # TOP_200_COMMON_WORDS, getTop200ForLanguage(), thresholds
    constants-*.ts                   # Per-language top-200 word lists (one file per language)
  src/
    entrypoints/
      background.ts                  # Service worker: owns Translator instance, proxies translate messages
      content/index.ts               # Injected into pages: runs TranslationPipeline on load
      popup/                         # Toolbar popup (React): status, word count, nav links
      options/                       # Settings page (React): density slider, enable toggle, site filter
      dashboard/                     # Vocabulary dashboard (React): word cards, progress indicator
    components/
      ui/                            # Reusable UI: Button, Card, Toggle, Slider, Spinner, ErrorBoundary
      dashboard/                     # Dashboard-specific: WordCard, ProgressIndicator
    lib/
      hooks/useSettings.ts           # React hook: reads/writes settings via chrome.storage
      hooks/useVocabulary.ts         # React hook: reads word stats for current language; reloads on language change
      storage/api.ts                 # chrome.storage helpers; settings in sync storage (cvw_settings), word stats in local (word_stats_<lang>)
    types/index.ts                   # Extension-level TypeScript types
  public/
    setup.html / setup.js            # One-time onboarding page (checks Chrome AI flags)
```

## P3: DOM & NLP Module

The only fully implemented module. It is a standalone npm package — develop and test it independently of the WXT extension scaffold.

### Commands (run from `P3/`)

```bash
npm install
npm run build          # tsc + browser bundle
npm run build:browser  # browser bundle only (esbuild via build-browser.js)
npm test               # vitest (47 tests)
npm test -- --watch
npm run demo           # build + tsx demo.ts
```

To test in a browser:
```bash
npm run build
npx http-server . -p 8080 --cors
# then open http://localhost:8080/browser-test-v2.html
```

### Architecture

- `src/dom/walker.ts` — TreeWalker-based DOM traversal; skips `<code>`, `<pre>`, `<script>`, `<style>`, nav/footer elements, hidden elements, and ARIA landmark roles
- `src/nlp/tagger.ts` — POS tagging via compromise.js; identifies Nouns/Verbs/Adjectives/Adverbs, proper nouns, and multi-word expressions
- `src/extractor.ts` — Combines walker + tagger into `extractCandidates(root, config) => WordCandidate[]`
- `src/index.ts` — Public API exports: `extractCandidates`, `filterCandidates`, `groupCandidatesByElement`, `getSentenceForCandidate`

`dist/index.js` is the Node/module version; `dist/browser.js` is the esbuild bundle (624KB, includes compromise.js) for use in the browser without a bundler.

### Key Integration Contracts

```
P3.extractCandidates()  --> P4 (word candidate list for translation)
P5.getWordPriority()    --> P4 (SRS score for word selection)
P2 density setting      --> P4 (what % of candidates to swap)
P5 phase2Trigger()      --> P4 (switch from word to sentence replacement)
P5 read API             --> P2 (dashboard: exposure counts, P(Known))
```

Each `WordCandidate` carries: `word`, `pos`, `node` (DOM Text), `offset`, `length`, `isProperNoun`, `isMultiWord`. P4 uses `node`/`offset`/`length` to perform in-place DOM replacement.

`WordStats` (in `lib/types.ts`) now includes a `translation` field populated on first replacement and surfaced in the dashboard.

## Extension: Commands (run from `contextual-vocabulary-weaver/`)

```bash
npm install
npm run dev          # WXT dev server with HMR (Chrome)
npm run build        # Production build
npm run compile      # TypeScript type-check only (tsc --noEmit)
npm run lint         # ESLint over src/
```

## Release Process

When cutting a new release:

1. **Update the version** in two places (both must match):
   - `contextual-vocabulary-weaver/package.json` → `"version": "X.Y.Z"`
   - `contextual-vocabulary-weaver/wxt.config.ts` → `version: 'X.Y.Z'` inside the `manifest` block
   > `wxt.config.ts` is what Chrome reads — `package.json` alone is not enough.

2. **Commit and push** the version bump to main.

3. **Create and push a git tag:**
   ```bash
   git tag vX.Y
   git push origin vX.Y
   ```

4. **Build:**
   ```bash
   cd contextual-vocabulary-weaver
   npm run build
   ```

Always make sure any codebase changes pass linting checks before pushing.

---


## Extension Architecture

The WXT extension uses Manifest V3 with React + Tailwind. All entrypoints are under `src/entrypoints/`.

- **Background service worker** (`entrypoints/background.ts`) — owns the Chrome AI `Translator` instance. Content scripts cannot call `Translator.create()` directly; they send `{ type: 'translate', text }` messages and the background proxies the call.
- **Content script** (`entrypoints/content/index.ts`) — runs `TranslationPipeline.run(density)` on each page load. Reads settings and the enabled/disabled state from storage before running.
- **`lib/translation-pipeline.ts`** — core P4 logic: calls P3's `extractCandidates`, scores with P5's `getWordPriority`, selects top-N% by density, wraps words in `[[markers]]` for context-aware translation, splits text nodes and replaces with `.cvw-word` / `.cvw-sentence` spans. Hover events on spans fire `trackRecallFailure`.
- **`lib/storage-manager.ts`** — BKT engine and all `chrome.storage` reads/writes. Exports the full public API via `lib/index.ts`.
- **Options page** — density slider (1–10%), global enable toggle, per-site regex filter, language selector (83 languages via `SUPPORTED_LANGUAGES` in `src/lib/storage/api.ts`; defaults to Spanish).
- **Dashboard** — word cards sorted by `lastSeen`, overall progress via `ProgressIndicator`. Displays language name dynamically; includes a per-language "Reset Progress" button.

The Chrome AI `Translator` API requires Chrome 131+ with `#translation-api` and `#optimization-guide-on-device-model` flags enabled, plus a one-time ~50 MB model download. The `public/setup.html` page guides users through this and is opened automatically on first install.

**Storage split**: P2's UI layer stores settings under key `cvw_settings` in `chrome.storage.sync`. P5's engine stores settings under `settings` and word stats under `word_stats_<langCode>` in `chrome.storage.local`. `saveSettings()` in `src/lib/storage/api.ts` bridges language changes between the two schemas.

## Phase Model

- **Phase 1** — Isolated word replacement (current target). P4 passes single tokens to the translation API.
- **Phase 2** — Sentence-level replacement, unlocked when the user knows ≥ 70% of the top-200 words in their target language (`checkAndTriggerPhase2` in `lib/storage-manager.ts`). P3's `getSentenceForCandidate()` is the hook for extracting sentence context. The transition is currently silent — see `contextual-vocabulary-weaver/UX_SUGGESTIONS.md` for known UX issues.
