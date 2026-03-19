/**
 * Contextual Vocabulary Weaver - P3: DOM & NLP Module
 *
 * This module provides DOM traversal and NLP capabilities for extracting
 * word candidates from web pages for translation.
 */
// Main API
export { extractCandidates, extractCandidatesFromElement, filterCandidates, groupCandidatesByElement, getSentenceForCandidate, } from './extractor.js';
// DOM utilities
export { extractTextNodes, extractContentText, shouldSkipElement, } from './dom/walker.js';
// NLP utilities
export { tagText, detectMultiWordExpressions, isWithinMultiWord, filterContentWords, } from './nlp/tagger.js';
//# sourceMappingURL=index.js.map