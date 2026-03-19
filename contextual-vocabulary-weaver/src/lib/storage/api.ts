import type { Settings, VocabularyData } from '@/types';

export const StorageKeys = {
  SETTINGS: 'cvw_settings',
  VOCABULARY: 'cvw_vocabulary',
} as const;

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(StorageKeys.SETTINGS);
  return result[StorageKeys.SETTINGS] || getDefaultSettings();
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.sync.set({
    [StorageKeys.SETTINGS]: { ...current, ...settings }
  });
}

export async function getVocabulary(): Promise<VocabularyData> {
  const result = await chrome.storage.local.get(StorageKeys.VOCABULARY);
  return result[StorageKeys.VOCABULARY] || {
    words: {},
    totalTracked: 0,
    wordsKnown: 0
  };
}

function getDefaultSettings(): Settings {
  return {
    language: 'es',
    density: 5, // 5% default
    enabledSites: [],
    isEnabled: true,
    siteRegexPatterns: [],
  };
}
