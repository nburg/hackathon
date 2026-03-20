interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  'aria-label'?: string;
}

export function Toggle({ enabled, onChange, label, 'aria-label': ariaLabel }: ToggleProps) {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={ariaLabel}
        />
        <div
          className={`block w-14 h-8 rounded-full transition ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
        ></div>
        <div
          className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${enabled ? 'translate-x-6' : ''}`}
        ></div>
      </div>
      {label && <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>}
    </label>
  );
}
