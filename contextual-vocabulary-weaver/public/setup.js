// ── language registry ──────────────────────────────────────────────────────────
// Keep in sync with src/lib/storage/api.ts :: SUPPORTED_LANGUAGES
const SUPPORTED_LANGUAGES = [
  { code: 'af',    label: 'Afrikaans',             flag: '🇿🇦' },
  { code: 'sq',    label: 'Albanian',              flag: '🇦🇱' },
  { code: 'am',    label: 'Amharic',               flag: '🇪🇹' },
  { code: 'ar',    label: 'Arabic',                flag: '🇸🇦' },
  { code: 'az',    label: 'Azerbaijani',           flag: '🇦🇿' },
  { code: 'eu',    label: 'Basque',                flag: '🇪🇸' },
  { code: 'be',    label: 'Belarusian',            flag: '🇧🇾' },
  { code: 'bn',    label: 'Bengali',               flag: '🇧🇩' },
  { code: 'bs',    label: 'Bosnian',               flag: '🇧🇦' },
  { code: 'bg',    label: 'Bulgarian',             flag: '🇧🇬' },
  { code: 'my',    label: 'Burmese',               flag: '🇲🇲' },
  { code: 'ca',    label: 'Catalan',               flag: '🇪🇸' },
  { code: 'zh-CN', label: 'Chinese (Simplified)',  flag: '🇨🇳' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'hr',    label: 'Croatian',              flag: '🇭🇷' },
  { code: 'cs',    label: 'Czech',                 flag: '🇨🇿' },
  { code: 'da',    label: 'Danish',                flag: '🇩🇰' },
  { code: 'nl',    label: 'Dutch',                 flag: '🇳🇱' },
  { code: 'et',    label: 'Estonian',              flag: '🇪🇪' },
  { code: 'fil',   label: 'Filipino',              flag: '🇵🇭' },
  { code: 'fi',    label: 'Finnish',               flag: '🇫🇮' },
  { code: 'fr',    label: 'French',                flag: '🇫🇷' },
  { code: 'fy',    label: 'Frisian',               flag: '🇳🇱' },
  { code: 'gl',    label: 'Galician',              flag: '🇪🇸' },
  { code: 'ka',    label: 'Georgian',              flag: '🇬🇪' },
  { code: 'de',    label: 'German',                flag: '🇩🇪' },
  { code: 'el',    label: 'Greek',                 flag: '🇬🇷' },
  { code: 'gu',    label: 'Gujarati',              flag: '🇮🇳' },
  { code: 'ha',    label: 'Hausa',                 flag: '🇳🇬' },
  { code: 'he',    label: 'Hebrew',                flag: '🇮🇱' },
  { code: 'hi',    label: 'Hindi',                 flag: '🇮🇳' },
  { code: 'hu',    label: 'Hungarian',             flag: '🇭🇺' },
  { code: 'is',    label: 'Icelandic',             flag: '🇮🇸' },
  { code: 'ig',    label: 'Igbo',                  flag: '🇳🇬' },
  { code: 'id',    label: 'Indonesian',            flag: '🇮🇩' },
  { code: 'ga',    label: 'Irish',                 flag: '🇮🇪' },
  { code: 'it',    label: 'Italian',               flag: '🇮🇹' },
  { code: 'ja',    label: 'Japanese',              flag: '🇯🇵' },
  { code: 'kn',    label: 'Kannada',               flag: '🇮🇳' },
  { code: 'km',    label: 'Khmer',                 flag: '🇰🇭' },
  { code: 'ko',    label: 'Korean',                flag: '🇰🇷' },
  { code: 'ky',    label: 'Kyrgyz',                flag: '🇰🇬' },
  { code: 'lo',    label: 'Lao',                   flag: '🇱🇦' },
  { code: 'lv',    label: 'Latvian',               flag: '🇱🇻' },
  { code: 'ln',    label: 'Lingala',               flag: '🇨🇩' },
  { code: 'lt',    label: 'Lithuanian',            flag: '🇱🇹' },
  { code: 'lb',    label: 'Luxembourgish',         flag: '🇱🇺' },
  { code: 'mk',    label: 'Macedonian',            flag: '🇲🇰' },
  { code: 'ms',    label: 'Malay',                 flag: '🇲🇾' },
  { code: 'ml',    label: 'Malayalam',             flag: '🇮🇳' },
  { code: 'mt',    label: 'Maltese',               flag: '🇲🇹' },
  { code: 'mr',    label: 'Marathi',               flag: '🇮🇳' },
  { code: 'mn',    label: 'Mongolian',             flag: '🇲🇳' },
  { code: 'ne',    label: 'Nepali',                flag: '🇳🇵' },
  { code: 'no',    label: 'Norwegian',             flag: '🇳🇴' },
  { code: 'or',    label: 'Odia',                  flag: '🇮🇳' },
  { code: 'fa',    label: 'Persian',               flag: '🇮🇷' },
  { code: 'pl',    label: 'Polish',                flag: '🇵🇱' },
  { code: 'pt',    label: 'Portuguese',            flag: '🇵🇹' },
  { code: 'pa',    label: 'Punjabi',               flag: '🇮🇳' },
  { code: 'ro',    label: 'Romanian',              flag: '🇷🇴' },
  { code: 'ru',    label: 'Russian',               flag: '🇷🇺' },
  { code: 'gd',    label: 'Scots Gaelic',          flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'sr',    label: 'Serbian',               flag: '🇷🇸' },
  { code: 'sk',    label: 'Slovak',                flag: '🇸🇰' },
  { code: 'sl',    label: 'Slovenian',             flag: '🇸🇮' },
  { code: 'so',    label: 'Somali',                flag: '🇸🇴' },
  { code: 'es',    label: 'Spanish',               flag: '🇪🇸' },
  { code: 'sw',    label: 'Swahili',               flag: '🇰🇪' },
  { code: 'sv',    label: 'Swedish',               flag: '🇸🇪' },
  { code: 'tl',    label: 'Tagalog',               flag: '🇵🇭' },
  { code: 'tg',    label: 'Tajik',                 flag: '🇹🇯' },
  { code: 'ta',    label: 'Tamil',                 flag: '🇮🇳' },
  { code: 'te',    label: 'Telugu',                flag: '🇮🇳' },
  { code: 'th',    label: 'Thai',                  flag: '🇹🇭' },
  { code: 'tr',    label: 'Turkish',               flag: '🇹🇷' },
  { code: 'uk',    label: 'Ukrainian',             flag: '🇺🇦' },
  { code: 'ur',    label: 'Urdu',                  flag: '🇵🇰' },
  { code: 'uz',    label: 'Uzbek',                 flag: '🇺🇿' },
  { code: 'vi',    label: 'Vietnamese',            flag: '🇻🇳' },
  { code: 'cy',    label: 'Welsh',                 flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'zu',    label: 'Zulu',                  flag: '🇿🇦' },
];

