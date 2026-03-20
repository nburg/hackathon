import { extractCandidates, filterCandidates, getSentenceForCandidate } from '@p3/index';
import type { WordCandidate } from '@p3/types';
import { getWordPriority, trackExposure, trackRecallFailure } from './index';

interface Translator {
  translate(text: string): Promise<string>;
}

/**
 * Proxies translation through the background service worker.
 * Content scripts cannot call Translator.create() directly — Chrome only
 * allows it from extension-level contexts (background, extension pages).
 */
class BackgroundTranslator implements Translator {
  private static loggedApiSource = false;

  async translate(text: string): Promise<string> {
    const response = (await browser.runtime.sendMessage({ type: 'translate', text })) as
      | { translated?: string; error?: string }
      | undefined;

    if (response?.error) {
      if (!BackgroundTranslator.loggedApiSource) {
        console.log(
          '[CVW] ❌ Chrome Translator API unavailable - would fall back to MyMemory (not implemented in current code)'
        );
        BackgroundTranslator.loggedApiSource = true;
      }
      throw new Error(response.error);
    }

    if (!response?.translated) throw new Error('Empty translation response from background');

    if (!BackgroundTranslator.loggedApiSource) {
      console.log('[CVW] ✅ Using Chrome built-in Translator API (via background service worker)');
      BackgroundTranslator.loggedApiSource = true;
    }

    return response.translated;
  }
}

/** Fallback translator using the free MyMemory API (no key required). */

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

export class TranslationPipeline {
  private translator: Translator | null = null;
  private phase2Active = false;
  // Cache query → translation so the same sentence/phrase is never sent twice.
  private readonly cache = new Map<string, string>();

