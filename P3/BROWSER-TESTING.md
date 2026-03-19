# Browser Testing Guide

Complete guide to testing the P3 DOM & NLP module in a web browser.

## Prerequisites

1. **Build the project:**
   ```bash
   npm run build
   ```
   This creates both `dist/index.js` (Node) and `dist/browser.js` (bundled for browser).

2. **Start local server with CORS enabled:**
   ```bash
   npx http-server . -p 8080 --cors
   ```
   Keep this running while testing.

---

## Method 1: Interactive Test Page (Recommended)

**Best for:** Quick visual testing with sample content

### Steps:

1. **Open in browser:**
   ```
   http://localhost:8080/browser-test-v2.html
   ```

2. **Click the test buttons:**
   - 🚀 **Extract Word Candidates** - See all extracted words
   - 📘 **Extract Nouns Only** - Filter by part of speech
   - 🚫 **No Proper Nouns** - Exclude names/places
   - 📏 **Long Words (7+ chars)** - Filter by length
   - 🗑️ **Clear Results** - Reset

3. **What to check:**
   - ✅ Stats show: Total words, Nouns, Verbs, Adjectives, Adverbs, Proper Nouns
   - ✅ Sample article text IS extracted
   - ✅ Navigation links are NOT extracted
   - ✅ Code blocks are NOT extracted
   - ✅ Each word shows: text, POS tag, flags (proper noun, multi-word)
   - ✅ Console shows detailed candidate objects

### Sample Output:

```
Stats:
- Total Words: 45
- Nouns: 18
- Verbs: 12
- Adjectives: 9
- Adverbs: 6

Sample Candidates:
"language" - Noun
"learning" - Noun
"improves" - Verb
"cognitive" - Adjective
```

---

## Method 2: Bookmarklet (Test on ANY Website)

**Best for:** Testing on real websites (news, Wikipedia, blogs)

### Setup:

1. **Open bookmarklet page:**
   ```
   http://localhost:8080/standalone-test-v2.html
   ```

2. **Drag the blue "🔬 Test P3 Module" button** to your bookmarks bar

### Usage:

1. Visit any website:
   - atomicacademia.com
   - https://www.bbc.com/news
   - https://en.wikipedia.org/wiki/Language_learning
   - https://developer.mozilla.org/en-US/

2. Click the bookmarklet in your bookmarks bar

3. See results:
   - Alert shows summary (total words, counts by POS)
   - Console shows detailed table with first 20 candidates
   - `window.P3` is available for further testing

### Expected Results by Site Type:

| Site Type | Expected Candidates | Notes |
|-----------|-------------------|-------|
| News Articles | 100-300 words | Mostly nouns and verbs |
| Wikipedia | 200-500 words | Many proper nouns (names, places) |
| Blog Posts | 100-200 words | Conversational language |
| Documentation | 100-300 words | Code blocks should be SKIPPED |
| Landing Pages | 50-150 words | Lots of adjectives |

---

## Method 3: Browser Console

**Best for:** Advanced testing and debugging

### Steps:

1. **Visit any website**

2. **Open DevTools** (F12 or Ctrl+Shift+I)

3. **Switch to Console tab**

4. **Paste this code:**
   ```javascript
   import('http://localhost:8080/dist/browser.js').then(P3 => {
     window.P3 = P3;
     const candidates = P3.extractCandidates(document);
     console.log(`✅ Found ${candidates.length} word candidates`);
     console.table(candidates.slice(0, 20));
   });
   ```

5. **Press Enter**

### Advanced Commands:

Once loaded, try these:

```javascript
// Get all candidates
const all = P3.extractCandidates(document);

// Filter by POS
const nouns = P3.filterCandidates(all, c => c.pos === 'Noun');
const verbs = P3.filterCandidates(all, c => c.pos === 'Verb');
const adjectives = P3.filterCandidates(all, c => c.pos === 'Adjective');

console.log('Nouns:', nouns.map(n => n.word).join(', '));
console.log('Verbs:', verbs.map(v => v.word).join(', '));

// Exclude proper nouns (names/places)
const common = P3.filterCandidates(all, c => !c.isProperNoun);
console.log('Common words:', common.length);

// Get proper nouns only
const proper = P3.filterCandidates(all, c => c.isProperNoun);
console.log('Proper nouns:', proper.map(p => p.word));

// Filter by word length
const longWords = P3.filterCandidates(all, c => c.word.length >= 7);
console.log('Long words (7+ chars):', longWords.map(w => w.word));

// Group by parent element
const groups = P3.groupCandidatesByElement(all);
console.log(`Words distributed across ${groups.size} elements`);

// See POS distribution
const posCounts = all.reduce((acc, c) => {
  acc[c.pos] = (acc[c.pos] || 0) + 1;
  return acc;
}, {});
console.log('POS distribution:', posCounts);

// Check which elements have most words
groups.forEach((candidates, element) => {
  console.log(`<${element.tagName.toLowerCase()}>: ${candidates.length} words`);
});

// Verify navigation was skipped
const navText = Array.from(document.querySelectorAll('nav'))
  .map(n => n.textContent).join(' ');
const extracted = all.map(c => c.word).join(' ');
console.log('Nav skipped?', !extracted.includes(navText) ? '✅ YES' : '❌ NO');

// Performance test
console.time('extraction');
const perf = P3.extractCandidates(document);
console.timeEnd('extraction');
console.log(`Extracted ${perf.length} candidates`);
```

---

## What Should Be Extracted

### ✅ Content That SHOULD Be Extracted:

- Paragraph text (`<p>`)
- Headings (`<h1>` through `<h6>`)
- List items (`<li>`)
- Article content (`<article>`)
- Main content area (`<main>`)
- Blockquotes (`<blockquote>`)
- Table cells with readable text

### ❌ Content That SHOULD BE SKIPPED:

- Navigation links (`<nav>`, `<a>` in nav)
- Code blocks (`<code>`, `<pre>`)
- Scripts (`<script>`)
- Styles (`<style>`)
- Form inputs (`<input>`, `<textarea>`, `<button>`)
- Footer content (`<footer>`, `[role="contentinfo"]`)
- Hidden elements (`display: none`, `visibility: hidden`)
- Elements with `aria-hidden="true"`
- Menu items (`[role="menu"]`, `[role="menuitem"]`)

---

## Test Cases

### Test Case 1: Basic Extraction

**HTML:**
```html
<p>The cat sits on the mat.</p>
```

**Expected:**
```javascript
[
  { word: "cat", pos: "Noun", isProperNoun: false },
  { word: "sits", pos: "Verb", isProperNoun: false },
  { word: "mat", pos: "Noun", isProperNoun: false }
]
```

**Note:** "The", "on", "the" are filtered (function words < 3 chars)

---

### Test Case 2: Navigation Skipping

**HTML:**
```html
<nav>
  <a href="#home">Home</a>
  <a href="#about">About</a>
</nav>
<p>This is content.</p>
```

**Expected:**
- "Home" and "About" should NOT appear
- "content" SHOULD appear

**Verify:**
```javascript
const words = P3.extractCandidates(document).map(c => c.word);
console.log(words.includes('Home')); // Should be false
console.log(words.includes('content')); // Should be true
```

---

### Test Case 3: Code Block Skipping

**HTML:**
```html
<p>Here is some code:</p>
<code>function hello() { return "world"; }</code>
<p>That was the code.</p>
```

**Expected:**
- "code" (from paragraphs) SHOULD appear
- "function", "hello", "world" should NOT appear

**Verify:**
```javascript
const words = P3.extractCandidates(document).map(c => c.word);
console.log(words.includes('code')); // true
console.log(words.includes('function')); // false
console.log(words.includes('hello')); // false
```

---

### Test Case 4: Proper Noun Detection

**HTML:**
```html
<p>John visited Paris last summer.</p>
```

**Expected:**
```javascript
[
  { word: "John", pos: "Noun", isProperNoun: true },
  { word: "visited", pos: "Verb", isProperNoun: false },
  { word: "Paris", pos: "Noun", isProperNoun: true },
  { word: "summer", pos: "Noun", isProperNoun: false }
]
```

**Verify:**
```javascript
const candidates = P3.extractCandidates(document);
const john = candidates.find(c => c.word === 'John');
console.log(john?.isProperNoun); // true

const paris = candidates.find(c => c.word === 'Paris');
console.log(paris?.isProperNoun); // true
```

---

### Test Case 5: Multi-word Expressions

**HTML:**
```html
<p>I love ice cream a lot.</p>
```

**Expected:**
- "ice cream" and "a lot of" detected as multi-word
- Words within these phrases marked with `isMultiWord: true`