// Per-language runtime state
// availability: 'checking' | 'available' | 'downloadable' | 'downloading' | 'unavailable'
const langState = {};
for (const l of SUPPORTED_LANGUAGES) {
  langState[l.code] = { availability: 'checking', translator: null, testDebounce: null };
}

// Active language — mirrors cvw_settings.language in chrome.storage.sync
let activeLang = 'es';

async function loadActiveLang() {
  try {
    const result = await chrome.storage.sync.get('cvw_settings');
    activeLang = result['cvw_settings']?.language ?? 'es';
  } catch (_) {}
}

async function setActiveLang(code) {
  activeLang = code;
  // Mirror saveSettings() from src/lib/storage/api.ts
  const result = await chrome.storage.sync.get('cvw_settings');
  const current = result['cvw_settings'] ?? {};
  await chrome.storage.sync.set({ cvw_settings: { ...current, language: code } });
  const p5Result = await chrome.storage.local.get('settings');
  const p5Current = p5Result['settings'] ?? {};
  await chrome.storage.local.set({ settings: { ...p5Current, targetLanguage: code } });
  // Refresh all available rows so Active/Use buttons update
  for (const l of SUPPORTED_LANGUAGES) {
    if (langState[l.code].availability === 'available') updateLangRow(l.code);
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function setStep(id, state, message) {
  const card   = document.getElementById('step-' + id);
  const icon   = document.getElementById('icon-' + id);
  const status = document.getElementById('status-' + id);

  card.className = 'card step-card ' +
    (state === 'ok' ? 'done' : state === 'active' ? 'active' : state === 'error' ? 'error' : '');
  icon.textContent = state === 'ok' ? '✓' : state === 'error' ? '✗' : (icon.dataset.num ?? icon.textContent);

  if (status) {
    status.style.display = '';
    status.className = 'status-bar ' +
      (state === 'ok' ? 'ok' : state === 'active' ? 'checking' : state === 'error' ? 'error' : 'warning');
    status.textContent = message;
  }
}

function copyText(elemId, btn) {
  const text = document.getElementById(elemId).textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1800);
  });
}

