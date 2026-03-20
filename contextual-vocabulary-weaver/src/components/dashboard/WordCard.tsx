import type { VocabularyWord } from '@/types';

interface WordCardProps {
  word: VocabularyWord;
}

export function WordCard({ word }: WordCardProps) {
  const lastSeenDate = new Date(word.lastSeen);
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24));

  const lastSeenText =
    daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

  const confidenceColor =
    word.pKnown > 0.7 ? 'text-green-600' : word.pKnown > 0.4 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{word.word}</h3>
          <p className="text-sm text-gray-600">{word.translation}</p>
        </div>
        <span className={`text-sm font-medium ${confidenceColor}`}>
          {Math.round(word.pKnown * 100)}% known
        </span>
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>Seen {word.exposureCount} times</span>
        <span>Last: {lastSeenText}</span>
      </div>
    </div>
  );
}
