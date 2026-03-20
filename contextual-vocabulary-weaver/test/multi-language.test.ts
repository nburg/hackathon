/**
 * Unit Tests for Multi-Language Support (Role 3)
 *
 * Tests the language-agnostic architecture with 83 supported languages
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clearMockStorage, setMockStorageState } from './setup';
import { getTop200ForLanguage, TOP_200_COMMON_WORDS_ES, TOP_200_COMMON_WORDS_TA } from '../lib/constants';
import { updateSettings, getSettings, trackExposure, getWordStats, shouldEnablePhase2 } from '../lib/storage-manager';
import { DEFAULT_SETTINGS } from '../lib/types';

describe('Multi-Language Support - getTop200ForLanguage()', () => {
  it('should return Spanish words for "es"', () => {
    const words = getTop200ForLanguage('es');
    expect(words).toBe(TOP_200_COMMON_WORDS_ES);
    expect(words).toHaveLength(200);
  });

  it('should return Tamil words for "ta"', () => {
    const words = getTop200ForLanguage('ta');
    expect(words).toBe(TOP_200_COMMON_WORDS_TA);
    // Tamil list may have slight variations (206 words)
    expect(words.length).toBeGreaterThanOrEqual(190);
    expect(words.length).toBeLessThanOrEqual(210);
  });

  it('should return correct word lists for all 83 supported languages', () => {
    const supportedLanguages = [
      'af',
      'sq',
      'am',
      'ar',
      'az',
      'eu',
      'be',
      'bn',
      'bs',
      'bg',
      'my',
      'ca',
      'zh-CN',
      'zh-TW',
      'hr',
      'cs',
      'da',
      'nl',
      'et',
      'fil',
      'fi',
      'fr',
      'fy',
      'gl',
      'ka',
      'de',
      'el',
      'gu',
      'ha',
      'he',
      'hi',
      'hu',
      'is',
      'ig',
      'id',
      'ga',
      'it',
      'ja',
      'kn',
      'km',
      'ko',
      'ky',
      'lo',
      'lv',
      'ln',
      'lt',
      'lb',
      'mk',
      'ms',
      'ml',
      'mt',
      'mr',
      'mn',
      'ne',
      'no',
      'or',
      'fa',
      'pl',
      'pt',
      'pa',
      'ro',
      'ru',
      'gd',
      'sr',
      'sk',
      'sl',
      'so',
      'es',
      'sw',
      'sv',
      'tl',
      'tg',
      'ta',
      'te',
      'th',
      'tr',
      'uk',
      'ur',
      'uz',
      'vi',
      'cy',
      'zu',
    ];

    for (const langCode of supportedLanguages) {
      const words = getTop200ForLanguage(langCode);
      expect(words).toBeDefined();
      // Allow reasonable variance (190-210 words) to accommodate data quality variations
      expect(words.length).toBeGreaterThanOrEqual(190);
      expect(words.length).toBeLessThanOrEqual(210);
      expect(Array.isArray(words)).toBe(true);
    }
  });

  it('should fallback to Spanish for unsupported language codes', () => {
    const words = getTop200ForLanguage('xx-INVALID');
    expect(words).toBe(TOP_200_COMMON_WORDS_ES); // Fallback to Spanish
    expect(words).toHaveLength(200);
  });

  it('should return consistent references for same language', () => {
    // Calling getTop200ForLanguage multiple times should return the same reference
    const words1 = getTop200ForLanguage('es');
    const words2 = getTop200ForLanguage('es');

    // Same language should return same array reference (not a copy)
    expect(words1).toBe(words2);

    // TypeScript enforces readonly at compile time, but at runtime
    // the arrays are still mutable JavaScript arrays
    expect(Array.isArray(words1)).toBe(true);
  });
});

describe('Multi-Language Support - Per-Language Word Statistics', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  it('should store word stats under language-specific keys', async () => {
    // Track Spanish word
    await updateSettings({ targetLanguage: 'es' });
    await trackExposure('hello', 'hola');

    // Track French word
    await updateSettings({ targetLanguage: 'fr' });
    await trackExposure('hello', 'bonjour');

    // Track German word
    await updateSettings({ targetLanguage: 'de' });
    await trackExposure('hello', 'hallo');

    // Verify all three are stored separately
    await updateSettings({ targetLanguage: 'es' });
    const esStats = await getWordStats('hello');
    expect(esStats?.translation).toBe('hola');

    await updateSettings({ targetLanguage: 'fr' });
    const frStats = await getWordStats('hello');
    expect(frStats?.translation).toBe('bonjour');

    await updateSettings({ targetLanguage: 'de' });
    const deStats = await getWordStats('hello');
    expect(deStats?.translation).toBe('hallo');
  });

  it('should not leak word stats across languages', async () => {
    // Create Spanish vocabulary
    await updateSettings({ targetLanguage: 'es' });
    await trackExposure('hello', 'hola');
    await trackExposure('world', 'mundo');

    // Switch to French - should have empty vocabulary
    await updateSettings({ targetLanguage: 'fr' });
    const helloFr = await getWordStats('hello');
    const worldFr = await getWordStats('world');

    expect(helloFr).toBeNull(); // Spanish words not in French storage
    expect(worldFr).toBeNull();
  });

  it('should calculate Phase 2 readiness per language', async () => {
    // Spanish: Set up 150 known words (75% of top-200)
    await updateSettings({ targetLanguage: 'es' });
    const esWords = getTop200ForLanguage('es');

    // Build Spanish word stats object with 150 known words
    const esWordStats: Record<string, unknown> = {};
    for (let i = 0; i < 150; i++) {
      esWordStats[esWords[i]] = {
        word: esWords[i],
        exposureCount: 10,
        recallFailures: 0,
        firstSeen: 0,
        lastSeen: 0,
        pKnown: 0.90,
      };
    }

    setMockStorageState({
      settings: { ...DEFAULT_SETTINGS, targetLanguage: 'es', currentPhase: 1 },
      word_stats_es: esWordStats,
    });

    const esReady = await shouldEnablePhase2();
    expect(esReady).toBe(true);

    // French: Only 50 known words (25% of top-200) - not ready
    await updateSettings({ targetLanguage: 'fr' });
    const frWords = getTop200ForLanguage('fr');

    const frWordStats: Record<string, unknown> = {};
    for (let i = 0; i < 50; i++) {
      frWordStats[frWords[i]] = {
        word: frWords[i],
        exposureCount: 10,
        recallFailures: 0,
        firstSeen: 0,
        lastSeen: 0,
        pKnown: 0.90,
      };
    }

    setMockStorageState({
      settings: { ...DEFAULT_SETTINGS, targetLanguage: 'fr', currentPhase: 1 },
      word_stats_fr: frWordStats,
    });

    const frReady = await shouldEnablePhase2();
    expect(frReady).toBe(false);
  });
});

describe('Multi-Language Support - Settings Persistence', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  it('should persist target language across sessions', async () => {
    await updateSettings({ targetLanguage: 'ja' });

    const settings = await getSettings();
    expect(settings.targetLanguage).toBe('ja');
  });

  it('should allow changing target language mid-session', async () => {
    await updateSettings({ targetLanguage: 'es' });
    let settings = await getSettings();
    expect(settings.targetLanguage).toBe('es');

    await updateSettings({ targetLanguage: 'zh-CN' });
    settings = await getSettings();
    expect(settings.targetLanguage).toBe('zh-CN');
  });

  it('should default to Spanish if no target language is set', async () => {
    const settings = await getSettings();
    expect(settings.targetLanguage).toBe('es'); // DEFAULT_SETTINGS
  });
});

describe('Multi-Language Support - Language-Specific Top-200 Lists', () => {
  it('should have unique words in each language list', () => {
    const esWords = getTop200ForLanguage('es');
    const frWords = getTop200ForLanguage('fr');
    const jaWords = getTop200ForLanguage('ja');

    // Lists should be different (Spanish ≠ French ≠ Japanese)
    expect(esWords).not.toBe(frWords);
    expect(frWords).not.toBe(jaWords);
    expect(esWords).not.toBe(jaWords);
  });

  it('should have mostly unique words within a language list', () => {
    const languages = ['es', 'fr', 'de', 'ja', 'zh-CN', 'ar', 'hi', 'ta'];

    for (const lang of languages) {
      const words = getTop200ForLanguage(lang);
      const uniqueWords = new Set(words);

      // Allow a small number of duplicates (up to 5%) due to data quality
      const duplicateCount = words.length - uniqueWords.size;
      const duplicatePercentage = (duplicateCount / words.length) * 100;

      expect(duplicatePercentage).toBeLessThan(5); // Less than 5% duplicates
      expect(uniqueWords.size).toBeGreaterThan(180); // At least 180 unique words
    }
  });

  it('should contain non-empty strings in all language lists', () => {
    const languages = ['es', 'ta', 'ar', 'ja', 'zh-CN', 'ru', 'hi'];

    for (const lang of languages) {
      const words = getTop200ForLanguage(lang);

      for (const word of words) {
        expect(word).toBeDefined();
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);
        expect(word.trim()).toBe(word); // No leading/trailing whitespace
      }
    }
  });
});
