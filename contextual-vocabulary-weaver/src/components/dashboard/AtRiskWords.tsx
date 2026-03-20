import { Card } from '@/components/ui/Card';
import type { VocabularyWord } from '@/types';

interface AtRiskWordsProps {
  words: VocabularyWord[];
}

export function AtRiskWords({ words }: AtRiskWordsProps) {
  const now = Date.now();

  // A word is "at risk" if partially learned (pKnown > 0.35) but not seen recently.
  // Risk score = pKnown * daysSinceLastSeen: high score means learned but stale.
  const atRisk = words
    .filter((w) => w.pKnown > 0.35 && w.pKnown < 0.85)
    .map((w) => {
      const daysSince = (now - w.lastSeen) / (1000 * 60 * 60 * 24);
      return { ...w, daysSince, riskScore: w.pKnown * daysSince };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  if (atRisk.length === 0) return null;

  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-800 mb-1">Needs Review</h3>
      <p className="text-sm text-gray-500 mb-3">
        Partially learned words you haven't seen recently
      </p>
      <div className="divide-y divide-gray-100">
        {atRisk.map(({ word, translation, pKnown, daysSince }) => {
          const days = Math.round(daysSince);
          const lastSeenText = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`;
          return (
            <div key={word} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium text-gray-900">{word}</span>
                {translation && <span className="text-gray-500 text-sm ml-2">{translation}</span>}
              </div>
              <div className="flex items-center gap-3 text-sm flex-shrink-0">
                <span className="text-yellow-600 font-medium">
                  {Math.round(pKnown * 100)}% known
                </span>
                <span className="text-gray-400">{lastSeenText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
