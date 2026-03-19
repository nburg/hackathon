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

    // ✅ P5 Integration: Apply phase from storage at startup
    // (P5 sets currentPhase: 2 when BKT threshold is reached)
    if (settings.currentPhase === 2) {
      pipeline.activatePhase2();
    }

    // ✅ P5 Integration: Listen for P5 flipping currentPhase to 2 mid-session
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const updated = changes[STORAGE_KEYS.SETTINGS]?.newValue as ExtensionSettings | undefined;
      if (updated?.currentPhase === 2) {
        pipeline.activatePhase2();
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
    await pipeline.run(settings.density);

    console.log('[CVW] Translation pipeline completed');
  },
});
