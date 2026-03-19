# Contextual Vocabulary Weaver

A browser extension that passively teaches Spanish by replacing words on any webpage with their Spanish translations, using spaced repetition to focus on the words you need most.

---

## Setup (one-time)

The extension relies on Chrome's **built-in on-device Translation API** — no internet connection or API key required once set up.

### 1. Install Chrome 131 or later
Check your version at `chrome://settings/help`. Update if needed.

### 2. Enable the required flags
Open each URL below in Chrome, set the dropdown to the specified value, then click **Relaunch**.

| URL | Value |
|-----|-------|
| `chrome://flags/#translation-api` | **Enabled** |
| `chrome://flags/#optimization-guide-on-device-model` | **Enabled BypassPerfRequirement** |

### 3. Download the language model
After relaunching, visit `chrome://on-device-translation-internals` and trigger a download for the **English → Spanish** language pair. This is a one-time download of ~50 MB.

### 4. Load the extension (dev)
```bash
cd contextual-vocabulary-weaver
npm install
npm run dev
```
Chrome will open with the extension loaded. A setup guide page opens automatically — it checks each step and tells you exactly what's still missing.

---

## How it works

| Phase | Behaviour |
|-------|-----------|
| **Phase 1** | Individual content words (nouns, verbs, adjectives, adverbs) are replaced inline with their Spanish translation. Hover to reveal the original. |
| **Phase 2** | Unlocked automatically after mastering enough words. Whole sentences are translated instead. |

Word selection is driven by a **Bayesian Knowledge Tracing** model — words you struggle with appear more often; words you've mastered are retired.

---

## Project structure

```
P3/                          NLP & DOM module (POS tagging, candidate extraction)
contextual-vocabulary-weaver/
  src/
    entrypoints/
      background.ts          Service worker (opens setup page on install)
      content/               Translation pipeline injected into every page
      popup/                 Toolbar popup
      dashboard/             Full vocabulary dashboard
      options/               Settings page
  lib/
    translation-pipeline.ts  Orchestrates candidate selection & DOM replacement
    index.ts                 SRS / BKT priority engine
  public/
    setup.html               One-time setup guide (opens automatically)
```

---

## Troubleshooting

**No words are being translated**
Run the setup guide (`chrome-extension://<id>/setup.html`) — it diagnoses each step of the Chrome AI API setup and tells you exactly what to fix.

**`window.ai.translator` is undefined**
The flags are not enabled. Follow Step 2 above.

**`availability()` returns `downloadable`**
The language model hasn't been downloaded yet. Follow Step 3 above.
