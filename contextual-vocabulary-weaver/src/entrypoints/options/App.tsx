import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { useSettings } from '@/lib/hooks/useSettings';

export default function App() {
  const { settings, loading, updateSettings } = useSettings();
  const [newPattern, setNewPattern] = useState('');
  const [patternError, setPatternError] = useState('');

  if (loading || !settings) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p>Loading settings...</p>
    </div>;
  }

  const addPattern = () => {
    const trimmed = newPattern.trim();
    if (!trimmed) return;
    try {
      new RegExp(trimmed);
    } catch {
      setPatternError('Invalid regex pattern');
      return;
    }
    const current = settings!.siteRegexPatterns || [];
    if (current.includes(trimmed)) {
      setPatternError('Pattern already exists');
      return;
    }
    updateSettings({ siteRegexPatterns: [...current, trimmed] });
    setNewPattern('');
    setPatternError('');
  };

  const removePattern = (pattern: string) => {
    const current = settings!.siteRegexPatterns || [];
    updateSettings({ siteRegexPatterns: current.filter(p => p !== pattern) });
  };

  const densityLabels = ['Beginner', 'Intermediate', 'Aggressive'];
  const getDensityLabel = (val: number) => {
    if (val <= 3) return densityLabels[0];
    if (val <= 7) return densityLabels[1];
    return densityLabels[2];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Contextual Vocabulary Weaver - Settings
        </h1>

        <div className="space-y-6">
          {/* Global Toggle */}
          <Card title="Extension Status">
            <Toggle
              enabled={settings.isEnabled}
              onChange={(enabled) => updateSettings({ isEnabled: enabled })}
              label="Enable vocabulary replacement"
            />
          </Card>

          {/* Language Selection */}
          <Card title="Target Language">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select language to learn
              </label>
              <select
                value={settings.language}
                disabled
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="es">🇪🇸 Spanish (Active)</option>
                <option disabled>🇫🇷 French (Coming Soon)</option>
                <option disabled>🇩🇪 German (Coming Soon)</option>
              </select>
              <p className="text-xs text-gray-500 italic">
                POC locked to Spanish. Additional languages coming soon!
              </p>
            </div>
          </Card>

          {/* Density Slider */}
          <Card title="Word Replacement Density">
            <Slider
              label={`Replacement Rate (${getDensityLabel(settings.density)})`}
              value={settings.density}
              onValueChange={(value) => updateSettings({ density: value })}
              min={1}
              max={10}
              helperText="1% = Few words for beginners | 10% = Many words for advanced learners"
            />
          </Card>

          {/* Site Filter (Regex Patterns) */}
          <Card title="Site Filter (Regex Patterns)">
            <p className="text-sm text-gray-600 mb-3">
              If any patterns are added, only URLs matching at least one will be altered.
              Leave empty to apply to all sites.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPattern}
                onChange={(e) => { setNewPattern(e.target.value); setPatternError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && addPattern()}
                placeholder="e.g. .*\.wikipedia\.org.*"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="primary" onClick={addPattern}>Add</Button>
            </div>
            {patternError && (
              <p className="text-xs text-red-500 mb-2">{patternError}</p>
            )}
            {(settings.siteRegexPatterns || []).length === 0 ? (
              <p className="text-xs text-gray-400 italic">No patterns — extension runs on all sites.</p>
            ) : (
              <ul className="space-y-1">
                {settings.siteRegexPatterns.map((pattern) => (
                  <li key={pattern} className="flex items-center justify-between bg-gray-100 rounded px-3 py-1.5">
                    <code className="text-sm text-gray-800 break-all">{pattern}</code>
                    <button
                      onClick={() => removePattern(pattern)}
                      className="ml-3 text-red-500 hover:text-red-700 text-xs font-medium shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Save Button (optional - settings auto-save) */}
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => alert('Settings saved automatically!')}>
              Settings Auto-Saved ✓
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
