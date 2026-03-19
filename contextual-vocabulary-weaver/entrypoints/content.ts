import { TranslationPipeline } from '../lib/translation-pipeline';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    const pipeline = new TranslationPipeline();

    const ready = await pipeline.init();
    if (!ready) return;

    // TODO(P2): read densityFraction from chrome.storage (settings slider)
    const densityFraction = 0.05;

    // TODO(P5): wire in getWordPriority() from the SRS engine
    // const getPriority = (word: string) => storageEngine.getWordPriority(word);

    // TODO(P5): register the Phase 2 BKT trigger
    // pipeline.onPhase2Trigger(() => { ... });

    await pipeline.run(densityFraction);
  },
});
