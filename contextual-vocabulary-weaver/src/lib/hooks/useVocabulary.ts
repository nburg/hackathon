import { useState, useEffect } from 'react';
import { getVocabulary, StorageKeys } from '@/lib/storage/api';
import type { VocabularyData } from '@/types';

export function useVocabulary() {
  const [vocabulary, setVocabulary] = useState<VocabularyData>({
    words: {},
    totalTracked: 0,
    wordsKnown: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    getVocabulary()
      .then((data) => {
        setVocabulary(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load vocabulary:', err);
        setError('Failed to load vocabulary data. Please refresh the page.');
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for changes: word_stats_<lang> updates (P5) or language setting changes (P2)
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && Object.keys(changes).some((k) => k.startsWith('word_stats_'))) {
        getVocabulary().then(setVocabulary).catch(console.error);
      }
      if (areaName === 'sync' && changes[StorageKeys.SETTINGS]) {
        // Language may have changed — reload vocabulary for the new language
        getVocabulary().then(setVocabulary).catch(console.error);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return { vocabulary, loading, error };
}
