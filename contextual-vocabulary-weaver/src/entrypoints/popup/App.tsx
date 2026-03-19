import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useSettings } from '@/lib/hooks/useSettings';
import { useVocabulary } from '@/lib/hooks/useVocabulary';

export default function App() {
  const { settings, loading: settingsLoading, error: settingsError } = useSettings();
  const { vocabulary, loading: vocabLoading, error: vocabError } = useVocabulary();

  const openOptions = () => chrome.runtime.openOptionsPage();
  const openDashboard = () => chrome.tabs.create({ url: chrome.runtime.getURL('/dashboard.html') });

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
          <p className="text-sm text-gray-600 mb-3">
            {settingsError || vocabError}
          </p>
          <Button fullWidth size="small" onClick={() => window.location.reload()}>
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

  return (
    <div className="w-80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-blue-600">🌟 Vocabulary Weaver</h2>
          <p className="text-xs text-gray-500">Learn Spanish passively!</p>
        </div>
        <div className={`flex items-center gap-2`}>
          <span className="text-xs text-gray-500">
            {settings.isEnabled ? 'Active' : 'Paused'}
          </span>
          <div className={`w-3 h-3 rounded-full ${settings.isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            💡 Start browsing to see words replaced with Spanish!
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Button fullWidth onClick={openDashboard}>
          View Dashboard
        </Button>
        <Button fullWidth variant="secondary" onClick={openOptions}>
          Settings
        </Button>
      </div>
    </div>
  );
}
