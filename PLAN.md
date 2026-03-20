# Next Steps — Collaborative Plan

Based on `nextsteps.md` and `REMAINING-TASKS.md`. Tasks are split across 4 roles.

---

## Role 1 — Infrastructure & Code Quality

**Focus:** Clean up the codebase, fix structural issues, enforce standards.

### Tasks
- [ ] **Security review** — Audit `content/index.ts`, `translation-pipeline.ts`, and storage API for XSS vectors (DOM injection), overly broad manifest permissions, and unsafe `eval`/`innerHTML` usage
- [ ] **Code review: DRY & efficiency** — Review `lib/` and `entrypoints/` for duplicated logic; consolidate shared utilities; enforce consistent TypeScript types across modules
- [ ] **Linting setup** — Confirm ESLint + Prettier are enforced in CI; fix any existing lint violations

### Depends on
Nothing — can start immediately.

---

## Role 2 — Frontend / UI & Accessibility

**Focus:** Complete the remaining UI surfaces and make the extension WCAG 2 compliant.

### Tasks
- [x] **WCAG 2 accessibility audit** — Added `aria-label` to Toggle inputs and all popup buttons; `role="status"` on status banners
- [x] **Enable/disable toggle in popup** — Replaced static status dot with interactive `Toggle` component wired to `updateSettings`
- [x] **Dynamic popup description** — Derives language name from `LANGUAGE_LABELS` map keyed on `settings.language`
- [x] **Density slider clarity** — Label and helper text now show e.g. "5% of words replaced" and the computed language name
- [x] **"Disable on this site" quick control** — Button queries active tab hostname, stores it in new `disabledSites` field; content script skips pages whose hostname is listed
- [x] **Phase 2 transition notification** — Background listens for `currentPhase: 2` in storage and sets extension badge to "2" (purple)
- [x] **Hide Setup Guide for established users** — Setup Guide button only renders when `totalTracked === 0`

### Depends on
Role 1 (duplicate `background.ts` cleanup) should be done first to avoid confusion, but UI work can proceed in parallel.

---

## Role 3 — Language Expansion & Translation Backend

**Focus:** Make the extension work beyond Spanish and support open-source browsers.

### Tasks
- [ ] **Multi-language architecture** — Replace hardcoded Spanish logic with a language-agnostic pipeline; store the target language in settings (already has `settings.language`) and pass it through the translation pipeline
- [ ] **Common-words key-value store** — Move the "top-N most common words" logic out of inline code into a local data file (`lib/common-words/<lang>.json`); research and populate word lists for at least 2–3 languages; prompt the user to select a language on first run if not set
### Depends on
Role 1 code review (to avoid building on top of code flagged for refactor).

---

## Role 4 — Testing & Documentation

**Focus:** Prevent regressions and keep docs in sync with the code. Do this after Roles 1–3 are complete.

### Tasks
- [ ] **Add tests for translation pipeline** — Write Vitest/Jest unit tests for `translation-pipeline.ts`: candidate selection, DOM replacement, density filtering, Phase 1/2 switching
- [ ] **Add tests for storage/SRS layer** — Unit tests for `lib/storage/api.ts` and the SRS priority functions using a mock `chrome.storage`
- [ ] **Add tests for new language support** — Test that the common-words store loads correctly for each supported language; test the language-selection prompt flow
- [ ] **Update README.md** — Reflect new languages, Firefox support, and any changed setup steps; remove stale Chrome-only instructions where applicable
- [ ] **Update `CLAUDE.md`** — Add the `contextual-vocabulary-weaver/` extension structure (entrypoints, lib, components) and the commands to build/run it

### Depends on
Roles 1, 2, and 3 should be substantially complete before finalizing documentation.

---

## Sequencing Summary

```
Role 1 (Infra/Code Quality)  ──┐
                                ├──> Role 4 (Tests & Docs)
Role 2 (UI & Accessibility)  ──┤
                                │
Role 3 (Languages & Backend) ──┘
```

Roles 1, 2, and 3 can run in parallel. Role 4 finalizes after the others.
