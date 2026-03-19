# Quick Start Guide

Get up and running with P3 DOM & NLP module in 5 minutes.

## 1. Install & Build (30 seconds)

```bash
# Install dependencies
npm install

# Build everything (TypeScript + browser bundle)
npm run build
```

## 2. Run Tests (30 seconds)

```bash
# Run all 47 unit tests
npm test
```

Expected output:
```
✓ tests/dom-walker.test.ts (18 tests)
✓ tests/nlp-tagger.test.ts (15 tests)
✓ tests/extractor.test.ts (14 tests)

Tests: 47 passed (47)
```

## 3. Test in Browser (1 minute)

### Start Server:
```bash
npx http-server . -p 8080 --cors
```

### Choose Your Testing Method:

**A) Interactive Test Page (Easiest)**
```
Open: http://localhost:8080/browser-test-v2.html
Click: "Extract Word Candidates"
```

**B) Bookmarklet (Test on Real Sites)**
```
Open: http://localhost:8080/standalone-test-v2.html
Drag: Blue button to bookmarks
Visit: Any website
Click: The bookmarklet
```

**C) Browser Console**
```
Visit: Any website
Open: DevTools console (F12)
Paste:
  import('http://localhost:8080/dist/browser.js').then(P3 => {
    window.P3 = P3;
    const c = P3.extractCandidates(document);
    console.log(\`Found \${c.length} candidates\`);
  });
```

## 4. Use the Module (Code Example)

```javascript
import { extractCandidates, filterCandidates } from './src/index.js';

// Extract all word candidates from a page
const candidates = extractCandidates(document);

// Filter to get only nouns
const nouns = filterCandidates(candidates, c => c.pos === 'Noun');

// Exclude proper nouns (names, places)
const common = filterCandidates(candidates, c => !c.isProperNoun);

// Each candidate has:
console.log(candidates[0]);
// {
//   word: "language",
//   pos: "Noun",
//   node: Text,           // DOM text node
//   offset: 0,            // Position in node
//   length: 8,            // Word length
//   isProperNoun: false,
//   isMultiWord: false
// }
```

## 5. Documentation

- **README.md** - API reference and examples
- **TESTING.md** - Complete testing guide (unit + browser)
- **BROWSER-TESTING.md** - Detailed browser testing with examples
- **CLAUDE.md** - Project overview and architecture

## What's Working

✅ **DOM Traversal**
- Extracts text from paragraphs, headings, lists
- Skips navigation, code blocks, scripts
- Respects ARIA roles

✅ **NLP Processing**
- Identifies Nouns, Verbs, Adjectives, Adverbs
- Detects proper nouns (names, places)
- Finds multi-word expressions

✅ **API**
- Clean extraction API
- Filtering utilities
- Grouping functions
- DOM node references for replacement

✅ **Testing**
- 47/47 unit tests passing
- Browser tests on real websites
- Interactive test UI

## Common Commands

```bash
# Development
npm install          # Install dependencies
npm run build        # Build TypeScript + browser bundle
npm test            # Run unit tests
npm test:ui         # Interactive test UI

# Browser Testing
npm run build:browser                    # Build browser bundle only
npx http-server . -p 8080 --cors        # Start server with CORS

# Demo
npm run demo        # Run Node.js demo script
```

## Quick Test on Real Websites

1. **Start server:** `npx http-server . -p 8080 --cors`
2. **Visit any site:** atomicacademia.com, bbc.com/news, wikipedia.org
3. **Open console** (F12)
4. **Paste and run:**
   ```javascript
   import('http://localhost:8080/dist/browser.js').then(P3 => {
     window.P3 = P3;
     const candidates = P3.extractCandidates(document);
     const stats = candidates.reduce((acc, c) => {
       acc[c.pos] = (acc[c.pos] || 0) + 1;
       return acc;
     }, {});
     console.log('Found:', candidates.length, 'words');
     console.log('Stats:', stats);
     console.table(candidates.slice(0, 20));
   });
   ```

## Expected Results

### On News Article (BBC, CNN)
```
Found: 150-300 words
Stats: { Noun: 80, Verb: 50, Adjective: 30, Adverb: 20 }
```

### On Wikipedia
```
Found: 200-500 words
Stats: { Noun: 120, Verb: 80, Adjective: 50, Adverb: 30 }
Many proper nouns (people, places)
```

### On Documentation (MDN)
```
Found: 100-200 words
Code blocks successfully skipped ✓
```

## Troubleshooting

**Tests failing?**
```bash
rm -rf node_modules/ dist/
npm install
npm run build
npm test
```

**Module not loading in browser?**
- Check server is running: `npx http-server . -p 8080 --cors`
- Verify CORS is enabled (output shows `CORS: true`)
- Use `dist/browser.js` not `dist/index.js`

**No candidates extracted?**
- Verify page has content (not just navigation)
- Try on known-good site: bbc.com/news
- Check console for errors

## Next Steps

1. **For P4 (Translation Pipeline):**
   - Import `extractCandidates()` and `filterCandidates()`
   - Use `candidate.node`, `offset`, `length` for DOM replacement
   - See integration examples in CLAUDE.md

2. **For P5 (SRS Engine):**
   - Track words from `extractCandidates()`
   - Provide `getWordPriority()` function
   - See integration examples in CLAUDE.md

3. **For Testing on Production Sites:**
   - Use bookmarklet for quick testing
   - Check that navigation/code is skipped
   - Verify proper nouns are flagged
   - Test performance on large pages

## Get Help

- Read **README.md** for detailed API docs
- Check **TESTING.md** for testing guide
- See **BROWSER-TESTING.md** for browser examples
- Look at **tests/** for code examples
- Review **demo.ts** for standalone usage

🎉 **You're ready to go!** The module is production-ready and fully tested.
