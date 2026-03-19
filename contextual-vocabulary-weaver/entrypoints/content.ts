import '../assets/content-styles.css';
import { TranslationPipeline } from '../lib/translation-pipeline';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  type ExtensionSettings
} from '../lib/types';
import { checkAndTriggerPhase2 } from '../lib';

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
    // and re-run immediately so the current page switches without a reload.
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const updated = changes[STORAGE_KEYS.SETTINGS]?.newValue as ExtensionSettings | undefined;
      if (updated?.currentPhase === 2) {
        pipeline.activatePhase2();
        console.log('🎉 [CVW] Phase 2 activated! Switching to sentence-level translation.');
        pipeline.run(updated.density);
      }
    });

    // Run translation pipeline with density from P2's settings.
    // Tracking (exposure + recall) is handled inside the pipeline via P5's storage API.
    await pipeline.run(settings.density);

    // After this page's exposures are tracked, check whether the BKT threshold
    // has been crossed. If so, checkAndTriggerPhase2 writes currentPhase: 2 to
    // storage, which the onChanged listener above picks up to activate Phase 2.
    checkAndTriggerPhase2().catch(() => {});

    console.log('[CVW] Translation pipeline completed');
  },
});
