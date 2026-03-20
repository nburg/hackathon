import { useState } from 'react';
import type { Settings } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useSettings } from '@/lib/hooks/useSettings';

export default function App() {
  const { settings, loading, error, updateSettings } = useSettings();
  const [newPattern, setNewPattern] = useState('');
  const [patternError, setPatternError] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <LoadingScreen message="Loading settings..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Settings</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button fullWidth onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return <LoadingScreen message="Initializing..." />;
  }

  const handleUpdate = async (updates: Partial<Settings>) => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await updateSettings(updates);
      setSaveMessage('✓ Saved successfully');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch {
      setSaveMessage('❌ Failed to save');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

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
    updateSettings({ siteRegexPatterns: current.filter((p) => p !== pattern) });
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Contextual Vocabulary Weaver - Settings
          </h1>
          {saveMessage && (
            <div
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                saveMessage.includes('✓')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {saveMessage}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Global Toggle */}
          <Card title="Extension Status">
            <Toggle
              enabled={settings.isEnabled}
              onChange={(enabled) => handleUpdate({ isEnabled: enabled })}
              label="Enable vocabulary replacement"
            />
            {saving && <p className="text-sm text-gray-500 mt-2">Saving...</p>}
          </Card>

          {/* Density Slider */}
          <Card title="Word Replacement Density">
            <Slider
              label={`Replacement Rate — ${settings.density}% of words replaced (${getDensityLabel(settings.density)})`}
              value={settings.density}
              onValueChange={(value) => handleUpdate({ density: value })}
              min={1}
              max={10}
              helperText={`${settings.density}% of content words on each page will be swapped into ${settings.language === 'es' ? 'Spanish' : settings.language}`}
              disabled={saving}
            />
          </Card>

          {/* Site Filter (Regex Patterns) */}
          <Card title="Site Filter (Regex Patterns)">
            <p className="text-sm text-gray-600 mb-3">
              If any patterns are added, only URLs matching at least one will be altered. Leave
              empty to apply to all sites.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPattern}
                onChange={(e) => {
                  setNewPattern(e.target.value);
                  setPatternError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && addPattern()}
                placeholder="e.g. .*\.wikipedia\.org.*"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="primary" onClick={addPattern}>
                Add
              </Button>
            </div>
            {patternError && <p className="text-xs text-red-500 mb-2">{patternError}</p>}
            {(settings.siteRegexPatterns || []).length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No patterns — extension runs on all sites.
              </p>
            ) : (
              <ul className="space-y-1">
                {settings.siteRegexPatterns.map((pattern) => (
                  <li
                    key={pattern}
                    className="flex items-center justify-between bg-gray-100 rounded px-3 py-1.5"
                  >
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

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Auto-save enabled:</strong> Your settings are saved automatically as you
              change them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
