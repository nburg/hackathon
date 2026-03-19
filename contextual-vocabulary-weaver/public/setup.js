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
    // Chrome 131–137 needs flags; 138+ should have Translator built-in.
    if (ver >= 138) {
      setStep('flags', 'error',
        `Chrome ${ver} should have window.Translator built-in but it's missing. ` +
        'Try enabling chrome://flags/#optimization-guide-on-device-model → Enabled BypassPerfRequirement, then relaunch.');
    } else {
      setStep('flags', 'active',
        'No translation API found. Enable both flags above and relaunch Chrome.');
    }
    setStep('model', '', '');
    document.getElementById('status-model').style.display = 'none';
    document.getElementById('progress-wrap').style.display = 'none';
    return;
  }

  const shapeLabel = {
    new:    'window.Translator (Chrome 138+)',
    ai:     'window.ai.translator (Chrome 131–137)',
    legacy: 'window.translation (Chrome 122–130)',
  }[detected.shape];
  setStep('flags', 'ok', `API detected: ${shapeLabel} ✓`);

  // ── Step 3: Language model availability ───────────────────────────────────
  document.getElementById('status-model').style.display = '';
  let availability;
  try {
    if (detected.shape === 'legacy') {
      // Old API uses canTranslate() returning 'readily'|'after-download'|'no'
      const r = await detected.api.canTranslate({ sourceLanguage: 'en', targetLanguage: 'es' });
      availability = r === 'readily' ? 'available' : r === 'after-download' ? 'downloadable' : 'unavailable';
    } else {
      availability = await detected.api.availability({ sourceLanguage: 'en', targetLanguage: 'es' });
    }
  } catch (e) {
    setStep('model', 'error', 'availability check threw: ' + e);
    return;
  }

  const progressWrap = document.getElementById('progress-wrap');
  const progressBar  = document.getElementById('progress-bar');

  if (availability === 'available') {
    progressWrap.style.display = 'none';
    try {
      const createFn = detected.shape === 'legacy'
        ? () => detected.api.createTranslator({ sourceLanguage: 'en', targetLanguage: 'es' })
        : () => detected.api.create({ sourceLanguage: 'en', targetLanguage: 'es' });
      const t      = await createFn();
      const result = await t.translate('Hello');
      setStep('model', 'ok', `Model ready — test: "Hello" → "${result}" ✓`);
      showSuccess();
    } catch (e) {
      setStep('model', 'error', 'create() / translate() failed: ' + e);
    }
    return;
  }

  if (availability === 'downloadable') {
    // availability() can lag behind the internals page installer.
    // Try create() anyway — if the model is actually present it will succeed.
    try {
      const createFn = detected.shape === 'legacy'
        ? () => detected.api.createTranslator({ sourceLanguage: 'en', targetLanguage: 'es' })
        : () => detected.api.create({ sourceLanguage: 'en', targetLanguage: 'es' });
      const t      = await createFn();
      const result = await t.translate('Hello');
      setStep('model', 'ok', `Model ready (availability lag) — test: "Hello" → "${result}" ✓`);
      showSuccess();
      return;
    } catch (_) {
      // Model genuinely not present — show install instructions.
    }
    progressWrap.style.display = '';
    progressBar.className = 'progress-bar indeterminate';
    setStep('model', 'active',
      'Model not yet downloaded. Open chrome://on-device-translation-internals, find en → es, and click Install. Then restart Chrome.');
    return;
  }

  if (availability === 'downloading') {
    progressWrap.style.display = '';
    progressBar.className = 'progress-bar indeterminate';
    setStep('model', 'active', 'Downloading… this page will update automatically when done.');
    return;
  }

  setStep('model', 'error',
    '"unavailable" — try enabling chrome://flags/#optimization-guide-on-device-model → ' +
    'Enabled BypassPerfRequirement, then relaunch Chrome.');
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

  runChecks();
  setInterval(runChecks, 3000);
});
