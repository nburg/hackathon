// ---------------------------------------------------------------------------
// Translator global — only accessible at extension-level (not in content
// scripts on regular pages). Declared here so the service worker can own it.
// ---------------------------------------------------------------------------
declare const Translator: undefined | {
  availability(opts: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(opts: { sourceLanguage: string; targetLanguage: string }): Promise<{ translate(text: string): Promise<string> }>;
};

let _translator: { translate(text: string): Promise<string> } | null = null;

async function getTranslator() {
  if (_translator) return _translator;
  if (typeof Translator === 'undefined') return null;
  try {
    const availability = await Translator.availability({ sourceLanguage: 'en', targetLanguage: 'es' });
    if (availability !== 'available') return null;
    _translator = await Translator.create({ sourceLanguage: 'en', targetLanguage: 'es' });
    return _translator;
  } catch {
    return null;
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      browser.tabs.create({ url: browser.runtime.getURL('setup.html') });
    }
  });

  // Warm up the translator on startup so the first page load isn't slow.
  getTranslator();

  // Content scripts can't access Translator directly — proxy through here.
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!message || (message as any).type !== 'translate') return false;
    const text = (message as any).text as string;

    getTranslator().then(t => {
      if (!t) { sendResponse({ error: 'Translator not ready' }); return; }
      return t.translate(text).then(translated => sendResponse({ translated }));
    }).catch(e => sendResponse({ error: String(e) }));

    return true; // keep message channel open for async response
  });
});
