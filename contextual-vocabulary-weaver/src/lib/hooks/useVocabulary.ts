import { useState, useEffect } from 'react';
import { getVocabulary, StorageKeys } from '@/lib/storage/api';
import type { VocabularyData } from '@/types';

export function useVocabulary() {
  const [vocabulary, setVocabulary] = useState<VocabularyData>({
    words: {},
    totalTracked: 0,
    wordsKnown: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    getVocabulary().then(data => {
      setVocabulary(data);
      setLoading(false);
    });

    // Listen for changes (P5 will update this)
    const listener = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes[StorageKeys.VOCABULARY]) {
        setVocabulary(changes[StorageKeys.VOCABULARY].newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return { vocabulary, loading };
}
