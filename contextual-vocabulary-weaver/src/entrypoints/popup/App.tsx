import { Button } from '@/components/ui/Button';
import { useSettings } from '@/lib/hooks/useSettings';
import { useVocabulary } from '@/lib/hooks/useVocabulary';

export default function App() {
  const { settings, updateSettings } = useSettings();
  const { vocabulary } = useVocabulary();

  const openOptions = () => chrome.runtime.openOptionsPage();
  const openDashboard = () => chrome.tabs.create({ url: chrome.runtime.getURL('/dashboard.html') });

  if (!settings) return <div className="p-4">Loading...</div>;

  return (
    <div className="w-80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-blue-600">🌟 Vocabulary Weaver</h2>
          <p className="text-xs text-gray-500">Learn Spanish passively!</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${settings.isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 space-y-1 border border-blue-200">
        <p className="text-sm text-gray-700 font-medium">Words Tracked</p>
        <p className="text-3xl font-bold text-blue-600">{vocabulary.totalTracked}</p>
      </div>

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
