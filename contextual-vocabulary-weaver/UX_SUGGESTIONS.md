# UX Suggestions

## 1. Enable/disable toggle directly in the popup

The popup only shows a non-interactive status indicator (Active/Paused). To actually
toggle the extension the user must navigate to Settings. Adding a toggle directly to
the popup would save 2-3 clicks for the most common action.

**Relevant file:** `src/entrypoints/popup/App.tsx`

---

## 2. Translations are blank in the dashboard (fixed)

`WordCard` rendered `word.translation` but `transformWordStats` hardcoded
`translation: ''`. Every dashboard card showed the English word with nothing below it.
The translation is now stored when a word is first replaced and surfaced in the
dashboard.

**Relevant files:** `lib/types.ts`, `lib/storage-manager.ts`,
`lib/translation-pipeline.ts`, `src/lib/storage/api.ts`

---

## 3. Popup description is hardcoded to Spanish

`popup/App.tsx` displays "Learn Spanish passively!" regardless of the language
selected in settings. This will be incorrect for French users.

**Relevant file:** `src/entrypoints/popup/App.tsx` (line 57)

---

## 4. Density slider labeling is ambiguous

The slider is labeled 1-10 but the helper text reads "1% = Few words ... 10% = Many
words". The word "percentage" and the integer scale appear together, making it unclear
whether 5 means five words, 5%, or 50%. Showing the computed percentage inline (e.g.
"5% of words replaced") would remove the ambiguity.

**Relevant file:** `src/entrypoints/options/App.tsx`

---

## 5. No per-site quick control

Site filtering requires writing a regex pattern in Settings, which is a barrier for
most users. A "Disable on this site" button in the popup that appends the current
hostname to `enabledSites` would be far more approachable.

**Relevant files:** `src/entrypoints/popup/App.tsx`, `src/lib/storage/api.ts`

---

## 6. Phase 2 transition is invisible to the user

The extension silently switches from word-level to sentence-level replacement when the
BKT threshold is reached (`checkAndTriggerPhase2` in `lib/storage-manager.ts`). Users
have no indication this happened or what it means. A notification or popup badge change
on transition would make the learning progression feel intentional.

**Relevant files:** `lib/storage-manager.ts`, `src/entrypoints/background.ts`

---

## 7. Setup Guide button always visible

The popup always shows a "Setup Guide" button even for established users. It could be
hidden once `vocabulary.totalTracked > 0`, freeing space for something more useful.

**Relevant file:** `src/entrypoints/popup/App.tsx`