// Detect which API shape is present and return a descriptor object.
function detectAPI() {
  if (typeof window.Translator === 'function') {
    return { api: window.Translator, shape: 'new' };       // Chrome 138+
  }
  if (window.ai?.translator) {
    return { api: window.ai.translator, shape: 'ai' };     // Chrome 131–137
  }
  if (window.translation) {
    return { api: window.translation, shape: 'legacy' };   // Chrome 122–130
  }
  return null;
}

async function getAvailability(detected, code) {
  if (detected.shape === 'legacy') {
    const r = await detected.api.canTranslate({ sourceLanguage: 'en', targetLanguage: code });
    return r === 'readily' ? 'available' : r === 'after-download' ? 'downloadable' : 'unavailable';
  }
  return detected.api.availability({ sourceLanguage: 'en', targetLanguage: code });
}

async function createTranslator(detected, code) {
  if (detected.shape === 'legacy') {
    return detected.api.createTranslator({ sourceLanguage: 'en', targetLanguage: code });
  }
  return detected.api.create({ sourceLanguage: 'en', targetLanguage: code });
}

// ── lang-row DOM helpers ───────────────────────────────────────────────────────

function getChipClass(availability) {
  return {
    checking:    'chip-checking',
    available:   'chip-available',
    downloading: 'chip-downloading',
    downloadable:'chip-unavailable',
    unavailable: 'chip-unavailable',
  }[availability] ?? 'chip-checking';
}

function getChipLabel(availability) {
  return {
    checking:    'Checking…',
    available:   'Ready',
    downloading: 'Downloading…',
    downloadable:'Not downloaded',
    unavailable: 'Unavailable',
  }[availability] ?? 'Checking…';
}

