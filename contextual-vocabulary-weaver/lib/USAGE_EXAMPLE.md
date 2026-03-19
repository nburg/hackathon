# Storage Layer Usage Examples

## Database Analogy Quick Reference

```
chrome.storage.local = Your embedded SQLite database
getWordStats()       = SELECT * FROM word_stats WHERE word = ?
trackExposure()      = INSERT/UPDATE (UPSERT/MERGE)
trackRecallFailure() = UPDATE word_stats SET failures = failures + 1
getAllWordStats()    = SELECT * FROM word_stats
```

---

## For P4 (Translation Pipeline Engineer)

### When replacing words on a page:

```typescript
import { getWordPriority, trackExposure } from '@/lib';

// Step 1: Get priority scores for candidate words
async function selectWordsToReplace(candidates: string[]) {
  const priorities = await Promise.all(
    candidates.map(async (word) => ({
      word,
      priority: await getWordPriority(word),
    }))
  );

  // Sort by priority (highest first) and select top N based on density
  return priorities
    .sort((a, b) => b.priority - a.priority)
    .slice(0, numWordsToReplace)
    .map((p) => p.word);
}

// Step 2: After replacing words, track exposure
async function afterReplacingWords(replacedWords: string[]) {
  await Promise.all(replacedWords.map((word) => trackExposure(word)));
}
```

### When user hovers over a replaced word:

```typescript
import { trackRecallFailure } from '@/lib';

// User hovered to see original word = they forgot it
async function onWordHover(word: string) {
  await trackRecallFailure(word);
  // Show tooltip with original word
}
```

---

## For P2 (Dashboard UI Engineer)

### Display learning statistics:

```typescript
import { getLearningSummary, getRecentWords, getAllWordStats } from '@/lib';

// Get summary for dashboard header
async function loadDashboardSummary() {
  const summary = await getLearningSummary();
  /*
    summary = {
      totalWords: 45,
      knownWords: 12,      // pKnown >= 0.85
      learningWords: 25,   // 0.3 <= pKnown < 0.85
      newWords: 8          // pKnown < 0.3
    }
  */
  return summary;
}

// Get recent words for "Recent Vocabulary" section
async function loadRecentWords() {
  const recent = await getRecentWords(10); // Get last 10 words
  /*
    recent = [
      { word: "hello", exposureCount: 5, pKnown: 0.8, ... },
      { word: "water", exposureCount: 3, pKnown: 0.66, ... },
      ...
    ]
  */
  return recent;
}

// Get all words for full vocabulary list
async function loadAllVocabulary() {
  const allStats = await getAllWordStats();
  // Returns: { "hello": {...}, "water": {...}, ... }

  // Convert to array for table display
  const wordsArray = Object.values(allStats).sort((a, b) => b.pKnown - a.pKnown);
  return wordsArray;
}
```

### Toggle extension on/off:

```typescript
import { getSettings, updateSettings } from '@/lib';

async function toggleExtension() {
  const settings = await getSettings();
  await updateSettings({ enabled: !settings.enabled });
}
```

### Adjust replacement density:

```typescript
import { updateSettings } from '@/lib';

async function setDensity(newDensity: number) {
  // newDensity: 0.01 (1%), 0.05 (5%), 0.10 (10%)
  await updateSettings({ density: newDensity });
}
```

---

## For P5 (You - Testing)

### Test the storage layer in browser console:

1. Load the extension in Chrome
2. Open DevTools Console (F12)
3. Copy/paste these test commands:

```javascript
// Import storage functions (adjust path as needed)
import {
  trackExposure,
  trackRecallFailure,
  getWordStats,
  getAllWordStats,
  getLearningSummary,
} from './lib/storage-manager.js';

// Test 1: Track word exposure
await trackExposure('hello');
await trackExposure('hello'); // Expose twice
await trackExposure('water');

// Test 2: Check stats
const helloStats = await getWordStats('hello');
console.log('Hello stats:', helloStats);
// Should show: { exposureCount: 2, recallFailures: 0, pKnown: 0.0 }

// Test 3: Track recall failure
await trackRecallFailure('hello');

// Test 4: Check updated stats
const updatedStats = await getWordStats('hello');
console.log('Updated stats:', updatedStats);
// Should show: { exposureCount: 2, recallFailures: 1, pKnown: 0.5 }

// Test 5: Get summary
const summary = await getLearningSummary();
console.log('Learning summary:', summary);

// Test 6: Get all data
const allStats = await getAllWordStats();
console.log('All tracked words:', allStats);
```

