import { useState, useEffect, useRef, useCallback } from 'react';
import { SUPPORTED_LANGUAGES } from '@/lib/storage/api';
import { useSettings } from '@/lib/hooks/useSettings';
import type { SupportedLanguage } from '@/types';

type Availability = 'checking' | 'available' | 'downloadable' | 'downloading' | 'unavailable';

interface LangState {
  availability: Availability;
}

interface ChromeTranslatorAPI {
  availability?: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<string>;
  canTranslate?: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<string>;
  create?: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<ChromeTranslator>;
  createTranslator?: (opts: {
    sourceLanguage: string;
    targetLanguage: string;
  }) => Promise<ChromeTranslator>;
}

interface ChromeTranslator {
  translate(text: string): Promise<string>;
}

type DetectedAPI = { api: ChromeTranslatorAPI; shape: 'new' | 'ai' | 'legacy' } | null;

function detectAPI(): DetectedAPI {
  const w = window as Window & {
    Translator?: ChromeTranslatorAPI;
    ai?: { translator?: ChromeTranslatorAPI };
    translation?: ChromeTranslatorAPI;
  };
  if (typeof w.Translator === 'function') return { api: w.Translator, shape: 'new' };
  if (w.ai?.translator) return { api: w.ai.translator, shape: 'ai' };
  if (w.translation) return { api: w.translation, shape: 'legacy' };
  return null;
}

async function getAvailability(detected: DetectedAPI, code: string): Promise<Availability> {
  if (!detected) return 'unavailable';
  if (detected.shape === 'legacy') {
    if (!detected.api.canTranslate) return 'unavailable';
    const r = await detected.api.canTranslate({ sourceLanguage: 'en', targetLanguage: code });
    return r === 'readily' ? 'available' : r === 'after-download' ? 'downloadable' : 'unavailable';
  }
  if (!detected.api.availability) return 'unavailable';
  const av = await detected.api.availability({ sourceLanguage: 'en', targetLanguage: code });
  return av as Availability;
}

async function createTranslator(detected: DetectedAPI, code: string): Promise<ChromeTranslator> {
  if (!detected) throw new Error('No API');
  if (detected.shape === 'legacy') {
    if (!detected.api.createTranslator) throw new Error('createTranslator not available');
    return detected.api.createTranslator({ sourceLanguage: 'en', targetLanguage: code });
  }
  if (!detected.api.create) throw new Error('create not available');
  return detected.api.create({ sourceLanguage: 'en', targetLanguage: code });
}

const SORT_PRIORITY: Record<string, number> = {
  available: 0,
  downloadable: 1,
  downloading: 2,
  checking: 3,
  unavailable: 4,
};

function chipClass(av: Availability): string {
  return (
    {
      checking: 'bg-blue-100 text-blue-600',
      available: 'bg-green-100 text-green-700',
      downloading: 'bg-purple-100 text-purple-700',
      downloadable: 'bg-orange-100 text-orange-600',
      unavailable: 'bg-orange-100 text-orange-600',
    }[av] ?? 'bg-gray-100 text-gray-500'
  );
}

function chipLabel(av: Availability): string {
  return (
    {
      checking: 'Checking…',
      available: 'Ready',
      downloading: 'Downloading…',
      downloadable: 'Not downloaded',
      unavailable: 'Unavailable',
    }[av] ?? 'Checking…'
  );
}

type TestResult = { text: string; state: 'pending' | 'ok' | 'error' };

