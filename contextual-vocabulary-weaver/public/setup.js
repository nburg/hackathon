// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── main diagnostics ──────────────────────────────────────────────────────────

async function runChecks() {
  document.getElementById('last-checked').textContent =
    'Last checked: ' + new Date().toLocaleTimeString();

  // ── Step 1: Chrome version ───────────────────────────────────────────────
  const match = navigator.userAgent.match(/Chrome\/(\d+)/);
  const ver   = match ? parseInt(match[1]) : 0;

  if (!match) {
    setStep('version', 'error', 'Not Chrome — this extension requires Chrome 131+.');
    setStep('flags',   '',      'Waiting for step 1…');
    setStep('model',   '',      '');
    return;
  }
  if (ver < 131) {
    setStep('version', 'error', `Chrome ${ver} detected — please update to 131 or later.`);
    setStep('flags',   '',      'Waiting for step 1…');
    setStep('model',   '',      '');
    return;
  }
  setStep('version', 'ok', `Chrome ${ver} ✓`);

  // ── Step 2: Flags — inferred from window.ai.translator presence ──────────
  if (!window.ai?.translator) {
    setStep('flags', 'active',
      'window.ai.translator not found — enable both flags above, then relaunch Chrome.');
    setStep('model', '', '');
    document.getElementById('status-model').style.display = 'none';
    document.getElementById('progress-wrap').style.display = 'none';
    return;
  }
  setStep('flags', 'ok', 'Both flags are active ✓');

  // ── Step 3: Language model availability ──────────────────────────────────
  let availability;
  try {
    availability = await window.ai.translator.availability({
      sourceLanguage: 'en',
      targetLanguage: 'es',
    });
  } catch (e) {
    setStep('model', 'error', 'availability() threw: ' + e);
    return;
  }

  const modelStatus  = document.getElementById('status-model');
  const progressWrap = document.getElementById('progress-wrap');
  const progressBar  = document.getElementById('progress-bar');
  modelStatus.style.display = '';

  if (availability === 'available') {
    progressWrap.style.display = 'none';
    try {
      const t      = await window.ai.translator.create({ sourceLanguage: 'en', targetLanguage: 'es' });
      const result = await t.translate('Hello');
      setStep('model', 'ok', `Model ready — test: "Hello" → "${result}" ✓`);
      showSuccess();
    } catch (e) {
      setStep('model', 'error', 'create() / translate() failed: ' + e);
    }
    return;
  }

  if (availability === 'downloadable') {
    progressWrap.style.display = '';
    progressBar.className = 'progress-bar indeterminate';
    setStep('model', 'active',
      'Model not yet downloaded. Open chrome://on-device-translation-internals, find en → es, and click Install.');
    return;
  }

  if (availability === 'downloading') {
    progressWrap.style.display = '';
    progressBar.className = 'progress-bar indeterminate';
    setStep('model', 'active', 'Downloading… this page will update automatically when done.');
    return;
  }

  setStep('model', 'error',
    '"unavailable" — make sure both flags are set and Chrome was fully relaunched after enabling them.');
}

function showSuccess() {
  document.getElementById('success-banner').style.display = 'block';
  document.getElementById('poll-status').innerHTML = '✓ Setup complete';
}

// ── wire up copy buttons & start polling ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Preserve step numbers before any state changes
  document.querySelectorAll('.step-icon').forEach((el, i) => { el.dataset.num = i + 1; });

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => copyText(btn.dataset.target, btn));
  });

  runChecks();
  setInterval(runChecks, 3000);
});
