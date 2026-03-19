// ---------------------------------------------------------------------------
// Translator global — only accessible at extension-level (not in content
// scripts on regular pages). Declared here so the service worker can own it.
// ---------------------------------------------------------------------------
declare const Translator: undefined | {
  availability(opts: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(opts: { sourceLanguage: string; targetLanguage: string }): Promise<{ translate(text: string): Promise<string> }>;
};

const _translators = new Map<string, { translate(text: string): Promise<string> }>();

async function getTranslator(targetLanguage: string) {
  if (_translators.has(targetLanguage)) return _translators.get(targetLanguage)!;
  if (typeof Translator === 'undefined') return null;
  try {
    const availability = await Translator.availability({ sourceLanguage: 'en', targetLanguage });
    if (availability !== 'available') return null;
    const t = await Translator.create({ sourceLanguage: 'en', targetLanguage });
    _translators.set(targetLanguage, t);
    return t;
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

  // Warm up the default translator on startup so the first page load isn't slow.
  getTranslator('es');
  getTranslator('fr');

  // Content scripts can't access Translator directly — proxy through here.
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!message || (message as any).type !== 'translate') return false;
    const text = (message as any).text as string;
    const targetLanguage: string = (message as any).targetLanguage ?? 'es';

    getTranslator(targetLanguage).then(t => {
      if (!t) { sendResponse({ error: 'Translator not ready' }); return; }
      return t.translate(text).then(translated => sendResponse({ translated }));
    }).catch(e => sendResponse({ error: String(e) }));

    return true; // keep message channel open for async response
  });
});
