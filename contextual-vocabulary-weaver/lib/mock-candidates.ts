import type { WordCandidate } from '@p3/types';

/**
 * Mock data for P4 development and testing — kept as a test fixture even
 * now that P3's real `extractCandidates()` is integrated into the pipeline.
 *
 * Field names and types match P3's WordCandidate interface exactly.
 */

const SENTENCES = [
  'The curious dog quickly jumped over the tall fence and ran into the dark forest.',
  'Scientists discovered a new species of butterfly in the tropical rainforest last year.',
  'She reads books every evening to expand her vocabulary and improve her writing skills.',
] as const;

// One Text node per sentence so offset arithmetic stays simple.
const node0 = document.createTextNode(SENTENCES[0]);
const node1 = document.createTextNode(SENTENCES[1]);
const node2 = document.createTextNode(SENTENCES[2]);

export const mockCandidates: WordCandidate[] = [
  // --- Sentence 0 ---
  {
    word: 'curious',
    pos: 'Adjective',
    node: node0,
    offset: 4,
    length: 7,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'quickly',
    pos: 'Adverb',
    node: node0,
    offset: 16,
    length: 7,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'jumped',
    pos: 'Verb',
    node: node0,
    offset: 24,
    length: 6,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'forest',
    pos: 'Noun',
    node: node0,
    offset: 73,
    length: 6,
    isProperNoun: false,
    isMultiWord: false,
  },

  // --- Sentence 1 ---
  {
    word: 'discovered',
    pos: 'Verb',
    node: node1,
    offset: 11,
    length: 10,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'new',
    pos: 'Adjective',
    node: node1,
    offset: 24,
    length: 3,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'butterfly',
    pos: 'Noun',
    node: node1,
    offset: 39,
    length: 9,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'tropical',
    pos: 'Adjective',
    node: node1,
    offset: 56,
    length: 8,
    isProperNoun: false,
    isMultiWord: false,
  },

  // --- Sentence 2 ---
  {
    word: 'reads',
    pos: 'Verb',
    node: node2,
    offset: 4,
    length: 5,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'expand',
    pos: 'Verb',
    node: node2,
    offset: 33,
    length: 6,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'vocabulary',
    pos: 'Noun',
    node: node2,
    offset: 44,
    length: 10,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'improve',
    pos: 'Verb',
    node: node2,
    offset: 59,
    length: 7,
    isProperNoun: false,
    isMultiWord: false,
  },
  {
    word: 'writing',
    pos: 'Noun',
    node: node2,
    offset: 71,
    length: 7,
    isProperNoun: false,
    isMultiWord: false,
  },
];
