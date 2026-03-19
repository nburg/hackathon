# Testing Guide for P3 Module

Complete testing guide covering automated unit tests and manual browser testing.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests (unit tests)
npm test

# Build for browser testing
npm run build

# Start server for browser testing
npx http-server . -p 8080 --cors
```

---

## Unit Tests (Automated)

### Running Tests

```bash
# Run all tests once
npm test

# Run in watch mode (re-runs when files change)
npm test -- --watch

# Run with UI (interactive browser interface)
npm test:ui

# Run with coverage report
npm test:coverage

# Run specific test file
npm test tests/dom-walker.test.ts
```

### Test Results

**Status:** ✅ **47/47 tests passing** (100%)

```
Test Files: 3 passed (3)
  ✓ tests/dom-walker.test.ts (18 tests)
  ✓ tests/nlp-tagger.test.ts (15 tests)
  ✓ tests/extractor.test.ts (14 tests)

Tests: 47 passed (47)
Duration: ~3.6s
```

### Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| DOM Walker | 18 | DOM traversal, element skipping, text extraction |
| NLP Tagger | 15 | POS tagging, proper nouns, multi-word detection |
| Extractor | 14 | Integration, filtering, grouping |

### Test Environment

- **Framework:** Vitest
- **DOM Environment:** JSDOM
- **Fixtures:** `tests/fixtures/sample.html`

---

## Browser Tests (Manual)

**See [BROWSER-TESTING.md](./BROWSER-TESTING.md) for complete guide.**

### Quick Browser Test

1. **Build and start server:**
   ```bash
   npm run build
   npx http-server . -p 8080 --cors
   ```

2. **Open test page:**
   ```
   http://localhost:8080/browser-test-v2.html
   ```

3. **Click buttons to test:**
   - 🚀 Extract Word Candidates
   - 📘 Extract Nouns Only
   - 🚫 No Proper Nouns
   - 📏 Long Words

### Bookmarklet Test (Any Website)

1. **Open:** http://localhost:8080/standalone-test-v2.html
2. **Drag** the blue button to bookmarks bar
3. **Visit** any website (news, Wikipedia, etc.)
4. **Click** the bookmarklet!

### Console Test

On any website, open console (F12) and paste:

```javascript
import('http://localhost:8080/dist/browser.js').then(P3 => {
  window.P3 = P3;
  const candidates = P3.extractCandidates(document);
  console.log(`Found ${candidates.length} candidates`);
  console.table(candidates.slice(0, 20));
});
```

---

## What Gets Tested

### ✅ Unit Tests Verify:

**DOM Walker (tests/dom-walker.test.ts):**
- ✓ Skips script, style, code, pre elements
- ✓ Skips navigation (nav, role="navigation")
- ✓ Skips footer (role="contentinfo")
- ✓ Extracts text from p, article, h1-h6, li
- ✓ Respects ARIA roles
- ✓ Filters hidden elements
- ✓ Returns proper Text nodes

**NLP Tagger (tests/nlp-tagger.test.ts):**
- ✓ Identifies nouns, verbs, adjectives, adverbs
- ✓ Detects proper nouns (names, places)
- ✓ Skips proper nouns when configured
- ✓ Filters by POS type when configured
- ✓ Detects multi-word expressions
- ✓ Identifies idioms and phrases
- ✓ Filters content words (excludes function words)
- ✓ Filters short words (< 3 characters)

**Extractor (tests/extractor.test.ts):**
- ✓ Extracts word candidates from document
- ✓ Extracts content words only
- ✓ Excludes navigation and code
- ✓ Marks proper nouns correctly
- ✓ Includes DOM node references
- ✓ Provides offset and length information
- ✓ Filters candidates by custom criteria
- ✓ Groups candidates by parent element
- ✓ Allows even distribution across elements
- ✓ Extracts sentences for candidates

### ✅ Browser Tests Verify:

**Functional Tests:**
- Works on real websites (news, Wikipedia, blogs)
- Correctly skips navigation, code, scripts
- Extracts readable content accurately
- Identifies parts of speech correctly
- Flags proper nouns appropriately
- Provides DOM references for replacement

**Integration Tests:**
- Module loads without CORS errors
- compromise.js bundled correctly
- Works with different page structures
- Handles dynamic content
- Performs well on large pages

**Performance Tests:**
- Extraction speed on various page sizes
- Memory usage
- Browser compatibility

---

## Test Fixtures

### Unit Test Fixture (tests/fixtures/sample.html)

Contains:
- Navigation (should be skipped)
- Main article content (should be extracted)
- Code blocks (should be skipped)
- Lists (should be extracted)
- Footer (should be skipped)

### Browser Test Content (browser-test-v2.html)

Contains:
- Sample article with real content
- Navigation bar
- Code blocks
- List items
- Proper nouns (Maria, Barcelona, Paris)
- Various POS types for testing

---

## Manual Test Cases

### Test Case 1: Basic Extraction

**Input:**
```html
<p>The cat sits on the mat.</p>
```

**Expected Output:**
```javascript
[
  { word: "cat", pos: "Noun", isProperNoun: false },
  { word: "sits", pos: "Verb", isProperNoun: false },
  { word: "mat", pos: "Noun", isProperNoun: false }
]
```

**Test:**
```bash
npm test tests/nlp-tagger.test.ts -t "should identify nouns"
```

---

### Test Case 2: Navigation Skipping

**Input:**
```html
<nav><a href="#">Home</a></nav>
<p>Content here.</p>
```

**Expected:**
- "Home" should NOT be extracted
- "Content" SHOULD be extracted

**Test:**
```bash
npm test tests/dom-walker.test.ts -t "should not extract text from navigation"
```

---

### Test Case 3: Code Block Skipping

**Input:**
```html
<code>function test() {}</code>
<p>Some text.</p>
```

**Expected:**
- "function", "test" should NOT be extracted
- "text" SHOULD be extracted

**Test:**
```bash
npm test tests/dom-walker.test.ts -t "should not extract text from code blocks"
```

---

### Test Case 4: Proper Noun Detection

**Input:**
```html
<p>John visited Paris.</p>
```

**Expected:**
```javascript
[
  { word: "John", pos: "Noun", isProperNoun: true },
  { word: "visited", pos: "Verb", isProperNoun: false },
  { word: "Paris", pos: "Noun", isProperNoun: true }
]
```

**Test:**
```bash
npm test tests/nlp-tagger.test.ts -t "should detect proper nouns"
```

---

## Testing Workflow

### For New Features:

1. **Write unit test first** (TDD approach)
   ```bash
   # Create test file
   touch tests/new-feature.test.ts

   # Write test
   # Run test (should fail)
   npm test tests/new-feature.test.ts
   ```

2. **Implement feature**
   ```bash
   # Write code in src/
   # Run test again (should pass)
   npm test tests/new-feature.test.ts
   ```

3. **Test in browser**
   ```bash
   npm run build
   # Test in browser-test-v2.html
   ```

4. **Test on real websites**
   ```bash
   # Use bookmarklet on various sites
   # Verify behavior
   ```

### For Bug Fixes:

1. **Create failing test** that reproduces bug
2. **Fix the bug** in source code
3. **Verify test passes**
4. **Test in browser** to confirm fix
5. **Test on affected websites**

---

## Debugging Tests

### Unit Test Debugging

```bash
# Run single test with output
npm test tests/dom-walker.test.ts -t "specific test name"

