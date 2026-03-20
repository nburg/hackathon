import type { VocabularyWord } from '@/types';

interface StatsStripProps {
  words: VocabularyWord[];
}

export function StatsStrip({ words }: StatsStripProps) {
  const totalExposures = words.reduce((sum, w) => sum + w.exposureCount, 0);
  const totalFailures = words.reduce((sum, w) => sum + w.recallFailures, 0);
  const avgPKnown =
    words.length > 0 ? words.reduce((sum, w) => sum + w.pKnown, 0) / words.length : 0;
  const hoverRate = totalExposures > 0 ? totalFailures / totalExposures : 0;

  const stats = [
    { label: 'Words Tracked', value: words.length.toString() },
    { label: 'Total Exposures', value: totalExposures.toLocaleString() },
    { label: 'Avg. Confidence', value: `${Math.round(avgPKnown * 100)}%` },
    { label: 'Hover Rate', value: `${Math.round(hoverRate * 100)}%` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map(({ label, value }) => (
        <div key={label} className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