### Manual test scenarios:

**Scenario 1: New word progression**

```javascript
// User sees "hello" for the first time
await trackExposure('hello');
// pKnown = 0.0 (never seen before)

// User sees it again (remembers it)
await trackExposure('hello');
// pKnown = 0.0 still (no failures yet)

// User hovers (forgot it)
await trackRecallFailure('hello');
// exposureCount = 2, recallFailures = 1
// pKnown = (2-1)/2 = 0.5

// User sees it 3 more times without hovering (remembers it!)
await trackExposure('hello');
await trackExposure('hello');
await trackExposure('hello');
// exposureCount = 5, recallFailures = 1
// pKnown = (5-1)/5 = 0.8 (learning well!)
```

**Scenario 2: Testing Phase 2 trigger**

```javascript
import { shouldEnablePhase2, checkAndTriggerPhase2 } from './lib/storage-manager.js';

// Check if ready for Phase 2
const isReady = await shouldEnablePhase2();
console.log('Ready for Phase 2?', isReady);
// Returns: false (need to know 70% of top 200 words)

// Simulate learning many words (for testing only!)
// In real usage, this happens naturally over time
import { TOP_200_COMMON_WORDS } from './lib/constants.js';

// Fake learning 140 words (70% of 200)
for (let i = 0; i < 140; i++) {
  const word = TOP_200_COMMON_WORDS[i];
  // Simulate high knowledge (20 exposures, 1 failure = 95% success)
  for (let j = 0; j < 20; j++) {
    await trackExposure(word);
  }
  await trackRecallFailure(word); // One failure
}

// Now check again
const nowReady = await shouldEnablePhase2();
console.log('Ready now?', nowReady); // Should be true

// Trigger Phase 2
const triggered = await checkAndTriggerPhase2();
console.log('Phase 2 triggered?', triggered); // Should be true
```

---

## Database Operations Cheat Sheet

| JavaScript Function | SQL Equivalent                                           |
| ------------------- | -------------------------------------------------------- |
| `getWordStats(w)`   | `SELECT * FROM word_stats WHERE word = ?`               |
| `getAllWordStats()` | `SELECT * FROM word_stats`                               |
| `trackExposure(w)`  | `MERGE INTO word_stats ... ON MATCH UPDATE ... INSERT` |
| `trackRecallFailure(w)` | `UPDATE word_stats SET recallFailures = recallFailures + 1` |
| `getLearningSummary()` | `SELECT COUNT(*), SUM(CASE ...) FROM word_stats GROUP BY ...` |
| `getRecentWords(N)` | `SELECT * FROM word_stats ORDER BY lastSeen DESC LIMIT N` |
| `clearAllData()`    | `TRUNCATE TABLE word_stats; DELETE FROM settings`        |

---

## Common Debugging Queries

```javascript
// Check current settings
const settings = await getSettings();
console.log('Current settings:', settings);

// Count total tracked words
const all = await getAllWordStats();
console.log('Total words tracked:', Object.keys(all).length);

// Find words with high failure rate
const all = await getAllWordStats();
const struggling = Object.values(all).filter(
  (s) => s.recallFailures / s.exposureCount > 0.5
);
console.log('Struggling with:', struggling);

// Find mastered words
const all = await getAllWordStats();
const mastered = Object.values(all).filter((s) => s.pKnown >= 0.85);
console.log('Mastered words:', mastered);

// Export everything for inspection
const data = await exportData();
console.log('Full database dump:', JSON.stringify(data, null, 2));
```
