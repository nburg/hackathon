import { extractCandidates, filterCandidates, getSentenceForCandidate } from '../../P3/src/index';
import type { WordCandidate } from '../../P3/src/types';

// ---------------------------------------------------------------------------
// Ambient types for Chrome's built-in Translation API
// (not yet in @types/chrome — remove once official types ship)
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    translation?: {
      canTranslate(options: TranslatorOptions): Promise<'readily' | 'after-download' | 'no'>;
      createTranslator(options: TranslatorOptions): Promise<Translator>;
    };
  }
}

interface TranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

interface Translator {
  translate(text: string): Promise<string>;
}

// ---------------------------------------------------------------------------
// TranslationPipeline
// ---------------------------------------------------------------------------

const SOURCE_LANG = 'en';
const TARGET_LANG = 'es';

// P5 Integration: Tracking callbacks interface
interface TrackingCallbacks {
  onExposure: (word: string) => Promise<void>;
  onRecallFailure: (word: string) => Promise<void>;
}

export class TranslationPipeline {
  private translator: Translator | null = null;
  private phase2Active = false;
  private phase2Callback: (() => void) | null = null;
  private trackingCallbacks: TrackingCallbacks | null = null;

  /**
   * Checks API availability and warms up the translator.
   * Returns false if the API is not supported in this browser.
   */
  async init(): Promise<boolean> {
    if (!window.translation) {
      console.warn('[CVW] Chrome Translation API unavailable — extension disabled.');
      return false;
    }

    const availability = await window.translation.canTranslate({
      sourceLanguage: SOURCE_LANG,
      targetLanguage: TARGET_LANG,
    });

    if (availability === 'no') {
      console.warn('[CVW] en→es translation not supported on this device.');
      return false;
    }

    // 'after-download': model downloads on first translate() call — acceptable.
    this.translator = await window.translation.createTranslator({
      sourceLanguage: SOURCE_LANG,
      targetLanguage: TARGET_LANG,
    });

    return true;
  }

  /**
   * Register the Phase 2 trigger callback (called by P5's BKT engine when
   * P(Known) >= 0.85 for enough of the top-200 Spanish words).
   * Once fired, subsequent `run()` calls enter sentence-level mode.
   */
  onPhase2Trigger(callback: () => void): void {
    this.phase2Callback = callback;
  }

  /** Signal from P5 that Phase 2 should activate. */
  activatePhase2(): void {
    if (!this.phase2Active) {
      this.phase2Active = true;
      this.phase2Callback?.();
    }
  }

  /**
   * ✅ P5 Integration: Register tracking callbacks for word exposure and recall failures.
   * Called by content script after initializing the pipeline.
   */
  setTrackingCallbacks(callbacks: TrackingCallbacks): void {
    this.trackingCallbacks = callbacks;
  }

  /**
   * Main entry point. Extracts candidates from the live document via P3,
   * filters by density + priority, translates each one, and swaps them
   * in-place in the DOM.
   *
   * @param densityFraction  0.01–0.10, sourced from P2's settings slider
   * @param getPriority      Word priority scorer from P5's `getWordPriority()` (async)
   */
  async run(
    densityFraction: number,
    getPriority: (word: string) => Promise<number> = async () => 1,
  ): Promise<void> {
    if (!this.translator) {
      console.warn('[CVW] Call init() before run().');
      return;
    }

    if (this.phase2Active) {
      await this.runPhase2(densityFraction);
      return;
    }

    // P3 extracts all candidates from the live document.
    const allCandidates = extractCandidates(document);

    // Filter: skip proper nouns and multi-word expressions, then apply
    // density by sorting on P5's priority score and taking the top N%.
    const eligible = filterCandidates(
      allCandidates,
      (c) => !c.isProperNoun && !c.isMultiWord,
    );

    // ✅ P5 Integration: Get priority scores for all eligible words
    const withPriorities = await Promise.all(
      eligible.map(async (c) => ({
        candidate: c,
        priority: await getPriority(c.word)
      }))
    );

    // Sort by priority (highest first) and select top N% based on density
    const sorted = withPriorities.sort((a, b) => b.priority - a.priority);
    const count = Math.max(1, Math.round(sorted.length * densityFraction));
    const selected = sorted.slice(0, count).map(x => x.candidate);

    console.log(`[CVW] Selected ${selected.length} words out of ${eligible.length} candidates (${(densityFraction * 100).toFixed(1)}% density)`);

    // Group by text node and process each group concurrently.
    // Within a group, replace right-to-left so earlier offsets stay valid.
    const byNode = groupByNode(selected);
    await Promise.all([...byNode.values()].map((group) => this.translateGroup(group)));
  }

