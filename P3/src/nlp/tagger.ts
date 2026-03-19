import nlp from 'compromise';
import { PartOfSpeech, NLPConfig } from '../types.js';

/**
 * Maps compromise.js tags to our simplified POS types
 */
function mapCompromiseTag(tags: string[]): PartOfSpeech {
  if (tags.includes('Noun') || tags.includes('Singular') || tags.includes('Plural')) {
    return 'Noun';
  }
  if (tags.includes('Verb')) {
    return 'Verb';
  }
  if (tags.includes('Adjective')) {
    return 'Adjective';
  }
  if (tags.includes('Adverb')) {
    return 'Adverb';
  }
  if (tags.includes('Pronoun')) {
    return 'Pronoun';
  }
  if (tags.includes('Preposition')) {
    return 'Preposition';
  }
  if (tags.includes('Conjunction')) {
    return 'Conjunction';
  }
  if (tags.includes('Determiner')) {
    return 'Determiner';
  }
  return 'Unknown';
}

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
export function tagText(text: string, config: NLPConfig = {}): TaggedWord[] {
  const doc = nlp(text);
  const results: TaggedWord[] = [];

  // Get the JSON representation which has detailed term info
  const jsonTerms = doc.terms().json();

  let currentOffset = 0;

  // Process each term group
  jsonTerms.forEach((termGroup: any) => {
    // Each term group has a nested terms array
    if (termGroup.terms && termGroup.terms.length > 0) {
      termGroup.terms.forEach((term: any) => {
        const wordText = term.text;
        const tags = term.tags || [];
        const pos = mapCompromiseTag(tags);
        const isProperNoun = tags.includes('ProperNoun') || tags.includes('Person') || tags.includes('Place');

        // Skip proper nouns if configured
        if (config.skipProperNouns && isProperNoun) {
          return;
        }

        // Filter by POS type if configured
        if (config.includePos && !config.includePos.includes(pos)) {
          return;
        }

        // Find the actual offset in the original text
        const offset = text.indexOf(wordText, currentOffset);

        if (offset >= 0) {
          results.push({
            text: wordText,
            pos,
            isProperNoun,
            isMultiWord: false, // Will be detected separately
            offset,
            length: wordText.length,
          });

          // Update current offset for next search
          currentOffset = offset + wordText.length;
        }
      });
    }
  });

  return results;
}

/**
 * Detects multi-word expressions and idioms
 * Returns ranges of words that should be kept together
 */
export function detectMultiWordExpressions(text: string): Array<{ start: number; end: number; phrase: string }> {
  const doc = nlp(text);
  const multiWords: Array<{ start: number; end: number; phrase: string }> = [];

  // Detect noun phrases (e.g., "ice cream", "high school")
  doc.nouns().forEach((noun: any) => {
    const phrase = noun.text();
    if (phrase && phrase.includes(' ')) {
      const start = text.indexOf(phrase);
      if (start >= 0) {
        multiWords.push({
          start,
          end: start + phrase.length,
          phrase,
        });
      }
    }
  });

  // Detect phrasal verbs (e.g., "give up", "turn on")
  doc.verbs().forEach((verb: any) => {
    const phrase = verb.text();
    if (phrase && phrase.includes(' ')) {
      const start = text.indexOf(phrase);
      if (start >= 0) {
        multiWords.push({
          start,
          end: start + phrase.length,
          phrase,
        });
      }
    }
  });

  // Detect common expressions and idioms using regex
  const idiomPatterns = [
    /\b(by the way|as a matter of fact|at the moment|in order to)\b/gi,
    /\b(a lot of|a bunch of|a couple of|a piece of)\b/gi,
  ];

  idiomPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      multiWords.push({
        start: match.index,
        end: match.index + match[0].length,
        phrase: match[0],
      });
    }
  });

  return multiWords;
}

/**
 * Checks if a word position falls within a multi-word expression
 */
export function isWithinMultiWord(
  offset: number,
  multiWords: Array<{ start: number; end: number }>
): boolean {
  return multiWords.some((mw) => offset >= mw.start && offset < mw.end);
}

/**
 * Filters words that are suitable for translation
 * Returns only content words (nouns, verbs, adjectives, adverbs)
 */
export function filterContentWords(taggedWords: TaggedWord[]): TaggedWord[] {
  const contentPOS: PartOfSpeech[] = ['Noun', 'Verb', 'Adjective', 'Adverb'];
  return taggedWords.filter((word) => {
    // Must be a content word
    if (!contentPOS.includes(word.pos)) {
      return false;
    }
    // Skip very short words (likely articles, prepositions)
    if (word.text.length < 3) {
      return false;
    }
    return true;
  });
}
