import { PartOfSpeech, NLPConfig } from '../types.js';
/**
 * Result of POS tagging a single word
 */
export interface TaggedWord {
    text: string;
    pos: PartOfSpeech;
    isProperNoun: boolean;
    isMultiWord: boolean;
    offset: number;
    length: number;
}
/**
 * Tags text with part-of-speech information using compromise.js
 */
export declare function tagText(text: string, config?: NLPConfig): TaggedWord[];
/**
 * Detects multi-word expressions and idioms
 * Returns ranges of words that should be kept together
 */
export declare function detectMultiWordExpressions(text: string): Array<{
    start: number;
    end: number;
    phrase: string;
}>;
/**
 * Checks if a word position falls within a multi-word expression
 */
export declare function isWithinMultiWord(offset: number, multiWords: Array<{
    start: number;
    end: number;
}>): boolean;
/**
 * Filters words that are suitable for translation
 * Returns only content words (nouns, verbs, adjectives, adverbs)
 */
export declare function filterContentWords(taggedWords: TaggedWord[]): TaggedWord[];
//# sourceMappingURL=tagger.d.ts.map