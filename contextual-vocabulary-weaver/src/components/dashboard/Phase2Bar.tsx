const PHASE2_TARGET = 140; // 70% of 200 top common words

interface Phase2BarProps {
  top200Known: number;
}

export function Phase2Bar({ top200Known }: Phase2BarProps) {
  const pct = Math.min(Math.round((top200Known / PHASE2_TARGET) * 100), 100);
  const unlocked = top200Known >= PHASE2_TARGET;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-800">Phase 2 Unlock</h3>
        {unlocked && (
          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            Unlocked!
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-3">
        Master {PHASE2_TARGET} of 200 common words to unlock sentence-level translation
      </p>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            unlocked ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {top200Known} / {PHASE2_TARGET} common words mastered
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}
