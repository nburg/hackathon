import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractTextNodes, shouldSkipElement, extractContentText } from '../src/dom/walker.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('DOM Walker', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    const html = readFileSync(join(__dirname, 'fixtures', 'sample.html'), 'utf-8');
    dom = new JSDOM(html);
    document = dom.window.document;
    (global as any).document = document;
    (global as any).window = dom.window;
  });

  describe('shouldSkipElement', () => {
    it('should skip script elements', () => {
      const script = document.querySelector('script')!;
      expect(shouldSkipElement(script)).toBe(true);
    });

    it('should skip style elements', () => {
      const style = document.querySelector('style')!;
      expect(shouldSkipElement(style)).toBe(true);
    });

    it('should skip code elements', () => {
      const code = document.querySelector('code')!;
      expect(shouldSkipElement(code)).toBe(true);
    });

    it('should skip pre elements', () => {
      const pre = document.querySelector('pre')!;
      expect(shouldSkipElement(pre)).toBe(true);
    });

    it('should skip navigation role elements', () => {
      const nav = document.querySelector('[role="navigation"]')!;
      expect(shouldSkipElement(nav)).toBe(true);
    });

    it('should skip contentinfo role elements', () => {
      const footer = document.querySelector('[role="contentinfo"]')!;
      expect(shouldSkipElement(footer)).toBe(true);
    });

    it('should not skip article elements', () => {
      const article = document.querySelector('article')!;
      expect(shouldSkipElement(article)).toBe(false);
    });

    it('should not skip paragraph elements', () => {
      const p = document.querySelector('p')!;
      expect(shouldSkipElement(p)).toBe(false);
    });
  });

  describe('extractTextNodes', () => {
    it('should extract text from paragraphs', () => {
      const textNodes = extractTextNodes(document);
      const texts = textNodes.map(node => node.textContent?.trim()).filter(Boolean);

      expect(texts).toContain('Learning a new language opens doors to understanding different cultures. It can improve your cognitive abilities and enhance your career prospects.');
    });

    it('should not extract text from script tags', () => {
      const textNodes = extractTextNodes(document);
      const texts = textNodes.map(node => node.textContent).join('');

      expect(texts).not.toContain('Not extracted');
      expect(texts).not.toContain('console.log');
    });

    it('should not extract text from style tags', () => {
      const textNodes = extractTextNodes(document);
      const texts = textNodes.map(node => node.textContent).join('');

      expect(texts).not.toContain('body { margin: 0; }');
    });

    it('should not extract text from code blocks', () => {
      const textNodes = extractTextNodes(document);
      const texts = textNodes.map(node => node.textContent).join('');

      expect(texts).not.toContain('function hello()');
    });

    it('should not extract text from navigation', () => {
      const textNodes = extractTextNodes(document);
      const texts = textNodes.map(node => node.textContent).join('');

      expect(texts).not.toContain('Home');
      expect(texts).not.toContain('About');
    });

    it('should extract text from list items in main content', () => {
      const textNodes = extractTextNodes(document);
      const texts = textNodes.map(node => node.textContent?.trim()).filter(Boolean);

      expect(texts.some(t => t.includes('Practice daily'))).toBe(true);
    });

    it('should return an array of Text nodes', () => {
      const textNodes = extractTextNodes(document);

      expect(textNodes.length).toBeGreaterThan(0);
      textNodes.forEach(node => {
        expect(node.nodeType).toBe(3); // Node.TEXT_NODE
      });
    });
  });

  describe('extractContentText', () => {
    it('should extract text from main content areas', () => {
      const content = extractContentText(document);

      expect(content).toContain('Learning a new language');
      expect(content).toContain('cognitive abilities');
    });

    it('should extract text from headings', () => {
      const content = extractContentText(document);

      expect(content).toContain('The Benefits of Learning Languages');
      expect(content).toContain('Tips for Success');
    });

    it('should not include navigation text', () => {
      const content = extractContentText(document);

      expect(content).not.toContain('Home');
      expect(content).not.toContain('About');
    });
  });
});
