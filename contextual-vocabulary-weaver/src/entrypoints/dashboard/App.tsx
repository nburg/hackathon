import { Card } from '@/components/ui/Card';
import { ProgressIndicator } from '@/components/dashboard/ProgressIndicator';
import { WordCard } from '@/components/dashboard/WordCard';
import { useVocabulary } from '@/lib/hooks/useVocabulary';

export default function App() {
  const { vocabulary, loading } = useVocabulary();

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p>Loading vocabulary...</p>
    </div>;
  }

  const wordsList = Object.values(vocabulary.words).sort(
    (a, b) => b.lastSeen - a.lastSeen
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Your Vocabulary Progress
        </h1>

        <Card className="mb-8">
          <ProgressIndicator
            current={vocabulary.wordsKnown}
            total={vocabulary.totalTracked}
          />
        </Card>

        {wordsList.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No words tracked yet! Start browsing to build your vocabulary.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Words ({wordsList.length})
            </h2>
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
