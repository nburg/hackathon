import { TranslationPipeline } from '../lib/translation-pipeline';
import { STORAGE_KEYS, DEFAULT_SETTINGS, type ExtensionSettings } from '../lib/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    const result = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings: ExtensionSettings = result[STORAGE_KEYS.SETTINGS] ?? DEFAULT_SETTINGS;

    if (!settings.enabled) return;

    const pipeline = new TranslationPipeline();

    const ready = await pipeline.init();
    if (!ready) return;

    // TODO(P5): wire in getWordPriority() from the SRS engine
    // const getPriority = (word: string) => storageEngine.getWordPriority(word);

    // TODO(P5): register the Phase 2 BKT trigger
    // pipeline.onPhase2Trigger(() => { ... });

    await pipeline.run(settings.density);
  },
});
