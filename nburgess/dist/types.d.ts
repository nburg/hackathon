/**
 * Part of speech types supported by compromise.js
 */
export type PartOfSpeech = 'Noun' | 'Verb' | 'Adjective' | 'Adverb' | 'Pronoun' | 'Preposition' | 'Conjunction' | 'Determiner' | 'Unknown';
/**
 * Represents a word candidate for translation
 */
export interface WordCandidate {
    /** The original word text */
    word: string;
    /** Part of speech tag */
    pos: PartOfSpeech;
    /** The DOM text node containing this word */
    node: Text;
    /** Character offset within the text node */
    offset: number;
    /** Length of the word */
    length: number;
    /** Whether this word is part of a multi-word expression/idiom */
    isMultiWord: boolean;
    /** Whether this is a proper noun (names, places) */
    isProperNoun: boolean;
}
/**
 * Configuration for DOM walker
 */
export interface DOMWalkerConfig {
    /** Elements to skip entirely */
    skipElements?: string[];
    /** ARIA roles to skip */
    skipAriaRoles?: string[];
    /** Minimum word length to consider */
    minWordLength?: number;
}
/**
 * Configuration for NLP tagger
 */
export interface NLPConfig {
    /** Whether to skip proper nouns */
    skipProperNouns?: boolean;
    /** Whether to identify and flag multi-word expressions */
    detectMultiWord?: boolean;
    /** POS types to include (null = all) */
    includePos?: PartOfSpeech[] | null;
}
//# sourceMappingURL=types.d.ts.map