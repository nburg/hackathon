# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Contextual Vocabulary Weaver** - A browser extension for passive language learning that replaces words and sentences on web pages with Spanish translations, using spaced repetition and Bayesian Knowledge Tracing.

**Current Status**: P3 (DOM & NLP) module fully implemented and tested. ✅ All 47 tests passing.

## P3 Module: DOM & NLP

This module provides DOM traversal and NLP capabilities for extracting word candidates from web pages.

### Key Components

- **DOM Walker** (`src/dom/walker.ts`): Safely extracts text nodes, skips code/navigation
- **NLP Tagger** (`src/nlp/tagger.ts`): POS tagging with compromise.js
- **Extractor** (`src/extractor.ts`): Main API for word candidate extraction

### Core API

```typescript
import { extractCandidates, filterCandidates } from './src/index.js';

// Extract all word candidates
const candidates = extractCandidates(document);

// Each candidate has:
// - word: string
// - pos: PartOfSpeech (Noun, Verb, Adjective, Adverb)
// - node: Text (DOM node reference)
// - offset: number
// - length: number
// - isProperNoun: boolean
// - isMultiWord: boolean
```

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript + browser bundle
npm run build

# Build browser bundle only
npm run build:browser

# Run unit tests (47 tests, all passing)
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Run demo script
npm run demo
```

## Testing

### Unit Tests (Automated)
```bash
npm test
```
- 47/47 tests passing ✅
- Uses Vitest with JSDOM
- Fixtures in `tests/fixtures/`

### Browser Tests (Manual)

**Setup:**
```bash
npm run build
npx http-server . -p 8080 --cors
```

**Method 1: Interactive Test Page**
```
http://localhost:8080/browser-test-v2.html
```
- Click buttons to test extraction
- See visual results with stats

**Method 2: Bookmarklet (test on any site)**
```
http://localhost:8080/standalone-test-v2.html
```
- Drag button to bookmarks
- Click on any website to test

**Method 3: Browser Console**
```javascript
import('http://localhost:8080/dist/browser.js').then(P3 => {
  window.P3 = P3;
  const candidates = P3.extractCandidates(document);
  console.log(`Found ${candidates.length} candidates`);
  console.table(candidates.slice(0, 20));
});
```

**See BROWSER-TESTING.md for complete guide.**

## File Structure

```
src/
  index.ts              # Main exports
  types.ts              # TypeScript types
  extractor.ts          # Main extraction logic
  dom/
    walker.ts           # DOM traversal
  nlp/
    tagger.ts           # POS tagging

dist/
  index.js              # Node.js/module version
  browser.js            # Bundled browser version (includes compromise.js)

tests/
  dom-walker.test.ts    # DOM traversal tests
  nlp-tagger.test.ts    # NLP tagging tests
  extractor.test.ts     # Integration tests
  fixtures/
    sample.html         # Test HTML

browser-test-v2.html       # Interactive test page
standalone-test-v2.html    # Bookmarklet creation page
```

## Architecture

### DOM Traversal
- Uses TreeWalker API for performance
- Automatically skips: navigation, code blocks, scripts, styles, forms
- Respects ARIA roles (navigation, banner, contentinfo, etc.)
- Filters hidden elements

### NLP Processing
- compromise.js for POS tagging
- Identifies: Nouns, Verbs, Adjectives, Adverbs
- Detects proper nouns (names, places)
- Finds multi-word expressions and idioms
- Filters out function words (articles, prepositions < 3 chars)

### Candidate Extraction
- Returns `WordCandidate[]` with DOM references
- Each candidate includes: word, POS, node, offset, length, flags
- Provides filtering and grouping utilities
- Sentence extraction for Phase 2

## Integration with P4 (Translation Pipeline)

P4 will use this module to get words ready for translation:

```typescript
import { extractCandidates, filterCandidates } from '@p3/dom-nlp';

// 1. Extract candidates
const candidates = extractCandidates(document);

// 2. Apply filters (density setting from P2, priority from P5)
const selected = filterCandidates(candidates, c => {
  return !c.isProperNoun &&      // Don't translate names
         !c.isMultiWord &&        // Don't break phrases
         shouldTranslate(c.word); // P5's SRS priority
});

