import type { WordCandidate } from './types';
import { mockCandidates, selectCandidates } from './mock-candidates';

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

export class TranslationPipeline {
  private translator: Translator | null = null;
  private phase2Active = false;
  private phase2Callback: (() => void) | null = null;

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
   * Main entry point. Selects candidates by density, translates each one,
   * and swaps them in-place in the DOM.
   *
   * @param densityFraction  0.01–0.10, sourced from P2's settings slider
   * @param getPriority      Word priority scorer from P5's `getWordPriority()`
   */
  async run(
    densityFraction: number,
    getPriority: (word: string) => number = () => 1,
  ): Promise<void> {
    if (!this.translator) {
      console.warn('[CVW] Call init() before run().');
      return;
    }

    if (this.phase2Active) {
      // TODO(P4-Phase2): switch to sentence-level replacement
      console.log('[CVW] Phase 2 active — sentence pipeline not yet implemented.');
      return;
    }

    // TODO(P3): replace mockCandidates with extractCandidates(document)
    const candidates = mockCandidates;
    const selected = selectCandidates(candidates, densityFraction, getPriority);

    // Group by text node and process each group concurrently.
    // Within a group, replacements run right-to-left so earlier offsets stay valid.
    const byNode = groupByTextNode(selected);
    await Promise.all([...byNode.values()].map((group) => this.translateGroup(group)));
  }

  private async translateGroup(candidates: WordCandidate[]): Promise<void> {
    // Descending offset order: replace rightmost words first to preserve offsets.
    const sorted = [...candidates].sort((a, b) => b.offset - a.offset);

    for (const candidate of sorted) {
      try {
        const translated = await this.translator!.translate(candidate.word);
        replaceInDom(candidate, translated);
      } catch (err) {
        console.error(`[CVW] Translation failed for "${candidate.word}":`, err);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function groupByTextNode(candidates: WordCandidate[]): Map<Text, WordCandidate[]> {
  const map = new Map<Text, WordCandidate[]>();
  for (const c of candidates) {
    const existing = map.get(c.textNode) ?? [];
    existing.push(c);
    map.set(c.textNode, existing);
  }
  return map;
}

/**
 * Splits `candidate.textNode` around the word and replaces the word slice
 * with a <span> that:
 * - displays the translated word by default
 * - reverts to the original on hover (hover-to-revert mechanic for P2)
 *
 * Before: [... word ...]  (single Text node)
 * After:  [... before][<span>translation</span>][after ...]
 */
function replaceInDom(candidate: WordCandidate, translation: string): void {
  const { textNode, word, offset } = candidate;
  const parent = textNode.parentNode;
  if (!parent) return;

  // Split into three nodes: [before] [word] [rest]
  const wordNode = textNode.splitText(offset);
  const restNode = wordNode.splitText(word.length);

  const span = createWordSpan(word, translation);

  // Swap the word text node for the span; restNode stays in place automatically.
  parent.replaceChild(span, wordNode);

  void restNode; // already re-attached to the DOM by splitText
}

function createWordSpan(original: string, translation: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'cvw-word';
  span.dataset.original = original;
  span.dataset.translation = translation;
  span.textContent = translation;
  span.title = original; // fallback tooltip

  span.addEventListener('mouseenter', () => {
    span.textContent = original;
  });
  span.addEventListener('mouseleave', () => {
    span.textContent = translation;
  });

  return span;
}
