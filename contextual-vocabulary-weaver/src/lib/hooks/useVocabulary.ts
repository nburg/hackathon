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

    // Listen for changes (P5 will update this)
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[StorageKeys.VOCABULARY]) {
        // Transform the data properly when it updates
        getVocabulary().then(setVocabulary).catch(console.error);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return { vocabulary, loading, error };
}
