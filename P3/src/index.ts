/**
 * Contextual Vocabulary Weaver - P3: DOM & NLP Module
 *
 * This module provides DOM traversal and NLP capabilities for extracting
 * word candidates from web pages for translation.
 */

// Main API
export {
  extractCandidates,
  extractCandidatesFromElement,
  filterCandidates,
  groupCandidatesByElement,
  getSentenceForCandidate,
  type ExtractorConfig,
} from './extractor.js';

// DOM utilities
export {
  extractTextNodes,
  extractContentText,
  shouldSkipElement,
} from './dom/walker.js';

// NLP utilities
export {
  tagText,
  detectMultiWordExpressions,
  isWithinMultiWord,
  filterContentWords,
  isSimpleSentence,
  extractSimpleClauses,
  type TaggedWord,
} from './nlp/tagger.js';

// Types
export type {
  WordCandidate,
  PartOfSpeech,
  DOMWalkerConfig,
  NLPConfig,
} from './types.js';
