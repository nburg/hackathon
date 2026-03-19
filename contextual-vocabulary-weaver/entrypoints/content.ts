import '../assets/content-styles.css';
import { TranslationPipeline } from '../lib/translation-pipeline';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  type ExtensionSettings
} from '../lib/types';
import {
  getWordPriority,
  checkAndTriggerPhase2,
  trackExposure,
  trackRecallFailure
} from '../lib';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('[CVW] Content script initialized');

    const result = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings: ExtensionSettings = result[STORAGE_KEYS.SETTINGS] ?? DEFAULT_SETTINGS;

    if (!settings.enabled) {
      console.log('[CVW] Extension disabled in settings');
      return;
    }

    const pipeline = new TranslationPipeline();

    const ready = await pipeline.init();
    if (!ready) return;

    // ✅ P5 Integration: Wire in word priority from SRS engine
    // This function returns 0.0-1.0 score (higher = more important to show)
    const getPriority = async (word: string): Promise<number> => {
      return await getWordPriority(word);
    };

    // ✅ P5 Integration: Register Phase 2 BKT trigger
    // When user knows 70% of top 200 Spanish words, switch to sentence mode
    pipeline.onPhase2Trigger(async () => {
      const triggered = await checkAndTriggerPhase2();
      if (triggered) {
        console.log('🎉 [CVW] Phase 2 activated! Switching to sentence-level translation.');
      }
    });

    // ✅ P5 Integration: Pass tracking callbacks to pipeline
    // These are called when words are displayed and when user hovers
    pipeline.setTrackingCallbacks({
      onExposure: trackExposure,
      onRecallFailure: trackRecallFailure
    });

    // Run translation pipeline with P5's priority scoring
    await pipeline.run(settings.density, getPriority);

    console.log('[CVW] Translation pipeline completed');
  },
});