// 3. Translate and replace in DOM
selected.forEach(candidate => {
  const translated = await translate(candidate.word);
  replaceInDOM(candidate.node, candidate.offset, candidate.length, translated);
});
```

## Integration with P5 (SRS Engine)

P5 should track candidates and provide priority scores:

```typescript
// P5 provides
function getWordPriority(word: string): number {
  // Returns 0-1 score based on SRS algorithm
  // Higher = should be shown sooner
}

// P4 uses it
const selected = candidates.filter(c =>
  getWordPriority(c.word) > densityThreshold
);
```

## Key Features

### What Gets Extracted
- ✅ Paragraph text, headings, lists
- ✅ Article and main content
- ✅ Content words (nouns, verbs, adjectives, adverbs)
- ✅ Words 3+ characters

### What Gets Skipped
- ❌ Navigation links
- ❌ Code blocks (`<code>`, `<pre>`)
- ❌ Scripts and styles
- ❌ Form inputs
- ❌ Hidden elements
- ❌ Footer content
- ❌ Function words (the, a, in, etc.)

### Flags Provided
- `isProperNoun`: true for names, places (don't translate)
- `isMultiWord`: true if part of multi-word expression (keep together)
- `pos`: Part of speech for intelligent selection

## Performance

- **Fast**: Processes 500+ words in < 100ms
- **Efficient**: TreeWalker API for DOM traversal
- **Scalable**: Works on pages with 10,000+ words
- **Browser bundle**: 624KB (includes compromise.js)

## Known Issues & Limitations

1. **Multi-word detection**: compromise.js sometimes groups entire phrases
   - Workaround: Filter by `isMultiWord` flag
   - Impact: Low - mainly affects edge cases

2. **Proper noun detection**: Not 100% accurate
   - compromise.js sometimes misses proper nouns
   - Impact: Low - can be refined later

3. **Browser bundle size**: 624KB (compromise.js is large)
   - Could be optimized with smaller NLP library
   - Impact: Low - acceptable for MVP

## Development Guidelines

### Adding New Features
1. Write test first (TDD approach)
2. Implement feature
3. Run `npm test` to verify
4. Test in browser (use browser-test-v2.html)
5. Update documentation

### Fixing Bugs
1. Add failing test that reproduces bug
2. Fix bug in source
3. Verify test passes
4. Test in browser on affected sites
5. Document fix

### Performance Considerations
- DOM traversal is O(n) where n = text nodes
- POS tagging is O(m) where m = word count
- Keep both optimized for large pages
- Test on pages with 1000+ words

## Next Steps

### For P4 (Translation Pipeline)
- Import `extractCandidates()` and `filterCandidates()`
- Apply density settings from P2
- Apply priority scores from P5
- Use `candidate.node`, `candidate.offset`, `candidate.length` for replacement
- Preserve DOM structure and formatting

### For P5 (SRS Engine)
- Track words from `extractCandidates()`
- Store exposure counts, last seen dates
- Calculate BKT probabilities
- Provide `getWordPriority()` function for P4
- Signal Phase 2 transition when ready

### Future Enhancements
- Support for additional languages (currently Spanish only)
- Smaller NLP library (reduce bundle size)
- Better multi-word detection
- Sentence complexity analysis for Phase 2
- Custom POS tag filtering

## Troubleshooting

### Tests Failing?
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
npm test
```

### Browser Module Not Loading?
```bash
# Rebuild browser bundle
npm run build:browser

# Verify file exists
ls -lh dist/browser.js

# Check server is running with CORS
npx http-server . -p 8080 --cors
```

### No Candidates Extracted?
- Check page has actual content (not just navigation)
- Try on known-good site (bbc.com/news, Wikipedia)
- Check console for errors
- Verify DOM structure (use inspector)

## Resources

- **README.md**: API documentation and usage examples
- **TESTING.md**: Complete testing guide
- **BROWSER-TESTING.md**: Browser testing guide with examples
- **tests/**: Test files with examples
- **demo.ts**: Standalone demo script

## Team Notes

- **P1 (Infrastructure)**: WXT setup still needed for extension
- **P2 (Frontend/UI)**: Can integrate P3 once extension scaffold is ready
- **P4 (Translation)**: Ready to integrate - see API examples above
- **P5 (SRS)**: Ready to integrate - see priority function example above

This module is **production-ready** for integration! 🎉
