# Remaining Tasks Before Demo

## P2 — Frontend / UI Engineer

- [ ] **Settings/Options UI** — Replace the current popup (P5's debug harness) with the real settings panel: density slider (1%–10%), enable/disable toggle, language display
- [ ] **Vocabulary Dashboard** — Build the word progress view; P5's `getLearningSummary()`, `getAllWordStats()`, and `getRecentWords()` are ready to consume
- [ ] **Popup title** — Update `entrypoints/popup/index.html` from "Default Popup Title"

## P1 — Infrastructure Lead

- [ ] **Remove duplicate `background.ts`** — Both `entrypoints/background.ts` and `src/entrypoints/background.ts` exist; remove the unused one

---

## Done

- [x] P1: Scaffold, WXT config, CI
- [x] P3: DOM walker, NLP tagger, `extractCandidates` API (47 tests passing)
- [x] P4: Phase 1 word-level pipeline, Phase 2 sentence-level pipeline, P5 SRS integration, density + settings from storage, Phase 2 trigger
- [x] P5: Storage layer, SRS engine, `getWordPriority`, `trackExposure`, `trackRecallFailure`, `checkAndTriggerPhase2`
- [x] P2: `.cvw-word` and `.cvw-sentence` styles (dark mode + reduced motion included)
- [x] P4: TypeScript compilation clean (`@types/chrome`, tsconfig path aliases, type assertions)
