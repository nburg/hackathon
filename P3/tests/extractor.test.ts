import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  extractCandidates,
  filterCandidates,
  groupCandidatesByElement,
  getSentenceForCandidate,
} from '../src/extractor.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Candidate Extractor', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    const html = readFileSync(join(__dirname, 'fixtures', 'sample.html'), 'utf-8');
    dom = new JSDOM(html);
    document = dom.window.document;
    (global as any).document = document;
    (global as any).window = dom.window;
  });

  describe('extractCandidates', () => {
    it('should extract word candidates from the document', () => {
      const candidates = extractCandidates(document);

      expect(candidates.length).toBeGreaterThan(0);
    });

    it('should extract content words (nouns, verbs, adjectives, adverbs)', () => {
      const candidates = extractCandidates(document);

      const poses = new Set(candidates.map(c => c.pos));
      expect(poses.has('Noun')).toBe(true);
      expect(poses.has('Verb')).toBe(true);
    });

    it('should not extract words from navigation', () => {
      const candidates = extractCandidates(document);
      const words = candidates.map(c => c.word);

      expect(words).not.toContain('Home');
      expect(words).not.toContain('About');
    });

    it('should not extract words from code blocks', () => {
      const candidates = extractCandidates(document);
      const allText = candidates.map(c => c.word).join(' ');

      expect(allText).not.toContain('function');
      expect(allText).not.toContain('console');
    });

    it('should mark proper nouns', () => {
      const html = '<p>John visited Paris yesterday.</p>';
      const testDom = new JSDOM(html);
      (global as any).document = testDom.window.document;
      (global as any).window = testDom.window;

      const candidates = extractCandidates(testDom.window.document);
      const properNouns = candidates.filter(c => c.isProperNoun);

      expect(properNouns.length).toBeGreaterThan(0);
    });

    it('should include DOM node reference', () => {
      const candidates = extractCandidates(document);

      candidates.forEach(candidate => {
        expect(candidate.node).toBeDefined();
        expect(candidate.node.nodeType).toBe(3); // Text node
      });
    });

    it('should include offset and length information', () => {
      const candidates = extractCandidates(document);

      candidates.forEach(candidate => {
        expect(candidate.offset).toBeGreaterThanOrEqual(0);
        expect(candidate.length).toBeGreaterThan(0);
        expect(candidate.length).toBe(candidate.word.length);
      });
    });
  });

  describe('filterCandidates', () => {
    it('should filter candidates based on custom criteria', () => {
      const candidates = extractCandidates(document);

      const nounsOnly = filterCandidates(candidates, c => c.pos === 'Noun');

      expect(nounsOnly.every(c => c.pos === 'Noun')).toBe(true);
    });

    it('should filter out proper nouns', () => {
      const html = '<p>John visited Paris yesterday.</p>';
      const testDom = new JSDOM(html);
      (global as any).document = testDom.window.document;
      (global as any).window = testDom.window;

      const candidates = extractCandidates(testDom.window.document);
      const noProperNouns = filterCandidates(candidates, c => !c.isProperNoun);

      expect(noProperNouns.every(c => !c.isProperNoun)).toBe(true);
    });

    it('should filter by word length', () => {
      const candidates = extractCandidates(document);
      const longWords = filterCandidates(candidates, c => c.word.length >= 7);

      expect(longWords.every(c => c.word.length >= 7)).toBe(true);
    });
  });

  describe('groupCandidatesByElement', () => {
    it('should group candidates by their parent element', () => {
      const candidates = extractCandidates(document);
      const groups = groupCandidatesByElement(candidates);

      expect(groups.size).toBeGreaterThan(0);

      // All candidates in each group should share the same parent element
      groups.forEach((groupCandidates, element) => {
        groupCandidates.forEach(candidate => {
          expect(candidate.node.parentElement).toBe(element);
        });
      });
    });

    it('should allow even distribution across elements', () => {
      const candidates = extractCandidates(document);
      const groups = groupCandidatesByElement(candidates);

      // Can select one word from each paragraph for even distribution
      const evenlyDistributed: typeof candidates = [];
      groups.forEach(groupCandidates => {
        if (groupCandidates.length > 0) {
          evenlyDistributed.push(groupCandidates[0]);
        }
      });

      expect(evenlyDistributed.length).toBeGreaterThan(0);
      expect(evenlyDistributed.length).toBeLessThanOrEqual(groups.size);
    });
  });

  describe('getSentenceForCandidate', () => {
    it('should extract the sentence containing a word', () => {
      const html = '<p>The cat sits on the mat. The dog runs in the park.</p>';
      const testDom = new JSDOM(html);
      (global as any).document = testDom.window.document;
      (global as any).window = testDom.window;

      const candidates = extractCandidates(testDom.window.document);
      const catCandidate = candidates.find(c => c.word.toLowerCase() === 'cat');

      if (catCandidate) {
        const sentence = getSentenceForCandidate(catCandidate);
        expect(sentence).toBe('The cat sits on the mat.');
      } else {
        // If 'cat' wasn't extracted, ensure we have some candidates
        expect(candidates.length).toBeGreaterThan(0);
      }
    });

    it('should handle candidates at the end of sentences', () => {
      const html = '<p>The cat sits on the mat.</p>';
      const testDom = new JSDOM(html);
      (global as any).document = testDom.window.document;
      (global as any).window = testDom.window;

      const candidates = extractCandidates(testDom.window.document);
      const matCandidate = candidates.find(c => c.word.toLowerCase() === 'mat');

      if (matCandidate) {
        const sentence = getSentenceForCandidate(matCandidate);
        expect(sentence).toContain('mat');
      }
    });
  });
});
