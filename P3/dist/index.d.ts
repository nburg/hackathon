/**
 * Contextual Vocabulary Weaver - P3: DOM & NLP Module
 *
 * This module provides DOM traversal and NLP capabilities for extracting
 * word candidates from web pages for translation.
 */
export { extractCandidates, extractCandidatesFromElement, filterCandidates, groupCandidatesByElement, getSentenceForCandidate, type ExtractorConfig, } from './extractor.js';
export { extractTextNodes, extractContentText, shouldSkipElement, } from './dom/walker.js';
export { tagText, detectMultiWordExpressions, isWithinMultiWord, filterContentWords, type TaggedWord, } from './nlp/tagger.js';
export type { WordCandidate, PartOfSpeech, DOMWalkerConfig, NLPConfig, } from './types.js';
//# sourceMappingURL=index.d.ts.map