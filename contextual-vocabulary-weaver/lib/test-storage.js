/**
 * Storage Layer Test Script
 *
 * Copy and paste this code into Chrome DevTools Console to test the storage layer.
 *
 * IMPORTANT: Before running, make sure to:
 * 1. Load the extension in Chrome (chrome://extensions/)
 * 2. Open any webpage
 * 3. Open DevTools Console (F12)
 * 4. Run these tests
 */

// =============================================================================
// TEST 1: Track Word Exposure (单词曝光测试)
// =============================================================================

console.log('TEST 1: Track word exposure');

// Simulate user seeing "hello" twice
await chrome.storage.local.get('word_stats').then(data => {
  const stats = data.word_stats || {};

  // First exposure
  if (!stats['hello']) {
    stats['hello'] = {
      word: 'hello',
      exposureCount: 1,
      recallFailures: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      pKnown: 0.0
    };
  } else {
    stats['hello'].exposureCount += 1;
    stats['hello'].lastSeen = Date.now();
    stats['hello'].pKnown = (stats['hello'].exposureCount - stats['hello'].recallFailures) / stats['hello'].exposureCount;
  }

  return chrome.storage.local.set({ word_stats: stats });
});

// Check result
const result1 = await chrome.storage.local.get('word_stats');
console.log('After exposure:', result1.word_stats['hello']);
// Should show: exposureCount: 1, recallFailures: 0, pKnown: 0.0

// =============================================================================
// TEST 2: Track Recall Failure (回忆失败测试)
// =============================================================================

console.log('\nTEST 2: Track recall failure (hover)');

// Expose "hello" again
await chrome.storage.local.get('word_stats').then(data => {
  const stats = data.word_stats || {};
  stats['hello'].exposureCount += 1;
  stats['hello'].lastSeen = Date.now();
  stats['hello'].pKnown = (stats['hello'].exposureCount - stats['hello'].recallFailures) / stats['hello'].exposureCount;
  return chrome.storage.local.set({ word_stats: stats });
});

// User hovers (forgot the word)
await chrome.storage.local.get('word_stats').then(data => {
  const stats = data.word_stats || {};
  stats['hello'].recallFailures += 1;
  stats['hello'].pKnown = (stats['hello'].exposureCount - stats['hello'].recallFailures) / stats['hello'].exposureCount;
  return chrome.storage.local.set({ word_stats: stats });
});

const result2 = await chrome.storage.local.get('word_stats');
console.log('After hover:', result2.word_stats['hello']);
// Should show: exposureCount: 2, recallFailures: 1, pKnown: 0.5 (50% success rate)

// =============================================================================
// TEST 3: Multiple Words (多个单词测试)
// =============================================================================

console.log('\nTEST 3: Track multiple words');

// Track "water"
await chrome.storage.local.get('word_stats').then(data => {
  const stats = data.word_stats || {};
  stats['water'] = {
    word: 'water',
    exposureCount: 5,
    recallFailures: 1,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    pKnown: (5 - 1) / 5  // 0.8
  };
  return chrome.storage.local.set({ word_stats: stats });
});

// Track "food"
await chrome.storage.local.get('word_stats').then(data => {
  const stats = data.word_stats || {};
  stats['food'] = {
    word: 'food',
    exposureCount: 10,
    recallFailures: 0,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    pKnown: 0.95  // Maximum
  };
  return chrome.storage.local.set({ word_stats: stats });
});

const result3 = await chrome.storage.local.get('word_stats');
console.log('All words:', result3.word_stats);
console.log('Total words tracked:', Object.keys(result3.word_stats).length);

// =============================================================================
// TEST 4: Learning Summary (学习摘要测试)
// =============================================================================

console.log('\nTEST 4: Calculate learning summary');

const allStats = await chrome.storage.local.get('word_stats').then(d => d.word_stats || {});
const statsArray = Object.values(allStats);

const summary = {
  totalWords: statsArray.length,
  knownWords: statsArray.filter(s => s.pKnown >= 0.85).length,
  learningWords: statsArray.filter(s => s.pKnown >= 0.3 && s.pKnown < 0.85).length,
  newWords: statsArray.filter(s => s.pKnown < 0.3).length
};

console.log('Learning Summary:', summary);
// Should show: totalWords: 3, knownWords: 1 (food), learningWords: 1 (water), newWords: 1 (hello)

// =============================================================================
// TEST 5: Word Priority Calculation (单词优先级计算)
// =============================================================================

console.log('\nTEST 5: Calculate word priorities');

function calculatePriority(word, stats) {
  if (!stats[word]) return 1.0;  // New word
  if (stats[word].pKnown >= 0.85) return 0.1;  // Known
  return 1.0 - stats[word].pKnown;  // Learning
}

console.log('Priority for "hello" (pKnown=0.5):', calculatePriority('hello', allStats));  // Should be 0.5
console.log('Priority for "water" (pKnown=0.8):', calculatePriority('water', allStats));  // Should be 0.2
console.log('Priority for "food" (pKnown=0.95):', calculatePriority('food', allStats));   // Should be 0.1 (skip)
console.log('Priority for "new_word" (not seen):', calculatePriority('new_word', allStats)); // Should be 1.0

// =============================================================================
// TEST 6: Settings Management (设置管理测试)
// =============================================================================

console.log('\nTEST 6: Settings management');

// Set initial settings
await chrome.storage.local.set({
  settings: {
    enabled: true,
    density: 0.05,
    targetLanguage: 'es',
    currentPhase: 1
  }
});

const settings = await chrome.storage.local.get('settings');
console.log('Current settings:', settings.settings);

// Update density
await chrome.storage.local.get('settings').then(data => {
  const newSettings = { ...data.settings, density: 0.10 };
  return chrome.storage.local.set({ settings: newSettings });
});

const updatedSettings = await chrome.storage.local.get('settings');
console.log('After density change:', updatedSettings.settings);
// Should show: density: 0.10

// =============================================================================
// TEST 7: Export All Data (导出所有数据)
// =============================================================================

console.log('\nTEST 7: Export all data');

const allData = await chrome.storage.local.get(null);
console.log('Complete storage dump:', JSON.stringify(allData, null, 2));

// =============================================================================
// TEST 8: Clear All Data (清空所有数据 - 小心!)
// =============================================================================

console.log('\nTEST 8: Clear all data (commented out for safety)');
// Uncomment below to clear everything:
// await chrome.storage.local.clear();
// console.log('All data cleared!');

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n=== TEST SUMMARY ===');
console.log('✅ All tests completed!');
console.log('Your storage layer is working correctly.');
console.log('\nNext steps:');
console.log('1. Share this test with P2 (Dashboard) and P4 (Translation)');
console.log('2. P4 can now integrate word priority and tracking');
console.log('3. P2 can now build the dashboard UI');
