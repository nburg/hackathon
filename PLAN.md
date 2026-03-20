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
- [ ] **WCAG 2 accessibility audit** — Review all React entrypoints (popup, options, dashboard) against [WCAG 2 guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/): keyboard navigation, focus management, color contrast, ARIA labels on interactive elements, screen reader support for replaced words (`.cvw-word`, `.cvw-sentence`)

### Depends on
Role 1 (duplicate `background.ts` cleanup) should be done first to avoid confusion, but UI work can proceed in parallel.

---

## Role 3 — Language Expansion & Translation Backend

**Focus:** Make the extension work beyond Spanish and support open-source browsers.

### Tasks
- [ ] **Multi-language architecture** — Replace hardcoded Spanish logic with a language-agnostic pipeline; store the target language in settings (already has `settings.language`) and pass it through the translation pipeline
- [ ] **Common-words key-value store** — Move the "top-N most common words" logic out of inline code into a local data file (`lib/common-words/<lang>.json`); research and populate word lists for at least 2–3 languages; prompt the user to select a language on first run if not set
- [ ] **Third-party translation fallback** — Add support for open-source browsers (Firefox) where `window.ai.translator` / Chrome's built-in Translation API is unavailable; integrate a fallback open-source translation library or API; update the setup page to reflect browser-specific instructions

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
