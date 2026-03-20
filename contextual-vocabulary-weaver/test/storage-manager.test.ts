/**
 * Unit Tests for Storage Manager (P5 - Algorithm & Data Layer)
 *
 * Database Analogy: These are integration tests for our data access layer
 * Similar to testing stored procedures, triggers, and business logic in a database
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clearMockStorage, setMockStorageState } from './setup';
import {
  getSettings,
  updateSettings,
  getWordStats,
  getAllWordStats,
  trackExposure,
  trackRecallFailure,
  bktUpdate,
  getWordPriority,
  getLearningSummary,
  getRecentWords,
  shouldEnablePhase2,
  checkAndTriggerPhase2,
} from '../lib/storage-manager';
import { DEFAULT_SETTINGS } from '../lib/types';
import { BKT_P_INIT, BKT_P_GUESS, BKT_P_SLIP, BKT_P_TRANSIT, KNOWN_THRESHOLD } from '../lib/constants';

describe('Storage Manager - Settings CRUD', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  it('should return default settings when none exist', async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('should save and retrieve settings', async () => {
    await updateSettings({ density: 0.08, enabled: false });
    const settings = await getSettings();

    expect(settings.density).toBe(0.08);
    expect(settings.enabled).toBe(false);
    expect(settings.targetLanguage).toBe('es'); // Default preserved
  });

  it('should merge partial settings updates', async () => {
    await updateSettings({ density: 0.05 });
    await updateSettings({ enabled: false });

    const settings = await getSettings();
    expect(settings.density).toBe(0.05);
    expect(settings.enabled).toBe(false);
  });
});

describe('Storage Manager - Word Stats CRUD', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  it('should return null for non-existent word', async () => {
    const stats = await getWordStats('hello');
    expect(stats).toBeNull();
  });

  it('should track first word exposure (INSERT)', async () => {
    await trackExposure('hello', 'hola');

    const stats = await getWordStats('hello');
    expect(stats).not.toBeNull();
    expect(stats?.word).toBe('hello');
    expect(stats?.translation).toBe('hola');
    expect(stats?.exposureCount).toBe(1);
    expect(stats?.recallFailures).toBe(0);
    expect(stats?.pKnown).toBe(BKT_P_INIT); // New words start at P(L0) = 0.0
  });

  it('should increment exposure count on subsequent exposures (UPDATE)', async () => {
    await trackExposure('hello', 'hola');
    await trackExposure('hello'); // No translation needed on repeat
    await trackExposure('hello');

    const stats = await getWordStats('hello');
    expect(stats?.exposureCount).toBe(3);
    expect(stats?.pKnown).toBeGreaterThan(BKT_P_INIT); // Should increase after correct observations
  });

  it('should track recall failures (hover events)', async () => {
    // Create a word with moderate knowledge level (multiple exposures)
    await trackExposure('hello', 'hola');
    await trackExposure('hello');
    await trackExposure('hello');
    await trackExposure('hello');
    await trackExposure('hello'); // Build up pKnown

    const statsBeforeFailure = await getWordStats('hello');
    const pKnownBeforeFailure = statsBeforeFailure!.pKnown;

    await trackRecallFailure('hello');

    const stats = await getWordStats('hello');
    expect(stats?.recallFailures).toBe(1);
    expect(stats?.exposureCount).toBe(5);

    // With higher initial pKnown, a recall failure should show visible decrease
    // (though learning transition P(T) still applies)
    expect(stats?.pKnown).toBeLessThan(pKnownBeforeFailure);
  });

  it('should store translation on first exposure only', async () => {
    await trackExposure('hello', 'hola');
    await trackExposure('hello', 'different-translation');

    const stats = await getWordStats('hello');
    expect(stats?.translation).toBe('hola'); // First translation preserved
  });

  it('should return all word stats', async () => {
    await trackExposure('hello', 'hola');
    await trackExposure('world', 'mundo');
    await trackExposure('goodbye', 'adiós');

    const allStats = await getAllWordStats();
    expect(Object.keys(allStats)).toHaveLength(3);
    expect(allStats['hello']).toBeDefined();
    expect(allStats['world']).toBeDefined();
    expect(allStats['goodbye']).toBeDefined();
  });

  it('should use per-language storage keys', async () => {
    // Spanish words
    await updateSettings({ targetLanguage: 'es' });
    await trackExposure('hello', 'hola');

    // Switch to French
    await updateSettings({ targetLanguage: 'fr' });
    await trackExposure('hello', 'bonjour');

    // Verify Spanish stats still exist
    await updateSettings({ targetLanguage: 'es' });
    const esStats = await getWordStats('hello');
    expect(esStats?.translation).toBe('hola');

    // Verify French stats are separate
    await updateSettings({ targetLanguage: 'fr' });
    const frStats = await getWordStats('hello');
    expect(frStats?.translation).toBe('bonjour');
  });
});

describe('Storage Manager - BKT Algorithm', () => {
  it('should increase pKnown after correct observations (exposure without hover)', () => {
    let pKnown = BKT_P_INIT; // Start at 0.0

    // Simulate multiple correct observations
    pKnown = bktUpdate(pKnown, true);
    expect(pKnown).toBeGreaterThan(BKT_P_INIT);

    pKnown = bktUpdate(pKnown, true);
    expect(pKnown).toBeGreaterThan(0.1);

    pKnown = bktUpdate(pKnown, true);
    expect(pKnown).toBeGreaterThan(0.2);
  });

  it('should decrease pKnown after incorrect observations (hover)', () => {
    // Start with some knowledge
    let pKnown = 0.5;

    pKnown = bktUpdate(pKnown, false); // Incorrect observation
    expect(pKnown).toBeLessThan(0.5);
  });

  it('should keep pKnown in valid range [0, 1]', () => {
    // Test lower bound
    let pKnown = 0.0;
    for (let i = 0; i < 10; i++) {
      pKnown = bktUpdate(pKnown, false);
      expect(pKnown).toBeGreaterThanOrEqual(0);
      expect(pKnown).toBeLessThanOrEqual(1);
    }

    // Test upper bound
    pKnown = 0.99;
    for (let i = 0; i < 10; i++) {
      pKnown = bktUpdate(pKnown, true);
      expect(pKnown).toBeGreaterThanOrEqual(0);
      expect(pKnown).toBeLessThanOrEqual(1);
    }
  });

  it('should apply learning transition (P(T)) even after incorrect observations', () => {
    const pKnown = 0.5;
    const updated = bktUpdate(pKnown, false); // Incorrect

    // Even though the observation was incorrect, there should be some learning
    // The formula: P(L_n) = P(L|obs) + (1 - P(L|obs)) * P(T)
    // So updated should be >= some minimum based on P(T) = 0.15
    expect(updated).toBeGreaterThan(0); // Not zero due to learning transition
  });

  it('should account for high guess rate (P(G) = 0.75) in passive reading', () => {
    // With high P(G), correct observations should increase pKnown slowly
    // because the model assumes users often skip unknown words without hovering

    let pKnown = BKT_P_INIT;
    const initialKnown = pKnown;

    pKnown = bktUpdate(pKnown, true);

    // The increase should be modest due to high P(G)
    const increase = pKnown - initialKnown;
    expect(increase).toBeLessThan(0.3); // Not a huge jump
    expect(increase).toBeGreaterThan(0); // But still positive
  });
});

describe('Storage Manager - Word Priority (SRS Selection)', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  it('should prioritize new words by English frequency rank', async () => {
    // Common words get higher priority
    const priorityThe = await getWordPriority('the'); // Most common English word
    const priorityRandom = await getWordPriority('xylophone'); // Uncommon word

    expect(priorityThe).toBeCloseTo(1.0, 1); // Should be near 1.0
    expect(priorityRandom).toBeCloseTo(0.5, 1); // Default for words not in frequency list
  });

  it('should give low priority to known words (pKnown >= 0.85)', async () => {
    // Create a known word
    setMockStorageState({
      settings: DEFAULT_SETTINGS,
      word_stats_es: {
        hello: {
          word: 'hello',
          translation: 'hola',
          exposureCount: 20,
          recallFailures: 0,
          firstSeen: Date.now() - 100000,
          lastSeen: Date.now(),
          pKnown: 0.90, // Known
        },
      },
    });

    const priority = await getWordPriority('hello');
    expect(priority).toBe(0.1); // Low priority for known words
  });

  it('should use inverse priority for learning words (0.0 < pKnown < 0.85)', async () => {
    // Word with low knowledge needs high priority
    setMockStorageState({
      settings: DEFAULT_SETTINGS,
      word_stats_es: {
        difficult: {
          word: 'difficult',
          translation: 'difícil',
          exposureCount: 5,
          recallFailures: 3,
          firstSeen: Date.now() - 100000,
          lastSeen: Date.now(),
          pKnown: 0.3, // Low knowledge
        },
      },
    });

    const priority = await getWordPriority('difficult');
    expect(priority).toBeCloseTo(0.7, 1); // 1.0 - 0.3 = 0.7 (high priority)
  });

  it('should give higher priority to struggling words than partially learned words', async () => {
    setMockStorageState({
      settings: DEFAULT_SETTINGS,
      word_stats_es: {
        struggling: {
          word: 'struggling',
          translation: 'luchando',
          exposureCount: 10,
          recallFailures: 8,
          firstSeen: Date.now() - 100000,
          lastSeen: Date.now(),
          pKnown: 0.2,
        },
        learning: {
          word: 'learning',
          translation: 'aprendiendo',
          exposureCount: 10,
          recallFailures: 3,
          firstSeen: Date.now() - 100000,
          lastSeen: Date.now(),
          pKnown: 0.6,
        },
      },
    });

    const priorityStruggling = await getWordPriority('struggling');
    const priorityLearning = await getWordPriority('learning');

    expect(priorityStruggling).toBeGreaterThan(priorityLearning);
  });
});

describe('Storage Manager - Analytics & Reporting', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  it('should return learning summary with word counts by category', async () => {
    setMockStorageState({
      settings: DEFAULT_SETTINGS,
      word_stats_es: {
        known1: { word: 'known1', exposureCount: 20, recallFailures: 0, firstSeen: 0, lastSeen: 0, pKnown: 0.90 },
        known2: { word: 'known2', exposureCount: 20, recallFailures: 0, firstSeen: 0, lastSeen: 0, pKnown: 0.88 },
        learning1: { word: 'learning1', exposureCount: 10, recallFailures: 3, firstSeen: 0, lastSeen: 0, pKnown: 0.50 },
        learning2: { word: 'learning2', exposureCount: 10, recallFailures: 3, firstSeen: 0, lastSeen: 0, pKnown: 0.60 },
        new1: { word: 'new1', exposureCount: 2, recallFailures: 1, firstSeen: 0, lastSeen: 0, pKnown: 0.15 },
      },
    });

    const summary = await getLearningSummary();

    expect(summary.totalWords).toBe(5);
    expect(summary.knownWords).toBe(2); // pKnown >= 0.85
    expect(summary.learningWords).toBe(2); // 0.3 <= pKnown < 0.85
    expect(summary.newWords).toBe(1); // pKnown < 0.3
  });

  it('should return recent words sorted by lastSeen timestamp', async () => {
    const now = Date.now();

    setMockStorageState({
      settings: DEFAULT_SETTINGS,
      word_stats_es: {
        oldest: { word: 'oldest', exposureCount: 1, recallFailures: 0, firstSeen: now - 3000, lastSeen: now - 3000, pKnown: 0.1 },
        middle: { word: 'middle', exposureCount: 1, recallFailures: 0, firstSeen: now - 2000, lastSeen: now - 2000, pKnown: 0.1 },
        newest: { word: 'newest', exposureCount: 1, recallFailures: 0, firstSeen: now - 1000, lastSeen: now - 1000, pKnown: 0.1 },
      },
    });

    const recent = await getRecentWords(3);

    expect(recent).toHaveLength(3);
    expect(recent[0].word).toBe('newest'); // Most recent first
    expect(recent[1].word).toBe('middle');
    expect(recent[2].word).toBe('oldest');
  });

  it('should respect limit parameter in getRecentWords', async () => {
    const now = Date.now();

    setMockStorageState({
      settings: DEFAULT_SETTINGS,
      word_stats_es: {
        word1: { word: 'word1', exposureCount: 1, recallFailures: 0, firstSeen: now - 5000, lastSeen: now - 5000, pKnown: 0.1 },
        word2: { word: 'word2', exposureCount: 1, recallFailures: 0, firstSeen: now - 4000, lastSeen: now - 4000, pKnown: 0.1 },
        word3: { word: 'word3', exposureCount: 1, recallFailures: 0, firstSeen: now - 3000, lastSeen: now - 3000, pKnown: 0.1 },
        word4: { word: 'word4', exposureCount: 1, recallFailures: 0, firstSeen: now - 2000, lastSeen: now - 2000, pKnown: 0.1 },
        word5: { word: 'word5', exposureCount: 1, recallFailures: 0, firstSeen: now - 1000, lastSeen: now - 1000, pKnown: 0.1 },
      },
    });

    const recent = await getRecentWords(2);
    expect(recent).toHaveLength(2);
  });
});

describe('Storage Manager - Phase 2 Trigger', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  it('should return false when user knows < 70% of top-200 words', async () => {
    // Simulate knowing only 100/200 words (50%)
    const wordStats: Record<string, unknown> = {};

    // Import the top-200 list dynamically
    const { TOP_200_COMMON_WORDS_ES } = await import('../lib/constants');

    for (let i = 0; i < 100; i++) {
      const word = TOP_200_COMMON_WORDS_ES[i];
      wordStats[word] = {
        word,
        exposureCount: 10,
        recallFailures: 0,
        firstSeen: 0,
        lastSeen: 0,
        pKnown: 0.90, // Known
      };
    }

    setMockStorageState({
      settings: DEFAULT_SETTINGS,
      word_stats_es: wordStats,
    });

    const shouldEnable = await shouldEnablePhase2();
    expect(shouldEnable).toBe(false);
  });

  it('should return true when user knows >= 70% of top-200 words', async () => {
    // Simulate knowing 150/200 words (75%)
    const wordStats: Record<string, unknown> = {};

    const { TOP_200_COMMON_WORDS_ES } = await import('../lib/constants');

    for (let i = 0; i < 150; i++) {
      const word = TOP_200_COMMON_WORDS_ES[i];
      wordStats[word] = {
        word,
        exposureCount: 10,
        recallFailures: 0,
        firstSeen: 0,
        lastSeen: 0,
        pKnown: 0.90, // Known
      };
    }

    setMockStorageState({
      settings: DEFAULT_SETTINGS,
      word_stats_es: wordStats,
    });

    const shouldEnable = await shouldEnablePhase2();
    expect(shouldEnable).toBe(true);
  });

  it('should trigger Phase 2 transition when ready', async () => {
    // Set up 150 known words
    const wordStats: Record<string, unknown> = {};
    const { TOP_200_COMMON_WORDS_ES } = await import('../lib/constants');

    for (let i = 0; i < 150; i++) {
      const word = TOP_200_COMMON_WORDS_ES[i];
      wordStats[word] = {
        word,
        exposureCount: 10,
        recallFailures: 0,
        firstSeen: 0,
        lastSeen: 0,
        pKnown: 0.90,
      };
    }

    setMockStorageState({
      settings: { ...DEFAULT_SETTINGS, currentPhase: 1 },
      word_stats_es: wordStats,
    });

    const triggered = await checkAndTriggerPhase2();
    expect(triggered).toBe(true);

    const settings = await getSettings();
    expect(settings.currentPhase).toBe(2);
  });

  it('should not trigger Phase 2 if already in Phase 2', async () => {
    setMockStorageState({
      settings: { ...DEFAULT_SETTINGS, currentPhase: 2 },
      word_stats_es: {},
    });

    const triggered = await checkAndTriggerPhase2();
    expect(triggered).toBe(false); // Already in Phase 2
  });
});
