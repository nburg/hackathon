import type { Settings, SupportedLanguage, VocabularyData } from '@/types';
import type { WordStats } from '@lib/types';

export const StorageKeys = {
  SETTINGS: 'cvw_settings',
  // Read vocabulary from P5's key — the SRS engine writes here.
  VOCABULARY: 'word_stats',
} as const;

export const SUPPORTED_LANGUAGES: Array<{ code: SupportedLanguage; label: string; flag: string }> =
  [
    { code: 'af',    label: 'Afrikaans',            flag: '🇿🇦' },
    { code: 'sq',    label: 'Albanian',              flag: '🇦🇱' },
    { code: 'am',    label: 'Amharic',               flag: '🇪🇹' },
    { code: 'ar',    label: 'Arabic',                flag: '🇸🇦' },
    { code: 'az',    label: 'Azerbaijani',           flag: '🇦🇿' },
    { code: 'eu',    label: 'Basque',                flag: '🇪🇸' },
    { code: 'be',    label: 'Belarusian',            flag: '🇧🇾' },
    { code: 'bn',    label: 'Bengali',               flag: '🇧🇩' },
    { code: 'bs',    label: 'Bosnian',               flag: '🇧🇦' },
    { code: 'bg',    label: 'Bulgarian',             flag: '🇧🇬' },
    { code: 'my',    label: 'Burmese',               flag: '🇲🇲' },
    { code: 'ca',    label: 'Catalan',               flag: '🇪🇸' },
    { code: 'zh-CN', label: 'Chinese (Simplified)',  flag: '🇨🇳' },
    { code: 'zh-TW', label: 'Chinese (Traditional)', flag: '🇹🇼' },
    { code: 'hr',    label: 'Croatian',              flag: '🇭🇷' },
    { code: 'cs',    label: 'Czech',                 flag: '🇨🇿' },
    { code: 'da',    label: 'Danish',                flag: '🇩🇰' },
    { code: 'nl',    label: 'Dutch',                 flag: '🇳🇱' },
    { code: 'et',    label: 'Estonian',              flag: '🇪🇪' },
    { code: 'fil',   label: 'Filipino',              flag: '🇵🇭' },
    { code: 'fi',    label: 'Finnish',               flag: '🇫🇮' },
    { code: 'fr',    label: 'French',                flag: '🇫🇷' },
    { code: 'fy',    label: 'Frisian',               flag: '🇳🇱' },
    { code: 'gl',    label: 'Galician',              flag: '🇪🇸' },
    { code: 'ka',    label: 'Georgian',              flag: '🇬🇪' },
    { code: 'de',    label: 'German',                flag: '🇩🇪' },
    { code: 'el',    label: 'Greek',                 flag: '🇬🇷' },
    { code: 'gu',    label: 'Gujarati',              flag: '🇮🇳' },
    { code: 'ha',    label: 'Hausa',                 flag: '🇳🇬' },
    { code: 'he',    label: 'Hebrew',                flag: '🇮🇱' },
    { code: 'hi',    label: 'Hindi',                 flag: '🇮🇳' },
    { code: 'hu',    label: 'Hungarian',             flag: '🇭🇺' },
    { code: 'is',    label: 'Icelandic',             flag: '🇮🇸' },
    { code: 'ig',    label: 'Igbo',                  flag: '🇳🇬' },
    { code: 'id',    label: 'Indonesian',            flag: '🇮🇩' },
    { code: 'ga',    label: 'Irish',                 flag: '🇮🇪' },
    { code: 'it',    label: 'Italian',               flag: '🇮🇹' },
    { code: 'ja',    label: 'Japanese',              flag: '🇯🇵' },
    { code: 'kn',    label: 'Kannada',               flag: '🇮🇳' },
    { code: 'km',    label: 'Khmer',                 flag: '🇰🇭' },
    { code: 'ko',    label: 'Korean',                flag: '🇰🇷' },
    { code: 'ky',    label: 'Kyrgyz',                flag: '🇰🇬' },
    { code: 'lo',    label: 'Lao',                   flag: '🇱🇦' },
    { code: 'lv',    label: 'Latvian',               flag: '🇱🇻' },
    { code: 'ln',    label: 'Lingala',               flag: '🇨🇩' },
    { code: 'lt',    label: 'Lithuanian',            flag: '🇱🇹' },
    { code: 'lb',    label: 'Luxembourgish',         flag: '🇱🇺' },
    { code: 'mk',    label: 'Macedonian',            flag: '🇲🇰' },
    { code: 'ms',    label: 'Malay',                 flag: '🇲🇾' },
    { code: 'ml',    label: 'Malayalam',             flag: '🇮🇳' },
    { code: 'mt',    label: 'Maltese',               flag: '🇲🇹' },
    { code: 'mr',    label: 'Marathi',               flag: '🇮🇳' },
    { code: 'mn',    label: 'Mongolian',             flag: '🇲🇳' },
    { code: 'ne',    label: 'Nepali',                flag: '🇳🇵' },
    { code: 'no',    label: 'Norwegian',             flag: '🇳🇴' },
    { code: 'or',    label: 'Odia',                  flag: '🇮🇳' },
    { code: 'fa',    label: 'Persian',               flag: '🇮🇷' },
    { code: 'pl',    label: 'Polish',                flag: '🇵🇱' },
    { code: 'pt',    label: 'Portuguese',            flag: '🇵🇹' },
    { code: 'pa',    label: 'Punjabi',               flag: '🇮🇳' },
    { code: 'ro',    label: 'Romanian',              flag: '🇷🇴' },
    { code: 'ru',    label: 'Russian',               flag: '🇷🇺' },
    { code: 'gd',    label: 'Scots Gaelic',          flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
    { code: 'sr',    label: 'Serbian',               flag: '🇷🇸' },
    { code: 'sk',    label: 'Slovak',                flag: '🇸🇰' },
    { code: 'sl',    label: 'Slovenian',             flag: '🇸🇮' },
    { code: 'so',    label: 'Somali',                flag: '🇸🇴' },
    { code: 'es',    label: 'Spanish',               flag: '🇪🇸' },
    { code: 'sw',    label: 'Swahili',               flag: '🇰🇪' },
    { code: 'sv',    label: 'Swedish',               flag: '🇸🇪' },
    { code: 'tl',    label: 'Tagalog',               flag: '🇵🇭' },
    { code: 'tg',    label: 'Tajik',                 flag: '🇹🇯' },
    { code: 'ta',    label: 'Tamil',                 flag: '🇮🇳' },
    { code: 'te',    label: 'Telugu',                flag: '🇮🇳' },
    { code: 'th',    label: 'Thai',                  flag: '🇹🇭' },
    { code: 'tr',    label: 'Turkish',               flag: '🇹🇷' },
    { code: 'uk',    label: 'Ukrainian',             flag: '🇺🇦' },
    { code: 'ur',    label: 'Urdu',                  flag: '🇵🇰' },
    { code: 'uz',    label: 'Uzbek',                 flag: '🇺🇿' },
    { code: 'vi',    label: 'Vietnamese',            flag: '🇻🇳' },
    { code: 'cy',    label: 'Welsh',                 flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
    { code: 'zu',    label: 'Zulu',                  flag: '🇿🇦' },
  ];

const KNOWN_THRESHOLD = 0.85;

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(StorageKeys.SETTINGS);
  return (result[StorageKeys.SETTINGS] as Settings) || getDefaultSettings();
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.sync.set({
    [StorageKeys.SETTINGS]: { ...current, ...settings },
  });
  // Bridge: mirror language change into the P5 schema so background.ts reads it
  if (settings.language !== undefined) {
    const p5Result = await chrome.storage.local.get('settings');
    const p5Current = (p5Result['settings'] as Record<string, unknown>) ?? {};
    await chrome.storage.local.set({ settings: { ...p5Current, targetLanguage: settings.language } });
  }
}

export async function getVocabulary(): Promise<VocabularyData> {
  const result = await chrome.storage.local.get(StorageKeys.VOCABULARY);
  const wordStats = (result[StorageKeys.VOCABULARY] as Record<string, WordStats>) || {};
  return transformWordStats(wordStats);
}

function transformWordStats(wordStats: Record<string, WordStats>): VocabularyData {
  const words = Object.fromEntries(
    Object.entries(wordStats).map(([key, s]) => [
      key,
      {
        word: s.word,
        translation: s.translation ?? '',
        exposureCount: s.exposureCount,
        lastSeen: s.lastSeen,
        recallFailures: s.recallFailures,
        pKnown: s.pKnown,
      },
    ])
  );
  const statsArray = Object.values(wordStats);
  return {
    words,
    totalTracked: statsArray.length,
    wordsKnown: statsArray.filter((s) => s.pKnown >= KNOWN_THRESHOLD).length,
  };
}

function getDefaultSettings(): Settings {
  return {
    language: 'es',
    density: 5, // 5% default
    enabledSites: [],
    isEnabled: true,
    siteRegexPatterns: [],
    disabledSites: [],
  };
}
