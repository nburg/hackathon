import type { Settings, VocabularyData } from '@/types';
import type { WordStats } from '@lib/types';

export const StorageKeys = {
  SETTINGS: 'cvw_settings',
  // Read vocabulary from P5's key — the SRS engine writes here.
  VOCABULARY: 'word_stats',
} as const;

const KNOWN_THRESHOLD = 0.85;

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(StorageKeys.SETTINGS);
  return (result[StorageKeys.SETTINGS] as Settings) || getDefaultSettings();
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.sync.set({
    [StorageKeys.SETTINGS]: { ...current, ...settings },
  });
}

export async function getVocabulary(): Promise<VocabularyData> {
  const result = await chrome.storage.local.get(StorageKeys.VOCABULARY);
  const wordStats = (result[StorageKeys.VOCABULARY] as Record<string, WordStats>) || {};
  return transformWordStats(wordStats);
}

function transformWordStats(wordStats: Record<string, WordStats>): VocabularyData {
  const words = Object.fromEntries(
    Object.entries(wordStats).map(([key, s]) => [
      key,
      {
        word: s.word,
        translation: '', // P5 doesn't store the translation; shown blank in dashboard
        exposureCount: s.exposureCount,
        lastSeen: s.lastSeen,
        recallFailures: s.recallFailures,
        pKnown: s.pKnown,
      },
    ])
  );
  const statsArray = Object.values(wordStats);
  return {
    words,
    totalTracked: statsArray.length,
    wordsKnown: statsArray.filter((s) => s.pKnown >= KNOWN_THRESHOLD).length,
  };
}

function getDefaultSettings(): Settings {
  return {
    language: 'es' as const,
    density: 5, // 5% default
    enabledSites: [],
    isEnabled: true,
    siteRegexPatterns: [],
  };
}
