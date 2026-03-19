import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { useSettings } from '@/lib/hooks/useSettings';

export default function App() {
  const { settings, loading, updateSettings } = useSettings();

  if (loading || !settings) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p>Loading settings...</p>
    </div>;
  }

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
