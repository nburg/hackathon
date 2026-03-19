import { extractCandidates, filterCandidates, getSentenceForCandidate } from '../../P3/src/index';
import type { WordCandidate } from '../../P3/src/types';
import { getWordPriority, trackExposure, trackRecallFailure } from './index';

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
   * Main entry point. Extracts candidates from the live document via P3,
   * scores and ranks them with P5's SRS priority, translates the top N% by
   * density, and swaps them in-place in the DOM.
   *
   * @param densityFraction  0.01–0.10, sourced from P2's settings slider
   */
  async run(densityFraction: number): Promise<void> {
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

    // Filter: skip proper nouns and multi-word expressions.
    const eligible = filterCandidates(
      allCandidates,
      (c) => !c.isProperNoun && !c.isMultiWord,
    );

    // Fetch all P5 priority scores in parallel (getWordPriority is async).
    const scores = await Promise.all(eligible.map((c) => getWordPriority(c.word)));

    // Sort by priority descending and take the top density% of candidates.
    const ranked = eligible
      .map((c, i) => ({ candidate: c, score: scores[i] }))
      .sort((a, b) => b.score - a.score);

    const count = Math.max(1, Math.round(ranked.length * densityFraction));
    const selected = ranked.slice(0, count).map(({ candidate }) => candidate);

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
        replaceInDom(candidate, translated);
        // Fire-and-forget: tell P5 this word was exposed on the page.
        trackExposure(candidate.word).catch(() => {});
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
function replaceInDom(candidate: WordCandidate, translation: string): void {
  const { node, word, offset, length } = candidate;
  const parent = node.parentNode;
  if (!parent) return;

  // Split into three nodes: [before] [word] [rest]
  const wordNode = node.splitText(offset);
  const restNode = wordNode.splitText(length);

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
    // Fire-and-forget: hovering to see the original counts as a recall failure.
    trackRecallFailure(original).catch(() => {});
  });
  span.addEventListener('mouseleave', () => { span.textContent = translation; });

  return span;
}
