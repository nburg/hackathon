export type SupportedLanguage =
  | 'af'
  | 'sq'
  | 'am'
  | 'ar'
  | 'az'
  | 'eu'
  | 'be'
  | 'bn'
  | 'bs'
  | 'bg'
  | 'my'
  | 'ca'
  | 'zh-CN'
  | 'zh-TW'
  | 'hr'
  | 'cs'
  | 'da'
  | 'nl'
  | 'et'
  | 'fil'
  | 'fi'
  | 'fr'
  | 'fy'
  | 'gl'
  | 'ka'
  | 'de'
  | 'el'
  | 'gu'
  | 'ha'
  | 'he'
  | 'hi'
  | 'hu'
  | 'is'
  | 'ig'
  | 'id'
  | 'ga'
  | 'it'
  | 'ja'
  | 'kn'
  | 'km'
  | 'ko'
  | 'ky'
  | 'lo'
  | 'lv'
  | 'ln'
  | 'lt'
  | 'lb'
  | 'mk'
  | 'ms'
  | 'ml'
  | 'mt'
  | 'mr'
  | 'mn'
  | 'ne'
  | 'no'
  | 'or'
  | 'fa'
  | 'pl'
  | 'pt'
  | 'pa'
  | 'ro'
  | 'ru'
  | 'gd'
  | 'sr'
  | 'sk'
  | 'sl'
  | 'so'
  | 'es'
  | 'sw'
  | 'sv'
  | 'tl'
  | 'tg'
  | 'ta'
  | 'te'
  | 'th'
  | 'tr'
  | 'uk'
  | 'ur'
  | 'uz'
  | 'vi'
  | 'cy'
  | 'zu';

export interface Settings {
  language: SupportedLanguage;
  density: number; // 1-10 (percentage)
  enabledSites: string[]; // Array of domains where extension is enabled
  isEnabled: boolean; // Global toggle
  siteRegexPatterns: string[]; // Regex patterns — if non-empty, only matching URLs are altered
  disabledSites: string[]; // Hostnames where extension is explicitly disabled
}

export interface VocabularyWord {
  word: string; // Spanish word
  translation: string; // English translation
  exposureCount: number; // Times user has seen this word
  lastSeen: number; // Timestamp
  recallFailures: number; // Times user hovered (revealed original)
  pKnown: number; // Probability known (0-1, from P5's BKT model)
}

export interface VocabularyData {
  words: Record<string, VocabularyWord>;
  totalTracked: number;
  wordsKnown: number; // Count of words above mastery threshold
}
