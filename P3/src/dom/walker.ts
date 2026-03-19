import { DOMWalkerConfig } from '../types.js';

/**
 * Default elements to skip during DOM traversal
 */
const DEFAULT_SKIP_ELEMENTS = [
  'script',
  'style',
  'code',
  'pre',
  'noscript',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'input',
  'textarea',
  'button',
  'select',
  'option',
  'nav', // Add nav element to skip list
  'a',   // Skip links
];

/**
 * Default ARIA roles to skip (navigation, UI components)
 */
const DEFAULT_SKIP_ARIA_ROLES = [
  'navigation',
  'banner',
  'complementary',
  'contentinfo',
  'form',
  'search',
  'toolbar',
  'menu',
  'menubar',
  'menuitem',
  'tab',
  'tablist',
  'tabpanel',
  'button',
];

/**
 * Checks if an element should be skipped during traversal
 */
export function shouldSkipElement(
  element: Element,
  config: DOMWalkerConfig = {}
): boolean {
  const skipElements = config.skipElements || DEFAULT_SKIP_ELEMENTS;
  const skipAriaRoles = config.skipAriaRoles || DEFAULT_SKIP_ARIA_ROLES;

  // Check tag name
  const tagName = element.tagName.toLowerCase();
  if (skipElements.includes(tagName)) {
    return true;
  }

  // Check ARIA role
  const role = element.getAttribute('role');
  if (role && skipAriaRoles.includes(role)) {
    return true;
  }

  // Check if element is hidden (only if getComputedStyle is available)
  if (element instanceof HTMLElement && typeof window !== 'undefined' && window.getComputedStyle) {
    try {
      const style = window.getComputedStyle(element);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        return true;
      }
    } catch {
      // getComputedStyle might fail in test environments, ignore
    }
  }

  // Check aria-hidden
  if (element.getAttribute('aria-hidden') === 'true') {
    return true;
  }

  return false;
}

/**
 * Checks if a node or any of its ancestors should be skipped
 */
function shouldSkipNodeOrAncestor(node: Node, config: DOMWalkerConfig): boolean {
  let current: Node | null = node;

  while (current) {
    if (current.nodeType === 1) { // Element node
      if (shouldSkipElement(current as Element, config)) {
        return true;
      }
    }
    current = current.parentNode;
  }

  return false;
}

/**
 * Extracts all text nodes from the document that should be processed
 * Uses TreeWalker API for efficient traversal
 */
export function extractTextNodes(
  root: Document | Element = document,
  config: DOMWalkerConfig = {}
): Text[] {
  const textNodes: Text[] = [];

  // Create a TreeWalker to efficiently traverse text nodes
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Node): number {
        // Check if this node or any ancestor should be skipped
        if (shouldSkipNodeOrAncestor(node, config)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip empty or whitespace-only nodes
        const text = node.textContent || '';
        if (text.trim().length === 0) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  // Start from the first text node, not the root
  let currentNode: Node | null = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  return textNodes;
}

/**
 * Extracts text content from specific content-rich elements
 * Good for initial extraction from articles, blog posts, etc.
 */
export function extractContentText(
  root: Document | Element = document,
  config: DOMWalkerConfig = {}
): string {
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post',
    '.entry-content',
    'p',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
  ];

  const elements = root.querySelectorAll(contentSelectors.join(', '));
  const texts: string[] = [];

  elements.forEach((element) => {
    // Check if element or any ancestor should be skipped
    if (!shouldSkipNodeOrAncestor(element, config)) {
      const text = element.textContent?.trim();
      if (text) {
        texts.push(text);
      }
    }
  });

  return texts.join(' ');
}
