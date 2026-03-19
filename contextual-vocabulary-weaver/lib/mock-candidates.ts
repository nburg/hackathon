import type { WordCandidate } from './types';

/**
 * Mock data for P4 development — simulates the output of P3's
 * `extractCandidates()` while that module is still being built.
 *
 * Three sample sentences are used to cover all four POS categories
 * and to exercise the density/selection logic realistically.
 *
 * Replace this with the real `extractCandidates(document)` call once P3's
 * implementation is ready.
 */

// ---------------------------------------------------------------------------
// Sample text nodes (stand-ins for real DOM Text nodes on a page)
// ---------------------------------------------------------------------------

const SENTENCES = [
  'The curious dog quickly jumped over the tall fence and ran into the dark forest.',
  'Scientists discovered a new species of butterfly in the tropical rainforest last year.',
  'She reads books every evening to expand her vocabulary and improve her writing skills.',
] as const;

function textNode(sentence: string): Text {
  return document.createTextNode(sentence);
}

// Create one Text node per sentence so offset arithmetic stays simple.
const node0 = textNode(SENTENCES[0]);
const node1 = textNode(SENTENCES[1]);
const node2 = textNode(SENTENCES[2]);

// ---------------------------------------------------------------------------
// Mock candidates
// Offsets were computed against the sentence strings above.
// ---------------------------------------------------------------------------

export const mockCandidates: WordCandidate[] = [
  // --- Sentence 0 ---
  {
    word: 'curious',
    pos: 'adjective',
    textNode: node0,
    offset: 4,
    sentence: SENTENCES[0],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'quickly',
    pos: 'adverb',
    textNode: node0,
    offset: 16,
    sentence: SENTENCES[0],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'jumped',
    pos: 'verb',
    textNode: node0,
    offset: 24,
    sentence: SENTENCES[0],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'forest',
    pos: 'noun',
    textNode: node0,
    offset: 73,
    sentence: SENTENCES[0],
    isProperNoun: false,
    isPartOfIdiom: false,
  },

  // --- Sentence 1 ---
  {
    word: 'discovered',
    pos: 'verb',
    textNode: node1,
    offset: 11,
    sentence: SENTENCES[1],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'new',
    pos: 'adjective',
    textNode: node1,
    offset: 24,
    sentence: SENTENCES[1],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'butterfly',
    pos: 'noun',
    textNode: node1,
    offset: 39,
    sentence: SENTENCES[1],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'tropical',
    pos: 'adjective',
    textNode: node1,
    offset: 56,
    sentence: SENTENCES[1],
    isProperNoun: false,
    isPartOfIdiom: false,
  },

  // --- Sentence 2 ---
  {
    word: 'reads',
    pos: 'verb',
    textNode: node2,
    offset: 4,
    sentence: SENTENCES[2],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'expand',
    pos: 'verb',
    textNode: node2,
    offset: 33,
    sentence: SENTENCES[2],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'vocabulary',
    pos: 'noun',
    textNode: node2,
    offset: 44,
    sentence: SENTENCES[2],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'improve',
    pos: 'verb',
    textNode: node2,
    offset: 59,
    sentence: SENTENCES[2],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
  {
    word: 'writing',
    pos: 'noun',
    textNode: node2,
    offset: 71,
    sentence: SENTENCES[2],
    isProperNoun: false,
    isPartOfIdiom: false,
  },
];

/**
 * Filters the mock list down by density percentage (0–1) and an optional
 * priority score array from P5's `getWordPriority()`.
 *
 * When P5's storage layer is ready, pass real scores in; until then the mock
 * assigns equal priority to every candidate.
 */
export function selectCandidates(
  candidates: WordCandidate[],
  densityFraction: number,
  getPriority: (word: string) => number = () => 1,
): WordCandidate[] {
  // Skip proper nouns and idiom fragments — mirrors what P4's real pipeline must do.
  const eligible = candidates.filter(
    (c) => !c.isProperNoun && !c.isPartOfIdiom,
  );

  // Sort by priority descending so the most valuable words are picked first.
  const sorted = eligible.sort(
    (a, b) => getPriority(b.word) - getPriority(a.word),
  );

  const count = Math.max(1, Math.round(sorted.length * densityFraction));
  return sorted.slice(0, count);
}