  /**
   * Warms up the translator.
   * Translation is proxied through the background service worker, which has
   * extension-level access to Translator.create() regardless of the model's
   * availability state in the current page context.
   */
  async init(): Promise<boolean> {
    this.translator = new BackgroundTranslator();
    // Quick ping to confirm the background translator is ready.
    try {
      await browser.runtime.sendMessage({ type: 'translate', text: 'test' });
    } catch (e) {
      console.warn('[CVW] Background translator not reachable:', e);
      return false;
    }
    console.log('[CVW] Using BackgroundTranslator.');
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
    const eligible = filterCandidates(allCandidates, (c) => !c.isProperNoun && !c.isMultiWord);

    // Fetch all P5 priority scores in parallel (getWordPriority is async).
    const scores = await Promise.all(eligible.map((c) => getWordPriority(c.word)));

    // Sort by priority descending and take the top density% of candidates.
    const ranked = eligible
      .map((c, i) => ({ candidate: c, score: scores[i] }))
      .sort((a, b) => b.score - a.score);

    const count = Math.max(1, Math.round(ranked.length * densityFraction));
    const selected = ranked.slice(0, count).map(({ candidate }) => candidate);

    // Group by block ancestor (paragraph, heading, etc.) in document order,
    // then process each block sequentially so top-of-page translations appear first.
    const byBlock = groupByBlock(selected);
    for (const blockGroup of byBlock.values()) {
      const byNode = groupByNode(blockGroup);
      await Promise.all([...byNode.values()].map((group) => this.translateGroup(group)));
    }
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
      })
    );

    const ranked = sentenceCandidates
      .map((sc, i) => ({ sc, score: scores[i] }))
      .sort((a, b) => b.score - a.score);

    const count = Math.max(1, Math.round(ranked.length * densityFraction));
    const selected = ranked.slice(0, count).map(({ sc }) => sc);

    // Group by block ancestor in document order, then process sequentially.
    const byBlock = groupSentencesByBlock(selected);
    for (const blockGroup of byBlock.values()) {
      const byNode = new Map<Text, SentenceCandidate[]>();
      for (const sc of blockGroup) {
        const group = byNode.get(sc.node) ?? [];
        group.push(sc);
        byNode.set(sc.node, group);
      }
      await Promise.all([...byNode.values()].map((group) => this.translateSentenceGroup(group)));
    }
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

  /**
   * Translates a word using its POS and sentence context (from compromise via P3)
   * to avoid wrong-part-of-speech errors like "can" → "bote" instead of "poder".
   *
   * Strategy:
   *  1. Wrap the word in [[markers]] inside its actual sentence and translate the
   *     whole phrase — the API returns contextually correct output and the markers
   *     survive so we can extract just the translated word.
   *  2. If no sentence is available, fall back to a short POS-specific phrase
   *     ("I [[can]]" for verbs, "The [[can]]" for nouns, etc.).
   *  3. If the markers are stripped or translation throws, translate the bare word.
   */
  private async translateWithContext(candidate: WordCandidate): Promise<string> {
    let query: string;

    const sentence = getSentenceForCandidate(candidate);
    if (sentence) {
      const sentenceStart = candidate.node.data.indexOf(sentence);
      if (sentenceStart !== -1) {
        const wordOffsetInSentence = candidate.offset - sentenceStart;
        const before = sentence.slice(0, wordOffsetInSentence);
        const after = sentence.slice(wordOffsetInSentence + candidate.length);
        query = `${before}[[${candidate.word}]]${after}`;
      } else {
        query = buildPOSQuery(candidate.word, candidate.pos);
      }
    } else {
      query = buildPOSQuery(candidate.word, candidate.pos);
    }

    try {
      const cached = this.cache.get(query);
      const translated = cached ?? (await this.translator!.translate(query));
      if (!cached) this.cache.set(query, translated);
      const match = translated.match(/\[\[(.+?)\]\]/);
      if (match?.[1]) return match[1].trim();
    } catch {
      // fall through to bare-word fallback
    }

    const wordQuery = candidate.word;
    const cachedWord = this.cache.get(wordQuery);
    if (cachedWord) return cachedWord;
    const wordTranslation = await this.translator!.translate(wordQuery);
    this.cache.set(wordQuery, wordTranslation);
    return wordTranslation;
  }

  private async translateGroup(candidates: WordCandidate[]): Promise<void> {
    // Descending offset order: replace rightmost words first to preserve offsets.
    const sorted = [...candidates].sort((a, b) => b.offset - a.offset);

    for (const candidate of sorted) {
      try {
        const translated = await this.translateWithContext(candidate);
        // Skip if the API returned the original word unchanged (translation failed silently).
        if (translated.toLowerCase() === candidate.word.toLowerCase()) continue;
        replaceInDom(candidate, translated);
        // Fire-and-forget: tell P5 this word was exposed on the page.
        trackExposure(candidate.word, translated).catch(() => {});
      } catch (err) {
        console.error(`[CVW] Translation failed for "${candidate.word}":`, err);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/**
 * Builds a short, unambiguous phrase for translating a word in isolation.
 * Uses the POS tag produced by compromise (via P3) to pick a syntactic frame
 * that forces the translation API toward the correct meaning.
 *
 * Examples:
 *   Verb "can"  → "I [[can]]"        → "Yo [[puedo]]"  → "puedo"
 *   Noun "can"  → "The [[can]]"      → "La [[lata]]"   → "lata"
 *   Adj  "fast" → "It is [[fast]]"   → "Es [[rápido]]" → "rápido"
 */
function buildPOSQuery(word: string, pos: string): string {
  switch (pos) {
    case 'Verb':
      return `I [[${word}]]`;
    case 'Noun':
      return `The [[${word}]]`;
    case 'Adjective':
      return `It is [[${word}]]`;
    case 'Adverb':
      return `I do it [[${word}]]`;
    default:
      return `[[${word}]]`;
  }
}

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'SECTION',
  'ARTICLE',
  'BLOCKQUOTE',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'TD',
  'TH',
  'FIGCAPTION',
  'ASIDE',
  'HEADER',
  'FOOTER',
  'MAIN',
]);

function getBlockAncestor(node: Node): Element {
  let el: Element | null = node.parentElement;
  while (el) {
    if (BLOCK_TAGS.has(el.tagName)) return el;
    el = el.parentElement;
  }
  return document.body;
}

/**
 * Groups candidates by their nearest block-level ancestor.
 * Map insertion order mirrors document order because candidates arrive
 * from P3's TreeWalker traversal (top-to-bottom).
 */
function groupByBlock(candidates: WordCandidate[]): Map<Element, WordCandidate[]> {
  const map = new Map<Element, WordCandidate[]>();
  for (const c of candidates) {
    const block = getBlockAncestor(c.node);
    const existing = map.get(block) ?? [];
    existing.push(c);
    map.set(block, existing);
  }
  return map;
}

function groupSentencesByBlock(sentences: SentenceCandidate[]): Map<Element, SentenceCandidate[]> {
  const map = new Map<Element, SentenceCandidate[]>();
  for (const sc of sentences) {
    const block = getBlockAncestor(sc.node);
    const existing = map.get(block) ?? [];
    existing.push(sc);
    map.set(block, existing);
  }
  return map;
}

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

  const span = createWordSpan(word, translation, parent as Element);

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

  const span = createSentenceSpan(sentence, translation, parent as Element);
  parent.replaceChild(span, sentenceNode);

  void restNode; // already re-attached to the DOM by splitText
}

function createSentenceSpan(
  original: string,
  translation: string,
  contextEl?: Element
): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'cvw-sentence';
  span.dataset.original = original;
  span.dataset.translation = translation;
  span.textContent = translation;
  span.title = original;

  // Apply contrast-maximising accent colors based on the actual background.
  if (contextEl) {
    applyAccentColors(span, pickSentenceAccentColors(getEffectiveBgLuminance(contextEl)));
  }

  span.addEventListener('mouseenter', () => {
    span.textContent = original;
  });
  span.addEventListener('mouseleave', () => {
    span.textContent = translation;
  });

  return span;
}