  private async runPhase2(densityFraction: number): Promise<void> {
    // TODO(P4-Phase2): sentence-level replacement
    // Use getSentenceForCandidate(candidate) from P3 to get the full sentence,
    // then translate the whole sentence and replace the parent element's text.
    console.log('[CVW] Phase 2 active — sentence pipeline not yet implemented.');
    void densityFraction;
    void getSentenceForCandidate;
  }

  private async translateGroup(candidates: WordCandidate[]): Promise<void> {
    // Descending offset order: replace rightmost words first to preserve offsets.
    const sorted = [...candidates].sort((a, b) => b.offset - a.offset);

    for (const candidate of sorted) {
      try {
        const translated = await this.translator!.translate(candidate.word);
        replaceInDom(candidate, translated, this.trackingCallbacks);

        // ✅ P5 Integration: Track word exposure after successful replacement
        if (this.trackingCallbacks) {
          await this.trackingCallbacks.onExposure(candidate.word);
          console.log(`[CVW] Tracked exposure: "${candidate.word}" → "${translated}"`);
        }
      } catch (err) {
        console.error(`[CVW] Translation failed for "${candidate.word}":`, err);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function groupByNode(candidates: WordCandidate[]): Map<Text, WordCandidate[]> {
  const map = new Map<Text, WordCandidate[]>();
  for (const c of candidates) {
    const existing = map.get(c.node) ?? [];
    existing.push(c);
    map.set(c.node, existing);
  }
  return map;
}

/**
 * Splits `candidate.node` around the word and replaces the word slice with a
 * <span> that displays the translation and reverts to the original on hover.
 *
 * Uses `candidate.length` (from P3) rather than `candidate.word.length` since
 * P3 computes the length from the actual text node position.
 *
 * Before: [... word ...]  (single Text node)
 * After:  [...before][<span>translation</span>][after...]
 */
function replaceInDom(
  candidate: WordCandidate,
  translation: string,
  trackingCallbacks: TrackingCallbacks | null
): void {
  const { node, word, offset, length } = candidate;
  const parent = node.parentNode;
  if (!parent) return;

  // Split into three nodes: [before] [word] [rest]
  const wordNode = node.splitText(offset);
  const restNode = wordNode.splitText(length);

  const span = createWordSpan(word, translation, trackingCallbacks);

  // Swap the word text node for the span; restNode stays in place automatically.
  parent.replaceChild(span, wordNode);

  void restNode; // already re-attached to the DOM by splitText
}

function createWordSpan(
  original: string,
  translation: string,
  trackingCallbacks: TrackingCallbacks | null
): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'cvw-word';
  span.dataset.original = original;
  span.dataset.translation = translation;
  span.textContent = translation;
  span.title = original; // fallback tooltip

  // ✅ P5 Integration: Track recall failure when user hovers (forgot the word)
  let hasHovered = false; // Only track first hover per word instance

  span.addEventListener('mouseenter', () => {
    span.textContent = original;

    // Track recall failure on first hover (user needed to see original = forgot it)
    if (!hasHovered && trackingCallbacks) {
      hasHovered = true;
      trackingCallbacks.onRecallFailure(original).then(() => {
        console.log(`[CVW] Tracked recall failure: "${original}"`);
      });
    }
  });

  span.addEventListener('mouseleave', () => {
    span.textContent = translation;
  });

  return span;
}
