import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressIndicator } from '@/components/dashboard/ProgressIndicator';
import { WordCard } from '@/components/dashboard/WordCard';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useVocabulary } from '@/lib/hooks/useVocabulary';
import { useSettings } from '@/lib/hooks/useSettings';

const LANGUAGE_NAMES: Record<string, string> = { es: 'Spanish', ta: 'Tamil' };

export default function App() {
  const { vocabulary, loading, error } = useVocabulary();
  const { settings } = useSettings();
  const langName = LANGUAGE_NAMES[settings?.language ?? 'es'] ?? 'your language';

  if (loading) {
    return <LoadingScreen message="Loading your vocabulary..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Vocabulary</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button fullWidth onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const wordsList = Object.values(vocabulary.words).sort((a, b) => b.lastSeen - a.lastSeen);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Vocabulary Progress</h1>
          <p className="text-gray-600">Track your {langName} learning journey as you browse the web</p>
        </div>

        <Card className="mb-8">
          <ProgressIndicator current={vocabulary.wordsKnown} total={vocabulary.totalTracked} />
        </Card>

        {wordsList.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No words tracked yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start browsing websites to see {langName} words replace English ones. Each word you
                encounter will appear here with your learning progress!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => chrome.runtime.openOptionsPage()}>Configure Settings</Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open('https://www.bbc.com/news', '_blank')}
                >
                  Try a Website
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                Recent Words ({wordsList.length})
              </h2>
              <p className="text-sm text-gray-500">Sorted by most recently seen</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wordsList.map((word) => (
                <WordCard key={word.word} word={word} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
