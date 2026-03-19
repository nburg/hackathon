/**
 * Simple demo script to test P3 module functionality
 * Run with: npm run demo
 */

import { JSDOM } from 'jsdom';
import { extractCandidates, filterCandidates, groupCandidatesByElement } from './src/index.js';

// Sample HTML content
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Demo</title>
</head>
<body>
  <nav role="navigation">
    <a href="#home">Home</a>
    <a href="#about">About</a>
  </nav>

  <main>
    <article>
      <h1>The Benefits of Learning Languages</h1>
      <p>Learning a new language opens doors to understanding different cultures. It can improve your cognitive abilities and enhance your career prospects.</p>

      <p>Many people find that language learning becomes easier with practice. The key is consistent exposure and active engagement.</p>

      <code>
        // This should be ignored
        function test() {}
      </code>

      <p>John visited Paris last summer.</p>
    </article>
  </main>

  <footer role="contentinfo">
    <p>Copyright 2026</p>
  </footer>
</body>
</html>
`;

// Set up JSDOM with proper globals
const dom = new JSDOM(html);
(global as any).document = dom.window.document;
(global as any).window = dom.window;
(global as any).NodeFilter = dom.window.NodeFilter;
(global as any).HTMLElement = dom.window.HTMLElement;

console.log('='.repeat(60));
console.log('P3 MODULE DEMO - DOM & NLP EXTRACTION');
console.log('='.repeat(60));
console.log();

// Test 1: Extract all candidates
console.log('📋 TEST 1: Extract All Candidates');
console.log('-'.repeat(60));
const allCandidates = extractCandidates(dom.window.document);
console.log(`Found ${allCandidates.length} word candidates\n`);

// Group by POS
const byPos = allCandidates.reduce((acc, c) => {
  acc[c.pos] = (acc[c.pos] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('By Part of Speech:');
Object.entries(byPos).forEach(([pos, count]) => {
  console.log(`  ${pos}: ${count}`);
});
console.log();

// Test 2: Show sample candidates
console.log('📝 Sample Candidates (first 10):');
console.log('-'.repeat(60));
allCandidates.slice(0, 10).forEach(c => {
  const flags = [];
  if (c.isProperNoun) flags.push('PROPER');
  if (c.isMultiWord) flags.push('MULTI');
  const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
  console.log(`  "${c.word}" - ${c.pos}${flagStr}`);
});
console.log();

// Test 3: Filter nouns only
console.log('📘 TEST 2: Extract Nouns Only');
console.log('-'.repeat(60));
const nouns = filterCandidates(allCandidates, c => c.pos === 'Noun');
console.log(`Found ${nouns.length} nouns:`);
console.log(`  ${nouns.map(n => n.word).join(', ')}`);
console.log();

// Test 4: Filter out proper nouns
console.log('🚫 TEST 3: Exclude Proper Nouns');
console.log('-'.repeat(60));
const noProper = filterCandidates(allCandidates, c => !c.isProperNoun);
console.log(`${allCandidates.length} total → ${noProper.length} after filtering proper nouns`);
const properNouns = allCandidates.filter(c => c.isProperNoun);
if (properNouns.length > 0) {
  console.log(`Filtered out: ${properNouns.map(p => p.word).join(', ')}`);
}
console.log();

// Test 5: Group by element
console.log('📦 TEST 4: Group by Element');
console.log('-'.repeat(60));
const groups = groupCandidatesByElement(allCandidates);
console.log(`Candidates distributed across ${groups.size} elements:`);
groups.forEach((candidates, element) => {
  const tag = element.tagName.toLowerCase();
  console.log(`  <${tag}>: ${candidates.length} words`);
});
console.log();

// Test 6: Verify navigation was skipped
console.log('✅ TEST 5: Verify Skipped Elements');
console.log('-'.repeat(60));
const allText = allCandidates.map(c => c.word).join(' ');
const shouldBeSkipped = ['Home', 'About', 'Copyright', 'test', 'function'];
const found = shouldBeSkipped.filter(word => allText.includes(word));
if (found.length === 0) {
  console.log('✓ Navigation, footer, and code blocks successfully skipped!');
} else {
  console.log(`✗ Found words that should have been skipped: ${found.join(', ')}`);
}
console.log();

// Test 7: Check that main content was extracted
console.log('✅ TEST 6: Verify Main Content Extracted');
console.log('-'.repeat(60));
const shouldBeIncluded = ['language', 'learning', 'people', 'practice'];
const foundContent = shouldBeIncluded.filter(word =>
  allCandidates.some(c => c.word.toLowerCase().includes(word))
);
console.log(`Found ${foundContent.length}/${shouldBeIncluded.length} expected content words`);
console.log(`  Expected: ${shouldBeIncluded.join(', ')}`);
console.log(`  Found: ${foundContent.join(', ')}`);
console.log();

console.log('='.repeat(60));
console.log('Demo complete! ✨');
console.log('='.repeat(60));
