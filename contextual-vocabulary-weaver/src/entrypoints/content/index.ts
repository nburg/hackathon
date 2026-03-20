import styles from './styles.css?inline';
import { TranslationPipeline } from '@lib/translation-pipeline';
import { STORAGE_KEYS, type ExtensionSettings } from '@lib/types';
import { checkAndTriggerPhase2 } from '@lib/index';
import { getSettings } from '@/lib/storage/api';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('[CVW] Content script loaded');

    const settings = await getSettings();

    // If regex patterns are defined, only run on matching URLs.
    // Patterns are length-capped to 500 chars to prevent ReDoS from
    // pathological inputs stored in user settings.
    const patterns = settings.siteRegexPatterns || [];
    if (patterns.length > 0) {
      const url = window.location.href;
      const matches = patterns.some((p) => {
        if (p.length > 500) return false;
        try {
          return new RegExp(p).test(url);
        } catch {
          return false;
        }
      });
      if (!matches) return;
    }

    if (!settings.isEnabled) {
      console.log('[CVW] Extension disabled');
      return;
    }

    // Inject CSS into page
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // P2 stores density as 1–10 (percent). Pipeline expects a 0–1 fraction.
    const densityFraction = settings.density / 100;

    const pipeline = new TranslationPipeline();
    const ready = await pipeline.init();
    if (!ready) return;

    // Read P5's settings for currentPhase (separate schema in local storage).
    const p5Result = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
    const p5Settings = p5Result[STORAGE_KEYS.SETTINGS] as ExtensionSettings | undefined;

    if (p5Settings?.currentPhase === 2) {
      pipeline.activatePhase2();
    }

    // Listen for P5 writing currentPhase: 2 mid-session and re-run immediately.
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const updated = changes[STORAGE_KEYS.SETTINGS]?.newValue as ExtensionSettings | undefined;
      if (updated?.currentPhase === 2) {
        pipeline.activatePhase2();
        console.log('🎉 [CVW] Phase 2 activated! Switching to sentence-level translation.');
        pipeline.run(densityFraction);
      }
    });

    await pipeline.run(densityFraction);

    // Check BKT threshold after this page's exposures — activates Phase 2 if met.
    checkAndTriggerPhase2().catch(() => {});

    console.log('[CVW] Translation pipeline completed');
  },
});
