# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Contextual Vocabulary Weaver** — A browser extension for passive language learning that replaces words and sentences on web pages with Spanish translations, using spaced repetition and Bayesian Knowledge Tracing (BKT).

The extension is built with WXT (Web Extension Toolkit) targeting Manifest V3 / Chrome. The project is divided across 5 contributor tracks:

| Module | Role | Status |
|--------|------|--------|
| P1 | Infrastructure — WXT scaffold, build pipeline, manifest | In progress |
| P2 | Frontend/UI — options page, vocabulary dashboard, hover mechanics | In progress |
| P3 | DOM & NLP — text extraction, POS tagging, candidate API | Complete (47/47 tests) |
| P4 | Translation Pipeline — Chrome AI Translation API, DOM replacement | In progress |
| P5 | Algorithm & Data — spaced repetition (BKT), chrome.storage | Planned |

## Repository Structure

```
P3/               # DOM & NLP module (standalone npm package)
  src/            # TypeScript source
  tests/          # Vitest unit tests
  dist/           # Compiled output (Node + browser bundle)
```

P1–P2 and P4–P5 modules are expected to live at the same level as P3 once implemented.

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

## Extension Architecture (P1–P4)

The WXT extension uses Manifest V3 with:
- **Background service worker** — hosts the Chrome AI `Translator` instance (must be created there, as `window.translation` requires a service worker context in some builds)
- **Content scripts** — injected into web pages; calls into P3 for candidate extraction and P4 for replacement
- **Options page** — built with React or Vue; density slider, per-site toggle, language selector
- **Dashboard** — vocabulary progress view wired to P5 storage

The Chrome AI Translation API (`window.translation` / `Translator`) requires a one-time model download triggered by a user gesture. The download flow and "not supported" fallback are owned by P4 (logic) and P2 (UI).

## Phase Model

- **Phase 1** — Isolated word replacement (current target). P4 passes single tokens to the translation API.
- **Phase 2** — Sentence-level replacement, unlocked when P5's BKT reports `P(Known) >= 0.85` for enough of the top-200 Spanish words. P3's `getSentenceForCandidate()` is the hook for extracting sentence context.
