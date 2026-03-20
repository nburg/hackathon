import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { KnowledgeDonut } from '@/components/dashboard/KnowledgeDonut';
import { Phase2Bar } from '@/components/dashboard/Phase2Bar';
import { StatsStrip } from '@/components/dashboard/StatsStrip';
import { AtRiskWords } from '@/components/dashboard/AtRiskWords';
import { WordCard } from '@/components/dashboard/WordCard';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useVocabulary } from '@/lib/hooks/useVocabulary';
import { useSettings } from '@/lib/hooks/useSettings';
import { SUPPORTED_LANGUAGES } from '@/lib/storage/api';
import { getTop200ForLanguage } from '@lib/constants';
import { LanguagesTab } from './LanguagesTab';

type Tab = 'progress' | 'languages';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('progress');
  const { vocabulary, loading, error } = useVocabulary();
  const { settings, updateSettings } = useSettings();

  const langName =
    SUPPORTED_LANGUAGES.find((l) => l.code === settings?.language)?.label ?? 'your language';

  if (loading) {
    return <LoadingScreen message="Loading your vocabulary..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Vocabulary</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button fullWidth onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const wordsList = Object.values(vocabulary.words).sort((a, b) => b.lastSeen - a.lastSeen);

  const top200 = getTop200ForLanguage(settings?.language ?? 'es');
  const top200Known = top200.filter((w) => {
    const vocab = vocabulary.words[w];
    return vocab && vocab.pKnown >= 0.85;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Vocabulary Progress</h1>
          <p className="text-gray-600">
            Track your {langName} learning journey as you browse the web
          </p>
        </div>

        {/* Tab bar with proper ARIA */}
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="flex gap-1 mb-6 border-b border-gray-200"
        >
          {(
            [
              { id: 'progress', label: 'Progress' },
              { id: 'languages', label: 'Languages' },
            ] as { id: Tab; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`${id}-panel`}
              id={`${id}-tab`}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === id
                  ? 'bg-white border border-b-white border-gray-200 text-blue-600'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <main id="main-content">
          {activeTab === 'languages' && (
            <div role="tabpanel" id="languages-panel" aria-labelledby="languages-tab">
              <LanguagesTab />
            </div>
          )}

          {activeTab === 'progress' && (
            <div role="tabpanel" id="progress-panel" aria-labelledby="progress-tab">
              {wordsList.length === 0 ? (
                <Card>
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📖</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No words tracked yet
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Start browsing websites to see {langName} words replace English ones. Each
                      word you encounter will appear here with your learning progress!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => chrome.runtime.openOptionsPage()}>
                        Configure Settings
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => window.open('https://www.bbc.com/news', '_blank')}
                      >
                        Try a Website
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Immersion Mode toggle */}
                  <Card title="Immersion Mode">
                    <div className="flex items-start gap-4">
                      <Toggle
                        enabled={settings?.immersionMode ?? false}
                        onChange={(enabled) => updateSettings({ immersionMode: enabled })}
                        label="Always replace mastered words"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Mastered words are always translated on every page, so advanced learners
                      gradually see entire pages in their target language.
                    </p>
                  </Card>

                  {/* Stats strip */}
                  <StatsStrip words={wordsList} />

                  {/* Knowledge distribution + Phase 2 unlock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <KnowledgeDonut words={wordsList} />
                    </Card>
                    <Card>
                      <Phase2Bar top200Known={top200Known} />
                    </Card>
                  </div>

                  {/* At-risk words (only rendered if there are any) */}
                  <AtRiskWords words={wordsList} />

                  {/* Full word list */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Recent Words ({wordsList.length})
                      </h2>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-600">Sorted by most recently seen</p>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Reset all ${langName} word progress? This cannot be undone.`
                              )
                            ) {
                              chrome.storage.local.remove(
                                `word_stats_${settings?.language ?? 'es'}`
                              );
                            }
                          }}
                        >
                          Reset Progress
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wordsList.map((word) => (
                        <WordCard key={word.word} word={word} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
