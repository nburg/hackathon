import { extractCandidates, filterCandidates, getSentenceForCandidate } from '@p3/index';
import type { WordCandidate } from '@p3/types';
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

interface SentenceCandidate {
  sentence: string;
  node: Text;
  /** Character offset of the sentence within `node.data`. */
  offset: number;
  /** All word candidates that fall within this sentence (used for SRS tracking). */
  words: WordCandidate[];
}

// ---------------------------------------------------------------------------
// TranslationPipeline
// ---------------------------------------------------------------------------

const SOURCE_LANG = 'en';
const TARGET_LANG = 'es';

export class TranslationPipeline {
  private translator: Translator | null = null;
  private phase2Active = false;

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

  /** Signal from P5 that Phase 2 should activate. */
  activatePhase2(): void {
    this.phase2Active = true;
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
    const allCandidates = extractCandidates(document);

    // Proper nouns are still skipped; multi-word flag is irrelevant at sentence level.
    const eligible = filterCandidates(allCandidates, (c) => !c.isProperNoun);

    // Group word candidates into sentence candidates using P3's getSentenceForCandidate.
    const sentenceCandidates = buildSentenceCandidates(eligible);
    if (sentenceCandidates.length === 0) return;

    // Score each sentence by the highest-priority word it contains.
    // A sentence with even one new/struggling word is worth showing.
    const scores = await Promise.all(
      sentenceCandidates.map(async (sc) => {
        const wordScores = await Promise.all(sc.words.map((w) => getWordPriority(w.word)));
        return Math.max(...wordScores);
      }),
    );

    const ranked = sentenceCandidates
      .map((sc, i) => ({ sc, score: scores[i] }))
      .sort((a, b) => b.score - a.score);

    const count = Math.max(1, Math.round(ranked.length * densityFraction));
    const selected = ranked.slice(0, count).map(({ sc }) => sc);

    // Group by text node; replace right-to-left within each node.
    const byNode = new Map<Text, SentenceCandidate[]>();
    for (const sc of selected) {
      const group = byNode.get(sc.node) ?? [];
      group.push(sc);
      byNode.set(sc.node, group);
    }

    await Promise.all([...byNode.values()].map((group) => this.translateSentenceGroup(group)));
  }

  private async translateSentenceGroup(sentences: SentenceCandidate[]): Promise<void> {
    // Descending offset so right-to-left replacement keeps offsets valid.
    const sorted = [...sentences].sort((a, b) => b.offset - a.offset);

    for (const sc of sorted) {
      try {
        const translated = await this.translator!.translate(sc.sentence);
        replaceSentenceInDom(sc, translated);
        // Track exposure for every word in the sentence.
        sc.words.forEach((w) => trackExposure(w.word).catch(() => {}));
      } catch (err) {
        console.error('[CVW] Phase 2 translation failed:', err);
      }
    }
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

/**
 * Groups word candidates into sentence candidates by (text node, sentence) pairs.
 * Deduplicates so each unique sentence within a text node is processed once.
 */
function buildSentenceCandidates(candidates: WordCandidate[]): SentenceCandidate[] {
  // Outer key: text node reference. Inner key: trimmed sentence string.
  const map = new Map<Text, Map<string, SentenceCandidate>>();

  for (const candidate of candidates) {
    const sentence = getSentenceForCandidate(candidate);
    if (!sentence) continue;

    if (!map.has(candidate.node)) {
      map.set(candidate.node, new Map());
    }
    const nodeMap = map.get(candidate.node)!;

    if (!nodeMap.has(sentence)) {
      const offset = candidate.node.data.indexOf(sentence);
      if (offset === -1) continue;
      nodeMap.set(sentence, { sentence, node: candidate.node, offset, words: [] });
    }
    nodeMap.get(sentence)!.words.push(candidate);
  }

  return [...map.values()].flatMap((nodeMap) => [...nodeMap.values()]);
}

/**
 * Splits `sc.node` around the sentence and replaces it with a <span> that
 * displays the translation and reverts to the original on hover.
 *
 * Before: [... sentence ...]  (single Text node)
 * After:  [...before][<span class="cvw-sentence">translation</span>][after...]
 */
function replaceSentenceInDom(sc: SentenceCandidate, translation: string): void {
  const { node, sentence, offset } = sc;
  const parent = node.parentNode;
  if (!parent) return;

  const sentenceNode = node.splitText(offset);
  const restNode = sentenceNode.splitText(sentence.length);

  const span = createSentenceSpan(sentence, translation);
  parent.replaceChild(span, sentenceNode);

  void restNode; // already re-attached to the DOM by splitText
}

function createSentenceSpan(original: string, translation: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'cvw-sentence';
  span.dataset.original = original;
  span.dataset.translation = translation;
  span.textContent = translation;
  span.title = original;

  span.addEventListener('mouseenter', () => { span.textContent = original; });
  span.addEventListener('mouseleave', () => { span.textContent = translation; });

  return span;
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
