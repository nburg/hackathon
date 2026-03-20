# Contextual Vocabulary Weaver

A browser extension that passively teaches foreign languages by replacing words on any webpage with their translations, using spaced repetition to focus on the words you need most.

Supports **83 languages** including Spanish, French, Japanese, Tamil, Arabic, Hindi, and more.

---

## Setup (one-time)

The extension uses Chrome's **built-in on-device Translation API** — no internet connection or API key required once set up.

### 1. Install Chrome 131 or later
Check your version at `chrome://settings/help`. Update if needed.

### 2. Enable the required flags
Open each URL below in Chrome, set the dropdown to the specified value, then click **Relaunch**.

| URL | Value |
|-----|-------|
| `chrome://flags/#translation-api` | **Enabled** |
| `chrome://flags/#optimization-guide-on-device-model` | **Enabled BypassPerfRequirement** |

### 3. Download the language model
After relaunching, visit `chrome://on-device-translation-internals` and trigger a download for the **English → [your target language]** pair. This is a one-time download (~50 MB per language).

### 4. Load the extension (dev)
```bash
cd contextual-vocabulary-weaver
npm install
npm run dev
```
Chrome will open with the extension loaded. A setup guide page opens automatically on first install — it checks each step and tells you exactly what's still missing.

---

## How it works

| Phase | Behaviour |
|-------|-----------|
| **Phase 1** | Individual content words (nouns, verbs, adjectives, adverbs) are replaced inline with their translation. Hover to reveal the original. |
| **Phase 2** | Unlocked automatically after mastering enough words. Whole sentences are translated instead. |

Word selection is driven by a **Bayesian Knowledge Tracing** model — words you struggle with appear more often; words you've mastered are retired.

---

## Project structure

```
P3/                          NLP & DOM module (POS tagging, candidate extraction)
contextual-vocabulary-weaver/
  src/
    entrypoints/
      background.ts          Service worker — owns the Translator instance, proxies translation requests
      content/               Translation pipeline injected into every page
      popup/                 Toolbar popup
      dashboard/             Full vocabulary dashboard
      options/               Settings page
  lib/
    constants.ts             Top-200 word lists for all 83 supported languages
    constants-*.ts           Per-language word lists (one file per language)
    translation-pipeline.ts  Orchestrates candidate selection & DOM replacement
    storage-manager.ts       BKT/SRS engine and chrome.storage CRUD
    index.ts                 Public API exports for lib/
  public/
    setup.html               One-time setup guide (opens automatically on install)
```

---

## Development

### Commands

```bash
# Development
npm run dev              # Start WXT dev server with hot reload
npm run dev:firefox      # Start dev server for Firefox

# Building
npm run build            # Production build for Chrome
npm run build:firefox    # Production build for Firefox
npm run zip              # Create distribution ZIP

# Quality Checks
npm run compile          # TypeScript type checking
npm run lint             # Run ESLint (use --fix to auto-fix)
npm run test             # Run tests in watch mode
npm run test:run         # Run all tests once (CI mode)
npm run test:coverage    # Generate coverage report
```

### Testing

The project uses **Vitest** for unit testing with 40+ tests covering:
- **Storage Manager (26 tests)**: BKT algorithm, SRS priority calculation, per-language word statistics
- **Multi-Language (14 tests)**: 83-language support, word list loading, fallback behavior

Run tests before committing:
```bash
npm run test:run    # All tests must pass
npm run lint        # No ESLint errors
npm run compile     # No TypeScript errors
```

### Version Management

**CRITICAL**: The extension version must be synchronized in two files:
- `package.json` → `"version": "X.Y.Z"`
- `wxt.config.ts` → `version: 'X.Y.Z'` (inside the `manifest` block)

Chrome reads the version from `wxt.config.ts`, not `package.json`.

---

## Troubleshooting

**No words are being translated**
Open the setup guide (`chrome-extension://<id>/setup.html`) — it diagnoses each step of the Chrome AI API setup and tells you exactly what to fix.

**`Translator` is undefined in the background service worker**
The flags are not enabled. Follow Step 2 above.

**`availability()` returns `"downloadable"`**
The language model hasn't been downloaded yet. Follow Step 3 above.

**`availability()` returns `"unavailable"`**
The language pair is not supported by Chrome's on-device API. The extension falls back to the MyMemory translation API automatically.

**Words replaced but always in Spanish**
Open the Options page and confirm the target language is set correctly. The background service worker caches the translator per language and will re-warm automatically when you change the setting.

---

## Supported Languages (83)

Afrikaans (af), Albanian (sq), Amharic (am), Arabic (ar), Azerbaijani (az), Basque (eu), Belarusian (be), Bengali (bn), Bosnian (bs), Bulgarian (bg), Burmese (my), Catalan (ca), Chinese Simplified (zh-CN), Chinese Traditional (zh-TW), Croatian (hr), Czech (cs), Danish (da), Dutch (nl), Estonian (et), Filipino (fil), Finnish (fi), French (fr), Frisian (fy), Galician (gl), Georgian (ka), German (de), Greek (el), Gujarati (gu), Hausa (ha), Hebrew (he), Hindi (hi), Hungarian (hu), Icelandic (is), Igbo (ig), Indonesian (id), Irish (ga), Italian (it), Japanese (ja), Kannada (kn), Khmer (km), Korean (ko), Kyrgyz (ky), Lao (lo), Latvian (lv), Lingala (ln), Lithuanian (lt), Luxembourgish (lb), Macedonian (mk), Malay (ms), Malayalam (ml), Maltese (mt), Marathi (mr), Mongolian (mn), Nepali (ne), Norwegian (no), Odia (or), Persian (fa), Polish (pl), Portuguese (pt), Punjabi (pa), Romanian (ro), Russian (ru), Scottish Gaelic (gd), Serbian (sr), Slovak (sk), Slovenian (sl), Somali (so), Spanish (es), Swahili (sw), Swedish (sv), Tagalog (tl), Tajik (tg), Tamil (ta), Telugu (te), Thai (th), Turkish (tr), Ukrainian (uk), Urdu (ur), Uzbek (uz), Vietnamese (vi), Welsh (cy), Zulu (zu)
