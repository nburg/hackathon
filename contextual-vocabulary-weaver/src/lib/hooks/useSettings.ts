import { useState, useEffect } from 'react';
import { getSettings, saveSettings, StorageKeys } from '@/lib/storage/api';
import type { Settings } from '@/types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    getSettings()
      .then((data) => {
        setSettings(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings. Please refresh the page.');
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for changes
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync' && changes[StorageKeys.SETTINGS]) {
        setSettings(changes[StorageKeys.SETTINGS].newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      await saveSettings(updates);
      setError(null);
      // State will update via listener
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
      throw err; // Re-throw so caller can handle
    }
  };

  return { settings, loading, error, updateSettings };
}
