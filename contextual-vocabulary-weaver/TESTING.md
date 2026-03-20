# Testing Guide

Comprehensive testing documentation for the Contextual Vocabulary Weaver extension.

---

## Quick Start

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode (re-runs on file changes)
npm run test

# Open interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## Test Structure

```
contextual-vocabulary-weaver/
├── test/
│   ├── setup.ts                  # Chrome API mocks and test utilities
│   ├── storage-manager.test.ts   # Storage layer tests (26 tests)
│   └── multi-language.test.ts    # Multi-language support tests (14 tests)
├── vitest.config.ts              # Vitest configuration
└── package.json                  # Test scripts
```

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `storage-manager.test.ts` | 26 | Settings CRUD, Word stats CRUD, BKT algorithm, SRS priority, Analytics, Phase 2 trigger |
| `multi-language.test.ts` | 14 | 83-language support, `getTop200ForLanguage()`, Per-language storage isolation, Data quality |

---

## Test Categories

### 1. Storage Manager Tests (26 tests)

#### Settings CRUD (3 tests)
- ✅ Returns default settings when none exist
- ✅ Saves and retrieves settings correctly
- ✅ Merges partial settings updates

#### Word Stats CRUD (6 tests)
- ✅ Returns null for non-existent words
- ✅ Tracks first word exposure (INSERT operation)
- ✅ Increments exposure count on subsequent exposures (UPDATE)
- ✅ Tracks recall failures (hover events)
- ✅ Stores translation on first exposure only
- ✅ Returns all word stats
- ✅ Uses per-language storage keys (`word_stats_<lang>`)

#### BKT Algorithm (5 tests)
- ✅ Increases pKnown after correct observations (exposure without hover)
- ✅ Decreases pKnown after incorrect observations (hover)
- ✅ Keeps pKnown in valid range [0, 1]
- ✅ Applies learning transition P(T) even after incorrect observations
- ✅ Accounts for high guess rate P(G)=0.75 in passive reading

#### Word Priority (SRS Selection) (4 tests)
- ✅ Prioritizes new words by English frequency rank
- ✅ Gives low priority (0.1) to known words (pKnown ≥ 0.85)
- ✅ Uses inverse priority for learning words (1.0 - pKnown)
- ✅ Higher priority for struggling words vs. partially learned words

#### Analytics & Reporting (2 tests)
- ✅ Returns learning summary with word counts by category
- ✅ Returns recent words sorted by lastSeen timestamp
- ✅ Respects limit parameter in getRecentWords

#### Phase 2 Trigger (3 tests)
- ✅ Returns false when user knows < 70% of top-200 words
- ✅ Returns true when user knows ≥ 70% of top-200 words
- ✅ Triggers Phase 2 transition when ready
- ✅ Does not trigger if already in Phase 2

### 2. Multi-Language Support Tests (14 tests)

#### getTop200ForLanguage() (4 tests)
- ✅ Returns Spanish words for "es"
- ✅ Returns Tamil words for "ta"
- ✅ Returns correct word lists for all 83 supported languages
- ✅ Falls back to Spanish for unsupported language codes
- ✅ Returns consistent references for same language

#### Per-Language Word Statistics (3 tests)
- ✅ Stores word stats under language-specific keys
- ✅ Does not leak word stats across languages
- ✅ Calculates Phase 2 readiness per language

#### Settings Persistence (3 tests)
- ✅ Persists target language across sessions
- ✅ Allows changing target language mid-session
- ✅ Defaults to Spanish if no target language is set

#### Language-Specific Top-200 Lists (4 tests)
- ✅ Has unique words in each language list
- ✅ Has mostly unique words within a language list (< 5% duplicates)
- ✅ Contains non-empty strings in all language lists

---

## Mock Architecture

### Chrome API Mocks (`test/setup.ts`)

The test setup provides in-memory mocks for Chrome Extension APIs:

```typescript
// Mock chrome.storage.local (NoSQL key-value store)
chrome.storage.local.get(keys)
chrome.storage.local.set(items)
chrome.storage.local.remove(keys)
chrome.storage.local.clear()

// Mock chrome.storage.sync (separate sync storage)
chrome.storage.sync.get(keys)
chrome.storage.sync.set(items)
chrome.storage.sync.remove(keys)
chrome.storage.sync.clear()

// Mock chrome.runtime (message passing)
chrome.runtime.sendMessage(message)
```

### Test Utilities

```typescript
// Clear all storage between tests (like TRUNCATE TABLE)
clearMockStorage()

// Get current storage state (for debugging)
getMockStorageState()

// Set storage state directly (for test setup)
setMockStorageState(local, sync)
```

### Example Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { clearMockStorage, setMockStorageState } from './setup';
import { getWordStats, trackExposure } from '../lib/storage-manager';
import { DEFAULT_SETTINGS } from '../lib/types';