export function LanguagesTab() {
  const { settings, updateSettings } = useSettings();
  const activeLang = settings?.language ?? 'es';

  const [langStates, setLangStates] = useState<Record<string, LangState>>(() => {
    const init: Record<string, LangState> = {};
    for (const l of SUPPORTED_LANGUAGES) init[l.code] = { availability: 'checking' };
    return init;
  });
  const [search, setSearch] = useState('');
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const translatorsRef = useRef<Record<string, ChromeTranslator>>({});
  const testDebounces = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const initialTestFired = useRef<Set<string>>(new Set());

  const runTest = useCallback(async (code: string, text: string) => {
    if (!text.trim()) {
      setTestResults((prev) => ({ ...prev, [code]: { text: '…', state: 'pending' } }));
      return;
    }
    setTestResults((prev) => ({ ...prev, [code]: { text: 'translating…', state: 'pending' } }));
    const detected = detectAPI();
    if (!detected) {
      setTestResults((prev) => ({ ...prev, [code]: { text: 'API unavailable', state: 'error' } }));
      return;
    }
    try {
      let t = translatorsRef.current[code];
      if (!t) {
        t = await createTranslator(detected, code);
        translatorsRef.current[code] = t;
      }
      const result = await t.translate(text);
      setTestResults((prev) => ({ ...prev, [code]: { text: result, state: 'ok' } }));
    } catch (e) {
      setTestResults((prev) => ({
        ...prev,
        [code]: { text: 'Error: ' + (e instanceof Error ? e.message : String(e)), state: 'error' },
      }));
    }
  }, []);

  const runChecks = useCallback(async () => {
    const detected = detectAPI();
    await Promise.all(
      SUPPORTED_LANGUAGES.map(async ({ code }) => {
        try {
          const av = await getAvailability(detected, code);
          if (av === 'available' && !translatorsRef.current[code]) {
            try {
              translatorsRef.current[code] = await createTranslator(detected, code);
            } catch {}
          }
          setLangStates((prev) => {
            if (prev[code]?.availability === av) return prev;
            return { ...prev, [code]: { availability: av } };
          });
        } catch {
          setLangStates((prev) => ({ ...prev, [code]: { availability: 'unavailable' } }));
        }
      })
    );
  }, []);

  useEffect(() => {
    runChecks();
    const id = setInterval(runChecks, 3000);
    return () => clearInterval(id);
  }, [runChecks]);

  // Fire initial test for newly available languages
  useEffect(() => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      if (langStates[code]?.availability === 'available' && !initialTestFired.current.has(code)) {
        initialTestFired.current.add(code);
        runTest(code, testInputs[code] ?? 'Hello');
      }
    }
  }, [langStates, runTest, testInputs]);

  const handleDownload = useCallback(
    async (code: string) => {
      const av = langStates[code]?.availability;
      const detected = detectAPI();
      if (av === 'downloadable' && detected) {
        setLangStates((prev) => ({ ...prev, [code]: { availability: 'downloading' } }));
        try {
          await createTranslator(detected, code);
        } catch {
          setLangStates((prev) => ({ ...prev, [code]: { availability: 'unavailable' } }));
        }
      } else {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: 'chrome://on-device-translation-internals/' });
        }
      }
    },
    [langStates]
  );

  const handleTestInput = useCallback(
    (code: string, value: string) => {
      setTestInputs((prev) => ({ ...prev, [code]: value }));
      clearTimeout(testDebounces.current[code]);
      testDebounces.current[code] = setTimeout(() => runTest(code, value), 400);
    },
    [runTest]
  );

  const filtered = SUPPORTED_LANGUAGES.filter(({ code, label }) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return label.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  }).sort((a, b) => {
    if (a.code === activeLang) return -1;
    if (b.code === activeLang) return 1;
    const pA = SORT_PRIORITY[langStates[a.code]?.availability] ?? 3;
    const pB = SORT_PRIORITY[langStates[b.code]?.availability] ?? 3;
    if (pA !== pB) return pA - pB;
    return a.label.localeCompare(b.label);
  });

  const availableLangs = SUPPORTED_LANGUAGES.filter(
    (l) => langStates[l.code]?.availability === 'available'
  );

  return (
    <div className="space-y-6">
      {/* Language model downloads */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Download Language Models</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select languages to learn. Chrome downloads each translation model (~50 MB each).
        </p>

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search languages…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-400"
          />
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 italic py-2">No languages match your search.</p>
        )}

        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
          {filtered.map(({ code, label, flag }) => {
            const av = langStates[code]?.availability ?? 'checking';
            const isDownloading = av === 'downloading';
            const showDownloadBtn = av === 'downloadable';
            const showOpenBtn = av === 'unavailable' || av === 'checking';
            return (
              <div
                key={code}
                className={`flex flex-col rounded-lg border px-4 py-3 transition-colors ${
                  isDownloading ? 'border-purple-200 bg-purple-50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl">{flag}</span>
                    <span className="font-medium text-gray-800 text-sm">{label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${chipClass(av)}`}
                    >
                      {chipLabel(av)}
                    </span>
                  </div>
                  {av === 'available' &&
                    (code === activeLang ? (
                      <span className="flex-shrink-0 text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg">
                        ✓ Active
                      </span>
                    ) : (
                      <button
                        onClick={() => updateSettings({ language: code as SupportedLanguage })}
                        className="flex-shrink-0 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Set Active
                      </button>
                    ))}
                  {showDownloadBtn && (
                    <button
                      onClick={() => handleDownload(code)}
                      className="flex-shrink-0 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Download
                    </button>
                  )}
                  {showOpenBtn && (
                    <button
                      onClick={() => handleDownload(code)}
                      className="flex-shrink-0 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Open Chrome page
                    </button>
                  )}
                </div>
                {isDownloading && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{
                          width: '40%',
                          animation: 'cvw-slide 1.4s ease-in-out infinite',
                        }}
                      />
                    </div>
                    <p className="text-xs text-purple-500 mt-1">
                      Downloading translation model — this may take a minute…
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-blue-600 select-all truncate">
            chrome://on-device-translation-internals/
          </code>
          <button
            onClick={() =>
              navigator.clipboard.writeText('chrome://on-device-translation-internals/')
            }
            className="flex-shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 px-2 py-1.5 rounded transition-colors"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Open the link above to manage model downloads directly in Chrome.
        </p>
      </div>

      {/* Live translation test */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Live Translation Test</h2>
        <p className="text-sm text-gray-500 mb-4">Test each downloaded language model below.</p>

        {availableLangs.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No models downloaded yet — download a language above first.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {availableLangs.map(({ code, label, flag }) => {
              const inputVal = testInputs[code] ?? 'Hello';
              const result = testResults[code];
              return (
                <div
                  key={code}
                  className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5"
                >
                  <span className="text-lg">{flag}</span>
                  <span className="text-sm text-gray-500 w-24 flex-shrink-0 truncate">{label}</span>
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => handleTestInput(code, e.target.value)}
                    placeholder="Type English…"
                    className="flex-1 min-w-0 text-sm border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-gray-300 text-sm flex-shrink-0">→</span>
                  <span
                    className={`flex-1 min-w-0 text-sm font-medium break-words ${
                      !result || result.state === 'pending'
                        ? 'text-gray-400 italic'
                        : result.state === 'error'
                          ? 'text-red-500'
                          : 'text-green-600'
                    }`}
                  >
                    {result?.text ?? 'translating…'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes cvw-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
