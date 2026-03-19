import { extractTextNodes } from './dom/walker.js';
import { tagText, detectMultiWordExpressions, isWithinMultiWord, filterContentWords } from './nlp/tagger.js';
/**
 * Main API: Extracts word candidates from the document
 * This is the primary interface that P4 (Translation Pipeline) will use
 */
export function extractCandidates(root = document, config = {}) {
    const candidates = [];
    // Step 1: Extract all text nodes from the DOM
    const textNodes = extractTextNodes(root, config.dom);
    // Step 2: Process each text node
    textNodes.forEach((node) => {
        const text = node.textContent || '';
        if (text.trim().length === 0)
            return;
        // Step 3: Tag the text with POS information
        const taggedWords = tagText(text, config.nlp);
        // Step 4: Detect multi-word expressions in this text
        const multiWords = config.nlp?.detectMultiWord !== false
            ? detectMultiWordExpressions(text)
            : [];
        // Step 5: Filter to content words only
        const contentWords = filterContentWords(taggedWords);
        // Step 6: Create WordCandidate objects
        contentWords.forEach((word) => {
            const isMultiWord = isWithinMultiWord(word.offset, multiWords);
            candidates.push({
                word: word.text,
                pos: word.pos,
                node,
                offset: word.offset,
                length: word.length,
                isMultiWord,
                isProperNoun: word.isProperNoun,
            });
        });
    });
    return candidates;
}
/**
 * Extracts candidates from a specific element (useful for dynamic content)
 */
export function extractCandidatesFromElement(element, config = {}) {
    return extractCandidates(element, config);
}
/**
 * Filters candidates based on custom criteria
 * Useful for P4 to apply density settings and word priority
 */
export function filterCandidates(candidates, filter) {
    return candidates.filter(filter);
}
/**
 * Groups candidates by their containing element
 * Useful for ensuring even distribution across the page
 */
export function groupCandidatesByElement(candidates) {
    const groups = new Map();
    candidates.forEach((candidate) => {
        const element = candidate.node.parentElement;
        if (!element)
            return;
        if (!groups.has(element)) {
            groups.set(element, []);
        }
        groups.get(element).push(candidate);
    });
    return groups;
}
/**
 * Utility: Gets the sentence containing a word candidate
 * Useful for Phase 2 sentence-level replacement
 */
export function getSentenceForCandidate(candidate) {
    const text = candidate.node.textContent || '';
    // Split on sentence-ending punctuation, but keep the punctuation
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentOffset = 0;
    for (const sentence of sentences) {
        const sentenceEnd = currentOffset + sentence.length;
        if (candidate.offset >= currentOffset && candidate.offset < sentenceEnd) {
            return sentence.trim();
        }
        // Account for the space that was removed by split
        currentOffset = sentenceEnd + 1;
    }
    return null;
}
//# sourceMappingURL=extractor.js.map