describe('Word Statistics', () => {
  beforeEach(() => {
    clearMockStorage(); // Reset storage before each test
  });

  it('should track word exposure', async () => {
    await trackExposure('hello', 'hola');

    const stats = await getWordStats('hello');
    expect(stats?.word).toBe('hello');
    expect(stats?.translation).toBe('hola');
    expect(stats?.exposureCount).toBe(1);
  });

  it('should isolate stats by language', async () => {
    // Set up Spanish word
    setMockStorageState({
      settings: { ...DEFAULT_SETTINGS, targetLanguage: 'es' },
      word_stats_es: {
        hello: { word: 'hello', translation: 'hola', exposureCount: 5, /* ... */ }
      }
    });

    const stats = await getWordStats('hello');
    expect(stats?.translation).toBe('hola');
  });
});
```

---

## Quality Checks

### Pre-Commit Checklist

Before committing code, ensure all quality checks pass:

```bash
# 1. TypeScript type checking
npm run compile

# 2. Linting (auto-fix formatting issues)
npm run lint

# 3. All tests pass
npm run test:run

# 4. Version sync (if cutting a release)
grep '"version"' package.json
grep 'version:' wxt.config.ts
```

### Continuous Integration

For CI/CD pipelines, use this command sequence:

```bash
npm install
npm run compile
npm run lint
npm run test:run
npm run build
```

All steps must exit with code 0 (success).

---

## Version Synchronization

**CRITICAL**: Before any release, verify version numbers match in both files.

### Source of Truth

- **`wxt.config.ts`** → Chrome reads the version from the manifest block
- **`package.json`** → npm metadata (must match for consistency)

### Verification Commands

```bash
# Extract version from package.json
grep '"version"' contextual-vocabulary-weaver/package.json

# Extract version from wxt.config.ts
grep 'version:' contextual-vocabulary-weaver/wxt.config.ts
```

**Expected output (both must match)**:
```
  "version": "0.6.0",
    version: '0.6.0',
```

### Automated Check

Create a test script to verify version sync:

```bash
#!/bin/bash
PKG_VERSION=$(grep '"version"' package.json | sed 's/.*: "\(.*\)",/\1/')
WXT_VERSION=$(grep 'version:' wxt.config.ts | sed "s/.*version: '\(.*\)'.*/\1/")

if [ "$PKG_VERSION" != "$WXT_VERSION" ]; then
  echo "❌ Version mismatch!"
  echo "   package.json: $PKG_VERSION"
  echo "   wxt.config.ts: $WXT_VERSION"
  exit 1
else
  echo "✅ Versions match: $PKG_VERSION"
fi
```

---

## Coverage Report

Generate HTML coverage report:

```bash
npm run test:coverage
```

Output location: `coverage/index.html`

### Coverage Goals

| Module | Target | Current |
|--------|--------|---------|
| `lib/storage-manager.ts` | 90% | ~95% |
| `lib/constants.ts` | 80% | ~90% |
| `lib/types.ts` | 100% | 100% |

---

## Debugging Tests

### Watch Mode

```bash
npm run test
# Tests re-run automatically on file changes
# Use 'f' to run only failed tests
# Use 't' to filter by test name pattern
```

### Interactive UI

```bash
npm run test:ui
# Opens browser-based UI at http://localhost:51204
# Visual test explorer with live updates
```

### Inspect Storage State

Add this to any test to see current storage:

```typescript
import { getMockStorageState } from './setup';

it('test name', async () => {
  // ... test code ...

  console.log('Storage:', getMockStorageState());
  // Output: { local: {...}, sync: {...} }
});
```

### Run Single Test File

```bash
npx vitest run test/storage-manager.test.ts
```

### Run Single Test Case

```bash
npx vitest run -t "should track word exposure"
```

---

## Known Limitations

1. **No DOM testing for translation-pipeline.ts** (future work)
   - Would require more sophisticated DOM mocking
   - Consider using Testing Library or Playwright for integration tests

2. **Mock API limitations**
   - `chrome.storage` mocks are synchronous (real API is async)
   - Message passing mocks return hardcoded responses

3. **Data quality variance**
   - Some language word lists have slight variations (190-210 words)
   - Tests allow up to 5% duplicates due to source data quality

---

## Troubleshooting

### Tests fail with "TypeError: chrome is not defined"

**Cause**: Test setup not imported

**Fix**: Add `import './setup'` at the top of your test file, or ensure `setupFiles` in `vitest.config.ts` includes `./test/setup.ts`.

### Tests fail with "Cannot read property 'pKnown' of null"

**Cause**: Storage not populated before reading

**Fix**: Use `setMockStorageState()` or `trackExposure()` to create test data before assertions.

### Version mismatch errors

**Cause**: `package.json` and `wxt.config.ts` out of sync

**Fix**: Update both files to the same version number, then commit.

---

## Contributing

When adding new features:

1. **Write tests first** (TDD approach recommended)
2. **Use `beforeEach()` to clear storage** between tests
3. **Use descriptive test names** (what behavior, under what conditions)
4. **Group related tests** with `describe()` blocks
5. **Avoid test interdependence** (each test should run independently)

### Test Naming Convention

```typescript
describe('Module Name - Feature Category', () => {
  it('should [expected behavior] when [condition]', async () => {
    // Arrange (set up test data)
    // Act (call the function)
    // Assert (verify the result)
  });
});
```

---

## External Resources

- **Vitest Documentation**: https://vitest.dev/
- **Chrome Extension Testing**: https://developer.chrome.com/docs/extensions/mv3/testing/
- **BKT Algorithm**: Corbett & Anderson (1994) - Knowledge tracing: Modeling the acquisition of procedural knowledge

---

**Last Updated**: 2026-03-20 (v0.6.0)