# Run with verbose output
npm test -- --reporter=verbose

# Run with UI for interactive debugging
npm test:ui
```

### Browser Test Debugging

```javascript
// In browser console
import('http://localhost:8080/dist/browser.js').then(P3 => {
  window.P3 = P3;

  // Debug specific function
  const candidates = P3.extractCandidates(document);
  console.log('Candidates:', candidates);

  // Check what's being skipped
  const allText = Array.from(document.querySelectorAll('*'))
    .map(el => el.textContent?.trim())
    .filter(Boolean);
  console.log('All text:', allText);

  // Check extracted words
  const extracted = candidates.map(c => c.word);
  console.log('Extracted:', extracted);
});
```

---

## Performance Testing

### Unit Test Performance

```bash
# Run tests and check duration
npm test

# Should complete in ~3-4 seconds
```

### Browser Performance

```javascript
// In browser console
console.time('P3 Extraction');
const candidates = P3.extractCandidates(document);
console.timeEnd('P3 Extraction');
console.log(`Extracted ${candidates.length} candidates`);

// Expected: < 100ms for most pages
```

### Performance Benchmarks

| Page Size | Expected Time |
|-----------|---------------|
| Small (< 100 words) | < 20ms |
| Medium (100-500 words) | 20-50ms |
| Large (500-1000 words) | 50-100ms |
| Very Large (1000+ words) | 100-200ms |

---

## Continuous Integration

### GitHub Actions (if set up)

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
```

---

## Test Maintenance

### When to Update Tests:

1. **API changes** - Update tests to match new interface
2. **Bug fixes** - Add test that would have caught the bug
3. **New features** - Add comprehensive test coverage
4. **Breaking changes** - Update all affected tests

### Test Quality Checklist:

- [ ] Tests are independent (can run in any order)
- [ ] Tests have clear, descriptive names
- [ ] Tests cover both success and error cases
- [ ] Tests use realistic data (see fixtures/)
- [ ] Tests are fast (< 1s per test)
- [ ] Tests are deterministic (no randomness)

---

## For P4 Integration Testing

When P4 is ready to integrate:

```javascript
// Integration test example
import { extractCandidates, filterCandidates } from './src/index.js';

// Mock P5's priority function
function getWordPriority(word) {
  // Simulate P5's logic
  return Math.random();
}

// Mock P4's translation function
async function translate(word) {
  return `[Spanish: ${word}]`;
}

// Test full pipeline
async function testPipeline() {
  // 1. P3: Extract candidates
  const candidates = extractCandidates(document);

  // 2. P5: Apply priority filter
  const selected = filterCandidates(candidates, c => {
    return !c.isProperNoun &&
           getWordPriority(c.word) > 0.5;
  });

  // 3. P4: Translate and replace
  for (const candidate of selected.slice(0, 10)) {
    const translation = await translate(candidate.word);
    console.log(`Replace "${candidate.word}" with "${translation}"`);
    // P4 would replace in DOM here
  }
}

testPipeline();
```

---

## Resources

- **Unit Tests:** `tests/` directory
- **Browser Tests:** `BROWSER-TESTING.md`
- **API Docs:** `README.md`
- **Type Definitions:** `src/types.ts`
- **Test Fixtures:** `tests/fixtures/`
- **Example Usage:** `demo.ts`

---

## Getting Help

1. **Check test output** for error messages
2. **Review test fixtures** in `tests/fixtures/`
3. **Read source code** tests are well-commented
4. **Use Vitest UI** (`npm test:ui`) for visual debugging
5. **Test in browser** to see real-world behavior
6. **Check BROWSER-TESTING.md** for browser-specific issues
