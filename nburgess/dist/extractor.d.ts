import { WordCandidate, DOMWalkerConfig, NLPConfig } from './types.js';
/**
 * Configuration for candidate extraction
 */
export interface ExtractorConfig {
    dom?: DOMWalkerConfig;
    nlp?: NLPConfig;
}
/**
 * Main API: Extracts word candidates from the document
 * This is the primary interface that P4 (Translation Pipeline) will use
 */
export declare function extractCandidates(root?: Document | Element, config?: ExtractorConfig): WordCandidate[];
/**
 * Extracts candidates from a specific element (useful for dynamic content)
 */
export declare function extractCandidatesFromElement(element: Element, config?: ExtractorConfig): WordCandidate[];
/**
 * Filters candidates based on custom criteria
 * Useful for P4 to apply density settings and word priority
 */
export declare function filterCandidates(candidates: WordCandidate[], filter: (candidate: WordCandidate) => boolean): WordCandidate[];
/**
 * Groups candidates by their containing element
 * Useful for ensuring even distribution across the page
 */
export declare function groupCandidatesByElement(candidates: WordCandidate[]): Map<Element, WordCandidate[]>;
/**
 * Utility: Gets the sentence containing a word candidate
 * Useful for Phase 2 sentence-level replacement
 */
export declare function getSentenceForCandidate(candidate: WordCandidate): string | null;
//# sourceMappingURL=extractor.d.ts.map