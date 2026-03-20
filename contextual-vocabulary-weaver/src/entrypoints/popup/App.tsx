import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Spinner } from '@/components/ui/Spinner';
import { useSettings } from '@/lib/hooks/useSettings';
import { useVocabulary } from '@/lib/hooks/useVocabulary';

const LANGUAGE_LABELS: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ta: 'Tamil',
};

export default function App() {
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    updateSettings,
  } = useSettings();
  const { vocabulary, loading: vocabLoading, error: vocabError } = useVocabulary();
  const [togglingSite, setTogglingSite] = useState(false);
  const [currentHostname, setCurrentHostname] = useState<string | null>(null);

  // Resolve the active tab's hostname once settings are loaded.
  useState(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) {
        try {
          setCurrentHostname(new URL(tab.url).hostname);
        } catch {
          /* ignore */
        }
      }
    });
  });

  const openOptions = () => chrome.runtime.openOptionsPage();
  const openDashboard = () => chrome.tabs.create({ url: chrome.runtime.getURL('/dashboard.html') });
  const openSetup = () => chrome.tabs.create({ url: chrome.runtime.getURL('/setup.html') });

  const toggleThisSite = async () => {
    setTogglingSite(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || !tab.id) return;
      const hostname = new URL(tab.url).hostname;
      const current = settings!.disabledSites || [];
      const isDisabled = current.includes(hostname);
      const updated = isDisabled ? current.filter((h) => h !== hostname) : [...current, hostname];
      await updateSettings({ disabledSites: updated });
      await chrome.tabs.reload(tab.id);
    } catch {
      // ignore tab query errors (e.g. on chrome:// pages)
    } finally {
      setTogglingSite(false);
    }
  };

  // Loading state
  if (settingsLoading || vocabLoading) {
    return (
      <div className="w-80 p-8 flex flex-col items-center justify-center space-y-2">
        <Spinner size="medium" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Error state
  if (settingsError || vocabError) {
    return (
      <div className="w-80 p-4 space-y-3">
        <div className="text-center">
          <div className="text-red-500 text-3xl mb-2">⚠️</div>
          <p className="text-sm text-gray-600 mb-3">{settingsError || vocabError}</p>
          <Button fullWidth onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="w-80 p-4">
        <Spinner size="small" />
      </div>
    );
  }

  const wordsKnown = vocabulary.wordsKnown;
  const totalTracked = vocabulary.totalTracked;
  const progressPercent = totalTracked > 0 ? Math.round((wordsKnown / totalTracked) * 100) : 0;
  const languageLabel = LANGUAGE_LABELS[settings.language] ?? settings.language;
  const siteIsDisabled = currentHostname
    ? (settings.disabledSites || []).includes(currentHostname)
    : false;

  return (
    <div className="w-80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-blue-600">🌟 Vocabulary Weaver</h2>
          <p className="text-xs text-gray-500">Learn {languageLabel} passively!</p>
        </div>
        <Toggle
          enabled={settings.isEnabled}
          onChange={(enabled) => updateSettings({ isEnabled: enabled })}
          aria-label={settings.isEnabled ? 'Pause extension' : 'Enable extension'}
        />
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 space-y-1 border border-blue-200">
        <p className="text-sm text-gray-700 font-medium">Words Tracked</p>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-blue-600">{totalTracked}</p>
          {totalTracked > 0 && (
            <p className="text-sm text-gray-600 mb-1">
              {wordsKnown} mastered ({progressPercent}%)
            </p>
          )}
        </div>
      </div>

      {totalTracked === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3" role="status">
          <p className="text-xs text-yellow-800">
            💡 Start browsing to see words replaced with {languageLabel}!
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Button fullWidth onClick={openDashboard} aria-label="Open vocabulary dashboard">
          View Dashboard
        </Button>
        <Button
          fullWidth
          variant="secondary"
          onClick={toggleThisSite}
          disabled={togglingSite}
          aria-label={
            siteIsDisabled
              ? 'Re-enable extension on this website'
              : 'Disable extension on this website'
          }
        >
          {siteIsDisabled ? 'Re-enable on This Site' : 'Disable on This Site'}
        </Button>
        <Button fullWidth variant="secondary" onClick={openOptions} aria-label="Open settings">
          Settings
        </Button>
        {totalTracked === 0 && (
          <Button fullWidth variant="secondary" onClick={openSetup} aria-label="Open setup guide">
            Setup Guide
          </Button>
        )}
      </div>
    </div>
  );
}
