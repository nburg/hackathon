// ---------------------------------------------------------------------------
// Translator global — only accessible at extension-level (not in content
// scripts on regular pages). Declared here so the service worker can own it.
// ---------------------------------------------------------------------------
declare const Translator:
  | undefined
  | {
      availability(opts: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
      create(opts: {
        sourceLanguage: string;
        targetLanguage: string;
      }): Promise<{ translate(text: string): Promise<string> }>;
    };

let _translator: { translate(text: string): Promise<string> } | null = null;
let _translatorLang: string | null = null;

async function getCurrentTargetLanguage(): Promise<string> {
  try {
    const result = await chrome.storage.local.get('settings');
    return ((result['settings'] as Record<string, unknown>)?.targetLanguage as string) ?? 'es';
  } catch {
    return 'es';
  }
}

async function getTranslatorForLanguage(lang: string) {
  if (_translator && _translatorLang === lang) return _translator;

  console.log('[Background] Checking Translator API...');
  console.log('[Background] typeof Translator:', typeof Translator);

  if (typeof Translator === 'undefined') {
    console.error('[Background] Translator API not found');
    return null;
  }

  try {
    console.log('[Background] Checking availability for lang:', lang);
    const availability = await Translator.availability({
      sourceLanguage: 'en',
      targetLanguage: lang,
    });
    console.log('[Background] Availability:', availability);

    if (availability === 'unavailable') {
      console.error('[Background] Model unavailable - cannot create translator');
      return null;
    }

    // Try to create translator even if availability is "downloadable" or "downloading"
    // Sometimes the model is installed but reports wrong status
    console.log('[Background] Creating translator (availability:', availability, ')...');
    _translator = await Translator.create({ sourceLanguage: 'en', targetLanguage: lang });
    _translatorLang = lang;
    console.log('[Background] Translator created successfully!');
    return _translator;
  } catch (e) {
    console.error('[Background] Translator creation failed:', e);
    return null;
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      browser.tabs.create({ url: browser.runtime.getURL('/setup.html') });
    }
  });

  // Warm up the translator on startup so the first page load isn't slow.
  getCurrentTargetLanguage().then((lang) => getTranslatorForLanguage(lang));

  // Invalidate the cached translator when the language setting changes.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes['settings']) return;
    const newLang = (changes['settings'].newValue as Record<string, unknown>)?.targetLanguage as
      | string
      | undefined;
    if (newLang && newLang !== _translatorLang) {
      _translator = null;
      _translatorLang = null;
      // Eagerly pre-warm the translator for the new language.
      getTranslatorForLanguage(newLang);
    }
  });

  // Show a badge when Phase 2 activates so the transition is visible to the user.
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const updated = changes['settings']?.newValue as { currentPhase?: number } | undefined;
    if (updated?.currentPhase === 2) {
      browser.action.setBadgeText({ text: '2' });
      browser.action.setBadgeBackgroundColor({ color: '#7c3aed' });
    }
  });

  // Content scripts can't access Translator directly — proxy through here.
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const msg = message as { type?: string; text?: string; targetLanguage?: string };
    if (!msg) return false;

    if (msg.type === 'check-availability') {
      const lang = msg.targetLanguage ?? 'es';
      if (typeof Translator === 'undefined') {
        sendResponse({ available: false });
        return false;
      }
      Translator.availability({ sourceLanguage: 'en', targetLanguage: lang })
        .then((result) => sendResponse({ available: result === 'available' }))
        .catch(() => sendResponse({ available: false }));
      return true;
    }

    if (msg.type === 'translate') {
      const text = msg.text as string;
      getCurrentTargetLanguage()
        .then((lang) => getTranslatorForLanguage(lang))
        .then((t) => {
          if (!t) {
            console.log('[Background] Using MyMemory API (Chrome Translator unavailable)');
            sendResponse({ error: 'Translator not ready' });
            return;
          }
          console.log('[Background] Using Chrome built-in Translator API');
          return t.translate(text).then((translated) => sendResponse({ translated }));
        })
        .catch((e) => sendResponse({ error: String(e) }));
      return true; // keep message channel open for async response
    }

    return false;
  });
});
