import nlp from 'compromise';
import { PartOfSpeech, NLPConfig } from '../types.js';

/**
 * Maps compromise.js tags to our simplified POS types
 */
function mapCompromiseTag(tags: string[]): PartOfSpeech {
  // Pronoun must be checked before Noun/Plural: compromise gives plural pronouns
  // (they, them, those, etc.) both a 'Pronoun' tag and a 'Plural' tag.
  // Without this, "they/them" would be mis-classified as Noun and sent for translation.
  if (tags.includes('Pronoun')) {
    return 'Pronoun';
  }
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
 * Returns true if `sentence` is a simple sentence (one independent clause,
 * no subordinate or relative clauses).
 *
 * Uses compromise to check three structural signals:
 *
 * 1. Subordinating conjunctions (#Subordinator): because, although, since,
 *    when, if, while, unless, until, after, before, as, though, etc.
 *    → their presence marks a complex sentence.
 *
 * 2. Relative clause opener: (who|which) immediately before a verb phrase.
 *    → "the man who runs" is complex; "who" as a question word is less common
 *    in body text and fine to reject conservatively.
 *
 * 3. Compound sentence pattern: a coordinating conjunction (and|but|or)
 *    directly followed by a subject pronoun or proper noun then a verb.
 *    → "she sang and he danced" is compound; "cats and dogs" is not.
 *
 * 4. Backstop: more than 2 finite verb phrases almost always indicates
 *    multiple clauses (allowing 2 covers compound predicates like
 *    "She ran and jumped").
 */
export function isSimpleSentence(sentence: string): boolean {
  const doc = nlp(sentence);

  // 1. Subordinating conjunction → complex sentence
  if (doc.match('#Subordinator').found) return false;

  // 2. Relative clause: (who|which) + verb phrase
  if (doc.match('(who|which) #Verb+').found) return false;

  // 3. Coordinating conjunction joining two independent clauses:
  //    (and|but|or) + subject (pronoun or proper noun) + verb
  if (doc.match('(and|but|or) (#Pronoun|#ProperNoun) #Verb').found) return false;

  // 4. Verb count backstop
  if (doc.verbs().length > 2) return false;

  return true;
}

/**
 * Splits a sentence into its component clauses and returns those that are
 * structurally suitable for translation as independent units.
 *
 * - If the sentence is already simple, returns it unchanged: [sentence].
 * - Otherwise, attempts two splitting strategies in order:
 *
 *   1. Subordinating conjunctions — the most reliable clause boundary
 *      (because, although, since, while, when, if, unless, until,
 *       after, before, though). Splits produce two or more parts.
 *
 *   2. Coordinating conjunctions (and, but, or, nor, yet, so) — only
 *      used when BOTH sides of the split independently contain a verb,
 *      i.e. it is a genuine compound sentence rather than a list.
 *
 *   In both cases each candidate chunk must be at least 4 characters
 *   long and contain at least one verb to count as a valid clause.
 *
 * - Returns [] when no splittable clauses can be identified (caller
 *   should skip the sentence entirely).
 */
export function extractSimpleClauses(sentence: string): string[] {
  if (isSimpleSentence(sentence)) return [sentence];

  // Strategy 1: split at subordinating conjunctions.
  const subParts = sentence
    .split(/\s+(?:because|although|though|since|while|when|if|unless|until|after|before)\s+/i)
    .map((p) => p.trim())
    .filter((p) => p.length >= 4 && nlp(p).verbs().length > 0);

  if (subParts.length > 1) return subParts;

  // Strategy 2: split at coordinating conjunctions only when both halves
  // independently contain a verb (compound sentence, not a list).
  const coordParts = sentence
    .split(/\s+(?:and|but|or|nor|yet|so)\s+/i)
    .map((p) => p.trim())
    .filter((p) => p.length >= 4);

  if (coordParts.length > 1 && coordParts.every((p) => nlp(p).verbs().length > 0)) {
    return coordParts;
  }

  return [];
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
