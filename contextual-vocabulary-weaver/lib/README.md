# Storage Layer Documentation (P5)

## Overview

This folder contains the complete data storage layer for the Contextual Vocabulary Weaver extension. It manages all word tracking, learning progress, and extension settings using Chrome's local storage API.

**Responsibility:** P5 - Algorithm & Data Engineer

---

## Architecture (Database Analogy)

```
┌─────────────────────────────────────────┐
│  Presentation Layer (P2 Dashboard)      │  ← Read-only queries
├─────────────────────────────────────────┤
│  Business Logic Layer (P4 Translation)  │  ← Read/Write operations
├─────────────────────────────────────────┤
│  Data Layer (P5 Storage Manager) ← YOU  │
│  - Schema Definition (types.ts)         │
│  - CRUD Operations (storage-manager.ts) │
│  - Constants (constants.ts)             │
└─────────────────────────────────────────┘
         │
         ▼
   chrome.storage.local
   (NoSQL key-value store, like Redis/SQLite)
```

---

## File Structure

```
lib/
├── types.ts              # TypeScript interfaces (database schema)
├── constants.ts          # Static data (top 200 common words, thresholds)
├── storage-manager.ts    # Core CRUD operations and business logic
├── index.ts              # Public API exports
├── USAGE_EXAMPLE.md      # Code examples for P2 and P4
└── README.md             # This file
```

---

## Data Schema

### Table 1: `word_stats` (Word Tracking)

| Field            | Type   | Description                               |
| ---------------- | ------ | ----------------------------------------- |
| `word`           | string | Primary Key - English word being tracked |
| `exposureCount`  | number | How many times user saw this word         |
| `recallFailures` | number | How many times user hovered (forgot it)   |
| `firstSeen`      | number | Timestamp of first exposure               |
| `lastSeen`       | number | Timestamp of last exposure                |
| `pKnown`         | number | Calculated: probability user knows word   |

### Table 2: `settings` (Extension Configuration)

| Field            | Type         | Description                           |
| ---------------- | ------------ | ------------------------------------- |
| `enabled`        | boolean      | Global on/off switch                  |
| `density`        | number       | Replacement % (0.01 = 1%, 0.10 = 10%) |
| `targetLanguage` | string       | Target language ('es' for Spanish)    |
| `currentPhase`   | 1 \| 2       | Learning phase (1 = words, 2 = sentences) |

---

## Core Functions

### For P4 (Translation Pipeline)

```typescript
// Get priority score for word selection
await getWordPriority(word); // Returns 0.0 - 1.0

// Track word exposure after replacement
await trackExposure(word);

// Track when user hovers (recall failure)
await trackRecallFailure(word);
```

### For P2 (Dashboard UI)

```typescript
// Get all word statistics for display
await getAllWordStats();

// Get learning summary
await getLearningSummary();
// Returns: { totalWords, knownWords, learningWords, newWords }

// Get recent words
await getRecentWords(10); // Last 10 words

// Update settings
await updateSettings({ density: 0.05 });
```

---

## Algorithm: Simplified Spaced Repetition

### pKnown Calculation

```
pKnown = successRate = (exposureCount - recallFailures) / exposureCount

Bounds: MIN = 0.1, MAX = 0.95

Examples:
- Saw 10 times, forgot 2 times: pKnown = 8/10 = 0.80
- Saw 5 times, forgot 5 times: pKnown = 0/5 = 0.10 (floor)
- Saw 20 times, forgot 0 times: pKnown = 20/20 = 0.95 (ceiling)
```

### Word Priority Calculation

```
Priority = How important to show this word

Logic:
- Never seen before: priority = 1.0 (highest - introduce new vocab)
- pKnown >= 0.85: priority = 0.1 (lowest - already mastered)
- pKnown < 0.85: priority = 1.0 - pKnown (inverse - lower pKnown = higher priority)

Examples:
- New word: priority = 1.0
- pKnown = 0.3: priority = 0.7 (needs lots of practice)
- pKnown = 0.6: priority = 0.4 (some practice needed)
- pKnown = 0.9: priority = 0.1 (skip, already learned)
```

### Phase 1 → Phase 2 Transition

```
Trigger when: User knows 70% of top 200 common Spanish words
Calculation: COUNT(word WHERE pKnown >= 0.85) / 200 >= 0.70

When triggered: Update settings.currentPhase = 2
Effect: P4 switches from word-level to sentence-level translation
```

---

## Testing

### Quick Test in Browser Console

```javascript
// Track some exposures
await trackExposure('hello');
await trackExposure('hello');
await trackExposure('water');

// Check stats
const stats = await getWordStats('hello');
console.log(stats); // { exposureCount: 2, pKnown: 0.0, ... }

// Simulate recall failure
await trackRecallFailure('hello');

// Check updated stats
const updated = await getWordStats('hello');
console.log(updated); // { exposureCount: 2, recallFailures: 1, pKnown: 0.5 }
```

See `USAGE_EXAMPLE.md` for comprehensive testing scenarios.

---

## Integration Points

### P4 calls you:

```typescript
// content.ts or word-replacer.ts
import { getWordPriority, trackExposure, trackRecallFailure } from '@/lib';

// Use getWordPriority() to select which words to replace
// Call trackExposure() after replacing
// Call trackRecallFailure() on hover
```

### P2 calls you:

```typescript
// popup/dashboard.tsx
import { getAllWordStats, getLearningSummary, updateSettings } from '@/lib';

// Use getAllWordStats() to populate vocabulary table
// Use getLearningSummary() for stats cards
// Use updateSettings() for toggle switches
```

---

## Future Enhancements (Out of Scope for Hackathon)

- [ ] Full Bayesian Knowledge Tracing with P(L), P(T), P(G), P(S) parameters
- [ ] Grammar skills matrix for Phase 2 sentence tracking
- [ ] IndexedDB migration for unlimited storage
- [ ] TF-IDF domain adaptation
- [ ] Export/import learning progress
- [ ] Cloud sync across devices

---

## Performance Notes

**chrome.storage.local characteristics:**

- **Speed:** Very fast for small datasets (< 10MB)
- **Limit:** 10MB total storage (sufficient for ~5000 words)
- **Sync:** Automatic if user logged into Chrome
- **Queries:** No SQL - we filter in JavaScript (full table scan)

**Optimization tips:**

- Batch operations: Use `Promise.all()` for multiple reads
- Cache settings: Read once per page load, not per word
- Debounce writes: Don't update storage on every exposure (batch them)

---

## Troubleshooting

### Storage data corrupted?

```javascript
import { clearAllData } from '@/lib';
await clearAllData(); // Wipe everything and start fresh
```

### Want to see all data?

```javascript
import { exportData } from '@/lib';
const snapshot = await exportData();
console.log(JSON.stringify(snapshot, null, 2));
```

### Settings not persisting?

```javascript
// Check if settings exist
const settings = await getSettings();
console.log('Current settings:', settings);

// Manually reset to defaults
await updateSettings(DEFAULT_SETTINGS);
```

---

## Contact

**Owner:** P5 - Algorithm & Data Engineer
**Dependencies:** P1 (project setup), P4 (integration), P2 (dashboard)
**Blocked by:** None - this layer is foundation for others

---

## Documentation Generated By

This storage layer was built with Claude Code assistance during the AI Hackathon 2026.

**Time saved:** ~4-5 hours (complete implementation with types, tests, and docs)
