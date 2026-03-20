import type { VocabularyWord } from '@/types';

const RADIUS = 52;
const CX = 70;
const CY = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2; // visual gap between segments

interface KnowledgeDonutProps {
  words: VocabularyWord[];
}

interface Segment {
  label: string;
  count: number;
  color: string;
  start: number;
  len: number;
}

export function KnowledgeDonut({ words }: KnowledgeDonutProps) {
  const total = words.length;
  const knownCount = words.filter((w) => w.pKnown >= 0.85).length;
  const learningCount = words.filter((w) => w.pKnown >= 0.3 && w.pKnown < 0.85).length;
  const newCount = words.filter((w) => w.pKnown < 0.3).length;

  const knownLen = total > 0 ? (knownCount / total) * CIRCUMFERENCE : 0;
  const learningLen = total > 0 ? (learningCount / total) * CIRCUMFERENCE : 0;
  const newLen = total > 0 ? (newCount / total) * CIRCUMFERENCE : 0;

  const segments: Segment[] = [
    { label: 'Known', count: knownCount, color: '#16a34a', start: 0, len: knownLen },
    {
      label: 'Learning',
      count: learningCount,
      color: '#ca8a04',
      start: knownLen,
      len: learningLen,
    },
    {
      label: 'New',
      count: newCount,
      color: '#6b7280',
      start: knownLen + learningLen,
      len: newLen,
    },
  ];

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-3">Knowledge Distribution</h3>
      <div className="flex items-center gap-6">
        <svg width="140" height="140" viewBox="0 0 140 140" className="flex-shrink-0">
          {total === 0 ? (
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="18" />
          ) : (
            segments.map(({ label, color, len, start }) =>
              len > GAP ? (
                <circle
                  key={label}
                  cx={CX}
                  cy={CY}
                  r={RADIUS}
                  fill="none"
                  stroke={color}
                  strokeWidth="18"
                  strokeDasharray={`${len - GAP} ${CIRCUMFERENCE - (len - GAP)}`}
                  strokeDashoffset={-start}
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              ) : null
            )
          )}
          <text x={CX} y={CY - 6} textAnchor="middle" fill="#111827" fontSize="18" fontWeight="700">
            {total}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fill="#6b7280" fontSize="11">
            words
          </text>
        </svg>

        <div className="space-y-3">
          {segments.map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600 w-16">{label}</span>
              <span className="text-sm font-semibold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
