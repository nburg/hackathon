export type POS = 'noun' | 'verb' | 'adjective' | 'adverb';

/**
 * A candidate word identified by P3 (DOM & NLP Engineer) as eligible for
 * translation. P4 consumes an array of these to drive the replacement pipeline.
 */
export interface WordCandidate {
  /** The original surface form of the word as it appears in the page. */
  word: string;
  /** Part-of-speech tag assigned by compromise.js. */
  pos: POS;
  /** The DOM Text node that contains this word. */
  textNode: Text;
  /** Character offset of `word` within `textNode.data`. */
  offset: number;
  /** Full sentence the word belongs to — used by the Phase 2 sentence pipeline. */
  sentence: string;
  /** Proper nouns must never be translated. */
  isProperNoun: boolean;
  /** Words inside idioms or multi-word expressions must not be swapped alone. */
  isPartOfIdiom: boolean;
}
