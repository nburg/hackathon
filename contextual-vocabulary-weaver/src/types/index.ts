export interface Settings {
  language: 'es'; // Locked to Spanish for POC
  density: number; // 1-10 (percentage)
  enabledSites: string[]; // Array of domains where extension is enabled
  isEnabled: boolean; // Global toggle
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
