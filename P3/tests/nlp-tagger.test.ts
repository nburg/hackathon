import { describe, it, expect } from 'vitest';
import {
  tagText,
  detectMultiWordExpressions,
  isWithinMultiWord,
  filterContentWords,
} from '../src/nlp/tagger.js';

describe('NLP Tagger', () => {
  describe('tagText', () => {
    it('should identify nouns', () => {
      const result = tagText('The cat sits on the mat');
      const nouns = result.filter(w => w.pos === 'Noun');

      expect(nouns.length).toBeGreaterThan(0);
      expect(nouns.map(n => n.text)).toContain('cat');
      expect(nouns.map(n => n.text)).toContain('mat');
    });

    it('should identify verbs', () => {
      const result = tagText('She runs quickly through the park');
      const verbs = result.filter(w => w.pos === 'Verb');

      expect(verbs.length).toBeGreaterThan(0);
      expect(verbs.map(v => v.text)).toContain('runs');
    });

    it('should identify adjectives', () => {
      const result = tagText('The beautiful sunset was amazing');
      const adjectives = result.filter(w => w.pos === 'Adjective');

      expect(adjectives.length).toBeGreaterThan(0);
      expect(adjectives.map(a => a.text.toLowerCase())).toContain('beautiful');
    });

    it('should identify adverbs', () => {
      const result = tagText('He quickly ran away');
      const adverbs = result.filter(w => w.pos === 'Adverb');

      expect(adverbs.length).toBeGreaterThan(0);
      expect(adverbs.map(a => a.text.toLowerCase())).toContain('quickly');
    });

    it('should detect proper nouns', () => {
      const result = tagText('John visited Paris last summer');
      const properNouns = result.filter(w => w.isProperNoun);

      expect(properNouns.length).toBeGreaterThan(0);
      expect(properNouns.map(p => p.text)).toContain('John');
      expect(properNouns.map(p => p.text)).toContain('Paris');
    });

    it('should skip proper nouns when configured', () => {
      const result = tagText('John visited Paris', { skipProperNouns: true });

      expect(result.every(w => !w.isProperNoun)).toBe(true);
      expect(result.map(w => w.text)).not.toContain('John');
      expect(result.map(w => w.text)).not.toContain('Paris');
    });

    it('should filter by POS type when configured', () => {
      const result = tagText('The cat runs quickly', {
        includePos: ['Noun', 'Verb'],
      });

      expect(result.every(w => w.pos === 'Noun' || w.pos === 'Verb')).toBe(true);
      expect(result.some(w => w.pos === 'Adverb')).toBe(false);
    });
  });

  describe('detectMultiWordExpressions', () => {
    it('should detect noun phrases', () => {
      const text = 'I love ice cream. High school was fun.';
      const multiWords = detectMultiWordExpressions(text);

      expect(multiWords.length).toBeGreaterThan(0);
      const phrases = multiWords.map(mw => mw.phrase.toLowerCase());
      // Should detect at least one multi-word phrase
      expect(phrases.some(p => p.includes('ice cream') || p.includes('high school'))).toBe(true);
    });

    it('should detect common expressions', () => {
      const text = 'By the way, I have a lot of work';
      const multiWords = detectMultiWordExpressions(text);

      const phrases = multiWords.map(mw => mw.phrase.toLowerCase());
      expect(phrases.some(p => p.includes('by the way'))).toBe(true);
      expect(phrases.some(p => p.includes('a lot of'))).toBe(true);
    });

    it('should return start and end positions', () => {
      const text = 'I have a lot of work';
      const multiWords = detectMultiWordExpressions(text);

      const lotOf = multiWords.find(mw => mw.phrase.toLowerCase().includes('a lot of'));
      expect(lotOf).toBeDefined();
      expect(lotOf!.start).toBeGreaterThanOrEqual(0);
      expect(lotOf!.end).toBeGreaterThan(lotOf!.start);
    });
  });

  describe('isWithinMultiWord', () => {
    it('should return true for positions within a multi-word expression', () => {
      const multiWords = [{ start: 10, end: 20, phrase: 'test phrase' }];

      expect(isWithinMultiWord(15, multiWords)).toBe(true);
      expect(isWithinMultiWord(10, multiWords)).toBe(true);
      expect(isWithinMultiWord(19, multiWords)).toBe(true);
    });

    it('should return false for positions outside multi-word expressions', () => {
      const multiWords = [{ start: 10, end: 20, phrase: 'test phrase' }];

      expect(isWithinMultiWord(5, multiWords)).toBe(false);
      expect(isWithinMultiWord(25, multiWords)).toBe(false);
      expect(isWithinMultiWord(20, multiWords)).toBe(false); // end is exclusive
    });
  });

  describe('filterContentWords', () => {
    it('should keep nouns, verbs, adjectives, and adverbs', () => {
      const words = [
        { text: 'cat', pos: 'Noun' as const, isProperNoun: false, isMultiWord: false, offset: 0, length: 3 },
        { text: 'runs', pos: 'Verb' as const, isProperNoun: false, isMultiWord: false, offset: 4, length: 4 },
        { text: 'quickly', pos: 'Adverb' as const, isProperNoun: false, isMultiWord: false, offset: 9, length: 7 },
        { text: 'beautiful', pos: 'Adjective' as const, isProperNoun: false, isMultiWord: false, offset: 17, length: 9 },
      ];

      const filtered = filterContentWords(words);

      expect(filtered.length).toBe(4);
    });

    it('should filter out function words', () => {
      const words = [
        { text: 'cat', pos: 'Noun' as const, isProperNoun: false, isMultiWord: false, offset: 0, length: 3 },
        { text: 'the', pos: 'Determiner' as const, isProperNoun: false, isMultiWord: false, offset: 4, length: 3 },
        { text: 'on', pos: 'Preposition' as const, isProperNoun: false, isMultiWord: false, offset: 8, length: 2 },
        { text: 'and', pos: 'Conjunction' as const, isProperNoun: false, isMultiWord: false, offset: 11, length: 3 },
      ];

      const filtered = filterContentWords(words);

      expect(filtered.length).toBe(1);
      expect(filtered[0].text).toBe('cat');
    });

    it('should filter out very short words', () => {
      const words = [
        { text: 'a', pos: 'Noun' as const, isProperNoun: false, isMultiWord: false, offset: 0, length: 1 },
        { text: 'go', pos: 'Verb' as const, isProperNoun: false, isMultiWord: false, offset: 2, length: 2 },
        { text: 'cat', pos: 'Noun' as const, isProperNoun: false, isMultiWord: false, offset: 5, length: 3 },
      ];

      const filtered = filterContentWords(words);

      expect(filtered.length).toBe(1);
      expect(filtered[0].text).toBe('cat');
    });
  });
});