function updateLangRow(code) {
  const chip     = document.getElementById('chip-' + code);
  const btn      = document.getElementById('dl-btn-' + code);
  const progress = document.getElementById('progress-' + code);
  const row      = document.getElementById('lang-row-' + code);
  if (!chip || !btn) return;

  const av = langState[code].availability;
  chip.className = 'lang-status-chip ' + getChipClass(av);
  chip.textContent = getChipLabel(av);

  const isDownloading = av === 'downloading';
  if (progress) progress.style.display = isDownloading ? '' : 'none';
  if (row) row.classList.toggle('is-downloading', isDownloading);

  const useBtn     = document.getElementById('use-btn-' + code);
  const activeChip = document.getElementById('active-chip-' + code);

  if (av === 'available') {
    btn.style.display = 'none';
    if (code === activeLang) {
      if (useBtn)     useBtn.style.display = 'none';
      if (activeChip) activeChip.style.display = '';
    } else {
      if (useBtn)     useBtn.style.display = '';
      if (activeChip) activeChip.style.display = 'none';
    }
  } else {
    if (useBtn)     useBtn.style.display = 'none';
    if (activeChip) activeChip.style.display = 'none';
  }

  if (av === 'available') {
    // already handled above
  } else if (av === 'downloadable') {
    btn.style.display = '';
    btn.disabled = false;
    btn.textContent = 'Download';
    btn.className = 'lang-dl-btn';
  } else if (isDownloading) {
    btn.style.display = 'none';
  } else {
    // unavailable / checking — offer to open internals page
    btn.style.display = '';
    btn.disabled = false;
    btn.textContent = 'Open Chrome download page';
    btn.className = 'lang-dl-btn btn-open';
  }

  sortLangRows();
  filterLangRows();
}

// Sort priority: available → downloadable → downloading → checking → unavailable
// Within each group: alphabetical by label.
const SORT_PRIORITY = { available: 0, downloadable: 1, downloading: 2, checking: 3, unavailable: 4 };

function sortLangRows() {
  const container = document.getElementById('lang-rows');
  const rows = Array.from(container.querySelectorAll('.lang-row'));

  rows.sort((a, b) => {
    const codeA = a.id.slice('lang-row-'.length);
    const codeB = b.id.slice('lang-row-'.length);
    if (codeA === activeLang) return -1;
    if (codeB === activeLang) return 1;
    const pA = SORT_PRIORITY[langState[codeA]?.availability] ?? 3;
    const pB = SORT_PRIORITY[langState[codeB]?.availability] ?? 3;
    if (pA !== pB) return pA - pB;
    const labelA = SUPPORTED_LANGUAGES.find(l => l.code === codeA)?.label ?? '';
    const labelB = SUPPORTED_LANGUAGES.find(l => l.code === codeB)?.label ?? '';
    return labelA.localeCompare(labelB);
  });

  rows.forEach(row => container.appendChild(row));
}

function filterLangRows() {
  const query = (document.getElementById('lang-search')?.value ?? '').toLowerCase().trim();
  const rows = document.querySelectorAll('.lang-row');
  let visibleCount = 0;

  rows.forEach(row => {
    const code = row.id.slice('lang-row-'.length);
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    const matches = !query ||
      lang.label.toLowerCase().includes(query) ||
      code.toLowerCase().includes(query);
    row.style.display = matches ? '' : 'none';
    if (matches) visibleCount++;
  });

  const noResults = document.getElementById('lang-no-results');
  if (noResults) noResults.style.display = visibleCount === 0 && query ? '' : 'none';
}

function buildLangRows() {
  const container = document.getElementById('lang-rows');
  container.innerHTML = '';
  for (const { code, label, flag } of SUPPORTED_LANGUAGES) {
    const row = document.createElement('div');
    row.className = 'lang-row';
    row.id = 'lang-row-' + code;
    row.innerHTML = `
      <div class="lang-row-main">
        <div class="lang-row-info">
          <span class="lang-flag">${flag}</span>
          <span class="lang-name">${label}</span>
          <span class="lang-status-chip chip-checking" id="chip-${code}">Checking…</span>
        </div>
        <button class="lang-use-btn" id="use-btn-${code}" style="display:none">Use</button>
        <span class="lang-active-chip" id="active-chip-${code}" style="display:none">✓ Active</span>
        <button class="lang-dl-btn" id="dl-btn-${code}" style="display:none">Download</button>
      </div>
      <div id="progress-${code}" style="display:none; margin-top:0.6rem;">
        <div class="progress-wrap" style="margin-top:0;">
          <div class="progress-bar indeterminate"></div>
        </div>
        <p style="font-size:0.75rem; color:#a78bfa; margin-top:0.35rem;">
          Downloading translation model — this may take a minute…
        </p>
      </div>
    `;
    container.appendChild(row);

    document.getElementById('dl-btn-' + code).addEventListener('click', () => {
      handleDownloadClick(code);
    });
    document.getElementById('use-btn-' + code).addEventListener('click', () => {
      setActiveLang(code);
    });
  }
}

