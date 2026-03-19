import { DOMWalkerConfig } from '../types.js';
/**
 * Checks if an element should be skipped during traversal
 */
export declare function shouldSkipElement(element: Element, config?: DOMWalkerConfig): boolean;
/**
 * Extracts all text nodes from the document that should be processed
 * Uses TreeWalker API for efficient traversal
 */
export declare function extractTextNodes(root?: Document | Element, config?: DOMWalkerConfig): Text[];
/**
 * Extracts text content from specific content-rich elements
 * Good for initial extraction from articles, blog posts, etc.
 */
export declare function extractContentText(root?: Document | Element, config?: DOMWalkerConfig): string;
//# sourceMappingURL=walker.d.ts.map