// ── Contrast-aware accent color utilities ────────────────────────────────────

/** Parses "rgb(r, g, b)" or "rgba(r, g, b, a)" → [r, g, b] | null */
function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

/** WCAG 2.1 relative luminance for an sRGB triplet (0–255 each). */
function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Walks up the DOM from `el` to find the first non-transparent background
 * color and returns its relative luminance. Falls back to 1.0 (white).
 */
function getEffectiveBgLuminance(el: Element): number {
  let node: Element | null = el;
  while (node) {
    const bg = window.getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      const rgb = parseRgb(bg);
      if (rgb) return relativeLuminance(...rgb);
    }
    node = node.parentElement;
  }
  return 1; // assume white background
}

interface AccentColors {
  color: string;
  border: string;
  hoverColor: string;
  hoverBorder: string;
  hoverBg: string;
}

/** Returns green accent colors optimised for contrast against `bgLuminance`. */
function pickWordAccentColors(bgLuminance: number): AccentColors {
  return bgLuminance > 0.18
    ? {
        color: '#1b5e20',
        border: '#2e7d32',
        hoverColor: '#1b5e20',
        hoverBorder: '#1b5e20',
        hoverBg: '#e8f5e9',
      }
    : {
        color: '#a5d6a7',
        border: '#81c784',
        hoverColor: '#c8e6c9',
        hoverBorder: '#c8e6c9',
        hoverBg: 'rgba(129,199,132,0.2)',
      };
}

/** Returns blue accent colors optimised for contrast against `bgLuminance`. */
function pickSentenceAccentColors(bgLuminance: number): AccentColors {
  return bgLuminance > 0.18
    ? {
        color: '#1e3a8a',
        border: '#1d4ed8',
        hoverColor: '#1e3a8a',
        hoverBorder: '#1d4ed8',
        hoverBg: 'rgba(59,130,246,0.1)',
      }
    : {
        color: '#93c5fd',
        border: '#60a5fa',
        hoverColor: '#bfdbfe',
        hoverBorder: '#60a5fa',
        hoverBg: 'rgba(96,165,250,0.15)',
      };
}

/** Writes accent colors as CSS custom properties on a span's inline style. */
function applyAccentColors(span: HTMLSpanElement, c: AccentColors): void {
  span.style.setProperty('--cvw-color', c.color);
  span.style.setProperty('--cvw-border', c.border);
  span.style.setProperty('--cvw-hover-color', c.hoverColor);
  span.style.setProperty('--cvw-hover-border', c.hoverBorder);
  span.style.setProperty('--cvw-hover-bg', c.hoverBg);
}

// ── Text measurement ─────────────────────────────────────────────────────────

// Reused across calls to avoid creating a new canvas every replacement.
let _measureCanvas: HTMLCanvasElement | null = null;

/**
 * Measures the rendered pixel width of `text` using the computed font of
 * `contextEl` (falls back to 16px sans-serif if unavailable).
 */
function measureTextPx(text: string, contextEl?: Element): number {
  if (!_measureCanvas) _measureCanvas = document.createElement('canvas');
  const ctx = _measureCanvas.getContext('2d');
  if (!ctx) return text.length * 8; // safe fallback
  ctx.font = contextEl
    ? window.getComputedStyle(contextEl).font || '16px sans-serif'
    : '16px sans-serif';
  return ctx.measureText(text).width;
}

function createWordSpan(
  original: string,
  translation: string,
  contextEl?: Element
): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'cvw-word';
  span.dataset.original = original;
  span.dataset.translation = translation;
  span.textContent = translation;
  span.title = original; // fallback tooltip

  // Apply contrast-maximising accent colors based on the actual background.
  if (contextEl) {
    applyAccentColors(span, pickWordAccentColors(getEffectiveBgLuminance(contextEl)));
  }

  // Reserve the wider of the two strings' pixel widths so surrounding text
  // never reflows when toggling between translation and original on hover.
  const origPx = measureTextPx(original, contextEl);
  const transPx = measureTextPx(translation, contextEl);
  if (Math.round(origPx) !== Math.round(transPx)) {
    span.style.display = 'inline-block';
    span.style.minWidth = `${Math.max(origPx, transPx)}px`;
    span.style.textAlign = 'center';
  }

  span.addEventListener('mouseenter', () => {
    span.textContent = original;
    // Fire-and-forget: hovering to see the original counts as a recall failure.
    trackRecallFailure(original).catch(() => {});
  });
  span.addEventListener('mouseleave', () => {
    span.textContent = translation;
  });

  return span;
}