async function handleDownloadClick(code) {
  const av = langState[code].availability;
  const detected = detectAPI();

  if (av === 'unavailable' || av === 'checking' || !detected) {
    // Can't use chrome.tabs in a plain HTML page opened outside extension context,
    // but setup.html IS served from the extension, so chrome APIs are available.
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'chrome://on-device-translation-internals/' });
    } else {
      window.open('chrome://on-device-translation-internals/', '_blank');
    }
    return;
  }

  if (av === 'downloadable') {
    langState[code].availability = 'downloading';
    updateLangRow(code);
    try {
      await createTranslator(detected, code);
      // Polling loop will detect completion.
    } catch (e) {
      langState[code].availability = 'unavailable';
      updateLangRow(code);
    }
  }
}

// ── live test rows ─────────────────────────────────────────────────────────────

function buildTestRows() {
  const container   = document.getElementById('test-rows');
  const placeholder = document.getElementById('test-placeholder');
  const ready = SUPPORTED_LANGUAGES.filter(({ code }) => langState[code].availability === 'available');

  placeholder.style.display = ready.length === 0 ? '' : 'none';

  for (const { code, label, flag } of ready) {
    if (document.getElementById('test-row-' + code)) continue; // already exists — don't recreate

    const row = document.createElement('div');
    row.className = 'test-row';
    row.id = 'test-row-' + code;
    row.innerHTML = `
      <span class="lang-flag">${flag}</span>
      <span class="lang-name">${label}</span>
      <input class="test-input" id="test-input-${code}" type="text" value="Hello" placeholder="Type English…" />
      <span class="test-arrow">→</span>
      <span class="test-result pending" id="test-result-${code}">translating…</span>
    `;
    container.appendChild(row);

    const input = document.getElementById('test-input-' + code);
    input.addEventListener('input', () => scheduleTest(code));
    // Run immediately
    runTest(code, input.value);
  }
}

function scheduleTest(code) {
  clearTimeout(langState[code].testDebounce);
  langState[code].testDebounce = setTimeout(() => {
    const input = document.getElementById('test-input-' + code);
    if (input) runTest(code, input.value);
  }, 400);
}

async function runTest(code, text) {
  const resultEl = document.getElementById('test-result-' + code);
  if (!resultEl) return;
  if (!text.trim()) { resultEl.className = 'test-result pending'; resultEl.textContent = '…'; return; }

  resultEl.className = 'test-result pending';
  resultEl.textContent = 'translating…';

  const detected = detectAPI();
  if (!detected) { resultEl.className = 'test-result error'; resultEl.textContent = 'API unavailable'; return; }

  try {
    let t = langState[code].translator;
    if (!t) {
      t = await createTranslator(detected, code);
      langState[code].translator = t;
    }
    const result = await t.translate(text);
    // Check the input hasn't changed while we were awaiting
    const currentInput = document.getElementById('test-input-' + code);
    if (currentInput && currentInput.value !== text) return; // stale
    resultEl.className = 'test-result';
    resultEl.textContent = result;
  } catch (e) {
    resultEl.className = 'test-result error';
    resultEl.textContent = 'Error: ' + e;
  }
}

// ── step-3/4 state machine ─────────────────────────────────────────────────────