**Verify:**
```javascript
const candidates = P3.extractCandidates(document);
const ice = candidates.find(c => c.word === 'ice');
console.log(ice?.isMultiWord); // May be true (if within phrase)
```

---

## Performance Benchmarks

Test on pages with different sizes:

```javascript
// Performance test
console.time('P3 Extraction');
const candidates = P3.extractCandidates(document);
console.timeEnd('P3 Extraction');
console.log(`Extracted ${candidates.length} candidates`);
```

**Expected Performance:**

| Page Size | Word Count | Time | Notes |
|-----------|-----------|------|-------|
| Small | 50-100 words | < 20ms | Simple page |
| Medium | 200-500 words | 20-50ms | News article |
| Large | 500-1000 words | 50-100ms | Long article |
| Very Large | 1000+ words | 100-200ms | Documentation |

---

## Debugging Tips

### Not Extracting Anything?

1. **Check if page has content:**
   ```javascript
   console.log(document.querySelectorAll('p, article, main').length);
   ```

2. **Check for errors:**
   ```javascript
   import('http://localhost:8080/dist/browser.js').then(P3 => {
     console.log('Module loaded');
     try {
       const candidates = P3.extractCandidates(document);
       console.log('Success:', candidates.length);
     } catch (e) {
       console.error('Error:', e);
     }
   });
   ```

3. **Try on a known-good page:**
   Visit https://www.bbc.com/news and test there.

### Getting Navigation/Code in Results?

```javascript
// Check what's being extracted
const candidates = P3.extractCandidates(document);

// See parent elements
const elements = [...new Set(
  candidates.map(c => c.node.parentElement?.tagName)
)];
console.log('Parent elements:', elements);

// Should NOT include: NAV, CODE, PRE, SCRIPT, STYLE
```

### CORS Errors?

1. Make sure server is running: `npx http-server . -p 8080 --cors`
2. Check server output shows: `CORS: true`
3. Use `dist/browser.js` (bundled) not `dist/index.js`

### Module Not Found?

1. Build the project: `npm run build`
2. Check file exists: `ls -lh dist/browser.js`
3. Verify URL: `curl http://localhost:8080/dist/browser.js | head`

---

## Integration Testing

For P4 integration, test the full workflow:

```javascript
// 1. Extract candidates
const candidates = P3.extractCandidates(document);

// 2. Apply P5's priority filter (simulated)
const selected = P3.filterCandidates(candidates, c => {
  // Don't translate proper nouns
  if (c.isProperNoun) return false;

  // Don't break multi-word expressions
  if (c.isMultiWord) return false;

  // Only nouns and verbs for now
  if (!['Noun', 'Verb'].includes(c.pos)) return false;

  return true;
});

console.log(`Selected ${selected.length} words for translation`);

// 3. Simulate replacement (P4's job)
selected.slice(0, 5).forEach(candidate => {
  console.log(`Would replace: "${candidate.word}" in`, candidate.node.parentElement?.tagName);
  console.log(`  at offset: ${candidate.offset}, length: ${candidate.length}`);
});
```

---

## Next Steps After Testing

1. **Verify on diverse sites:**
   - News: BBC, CNN, Guardian
   - Reference: Wikipedia, MDN
   - Blogs: Medium, Dev.to
   - Academic: atomicacademia.com

2. **Profile performance:**
   - Test on large pages (1000+ words)
   - Measure extraction time
   - Check memory usage

3. **Edge cases:**
   - Dynamic content (React/Vue apps)
   - Single-page applications
   - Pages with lots of code
   - Non-English content

4. **Integration with P4:**
   - Pass candidates to translation API
   - Replace text in DOM using node/offset/length
   - Preserve formatting and structure

---

## Troubleshooting Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Bare specifier" | Using unbundled version | Use `dist/browser.js` not `dist/index.js` |
| CORS blocked | Server not configured | Add `--cors` flag to http-server |
| Module not found | Build not run | Run `npm run build` |
| No candidates | Page has no content | Try on news/Wikipedia |
| Wrong words extracted | Bug in DOM walker | Report with URL |
| Slow performance | Very large page | Normal for 1000+ words |

---

## Support

- Check `TESTING.md` for unit test documentation
- See `README.md` for API reference
- Review `tests/` folder for example usage
- File issues for bugs or questions
