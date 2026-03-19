import { useState, useEffect } from 'react';
import { getSettings, saveSettings, StorageKeys } from '@/lib/storage/api';
import type { Settings } from '@/types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    getSettings().then(data => {
      setSettings(data);
      setLoading(false);
    });

    // Listen for changes
    const listener = (changes: any, areaName: string) => {
      if (areaName === 'sync' && changes[StorageKeys.SETTINGS]) {
        setSettings(changes[StorageKeys.SETTINGS].newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const updateSettings = async (updates: Partial<Settings>) => {
    await saveSettings(updates);
    // State will update via listener
  };

  return { settings, loading, updateSettings };
}