function updateModelStep() {
  const allAvailable   = SUPPORTED_LANGUAGES.every(({ code }) => langState[code].availability === 'available');
  const anyAvailable   = SUPPORTED_LANGUAGES.some(({ code }) => langState[code].availability === 'available');
  const anyDownloading = SUPPORTED_LANGUAGES.some(({ code }) => langState[code].availability === 'downloading');
  const anyChecking    = SUPPORTED_LANGUAGES.some(({ code }) => langState[code].availability === 'checking');

  if (allAvailable) {
    setStep('model', 'ok', 'All language models ready ✓');
    setStep('test', 'ok', 'Live tests passed ✓');
    showSuccess();
  } else if (anyAvailable) {
    setStep('model', 'active', 'Some language models are ready. Download more or proceed.');
    setStep('test', 'active', 'Testing downloaded languages…');
  } else if (anyDownloading) {
    setStep('model', 'active', 'Downloading… this page will update automatically when done.');
    setStep('test', '', '');
  } else if (anyChecking) {
    // still waiting
  } else {
    setStep('model', 'active', 'Select languages to download below.');
    setStep('test', '', '');
  }

  buildTestRows();
}

// ── main diagnostics ──────────────────────────────────────────────────────────

async function runChecks() {
  document.getElementById('last-checked').textContent =
    'Last checked: ' + new Date().toLocaleTimeString();

  // ── Step 1: Chrome version ────────────────────────────────────────────────
  const match = navigator.userAgent.match(/Chrome\/(\d+)/);
  const ver   = match ? parseInt(match[1]) : 0;

  if (!match) {
    setStep('version', 'error', 'Not Chrome — this extension requires Chrome 122+.');
    setStep('flags', '', 'Waiting for step 1…');
    setStep('model', '', '');
    return;
  }
  if (ver < 122) {
    setStep('version', 'error', `Chrome ${ver} detected — please update to 122 or later.`);
    setStep('flags', '', 'Waiting for step 1…');
    setStep('model', '', '');
    return;
  }
  setStep('version', 'ok', `Chrome ${ver} ✓`);

  // ── Step 2: API availability ──────────────────────────────────────────────
  const detected = detectAPI();

  if (!detected) {
    if (ver >= 138) {
      setStep('flags', 'error',
        `Chrome ${ver} should have window.Translator built-in but it's missing. ` +
        'Try enabling chrome://flags/#optimization-guide-on-device-model → Enabled BypassPerfRequirement, then relaunch.');
    } else {
      setStep('flags', 'active',
        'No translation API found. Enable both flags above and relaunch Chrome.');
    }
    setStep('model', '', '');
    return;
  }

  const shapeLabel = {
    new:    'window.Translator (Chrome 138+)',
    ai:     'window.ai.translator (Chrome 131–137)',
    legacy: 'window.translation (Chrome 122–130)',
  }[detected.shape];
  setStep('flags', 'ok', `API detected: ${shapeLabel} ✓`);

  // ── Step 3 & 4: Per-language availability + test rows ─────────────────────
  await Promise.all(SUPPORTED_LANGUAGES.map(async ({ code }) => {
    try {
      const av = await getAvailability(detected, code);
      langState[code].availability = av;

      // If we just became available and have no translator cached yet, create one
      // so the live test tab can use it without a user-gesture requirement.
      if (av === 'available' && !langState[code].translator) {
        try {
          langState[code].translator = await createTranslator(detected, code);
        } catch (_) { /* ignore — test row will retry */ }
      }
    } catch (e) {
      langState[code].availability = 'unavailable';
    }
    updateLangRow(code);
  }));

  updateModelStep();
}

function showSuccess() {
  document.getElementById('success-banner').style.display = 'block';
  document.getElementById('poll-status').innerHTML = '✓ Setup complete';
}

// ── wire up copy buttons & start polling ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.step-icon').forEach((el, i) => { el.dataset.num = i + 1; });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => copyText(btn.dataset.target, btn));
  });

  buildLangRows();

  document.getElementById('lang-search').addEventListener('input', filterLangRows);

  loadActiveLang().then(() => {
    runChecks();
    setInterval(runChecks, 3000);
  });
});
