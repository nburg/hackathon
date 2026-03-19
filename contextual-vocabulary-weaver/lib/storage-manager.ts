/**
 * Storage Manager - Core Data Layer
 *
 * Database Analogy: This file contains all your stored procedures and data access functions
 * It provides a clean API for CRUD operations on chrome.storage.local
 *
 * chrome.storage.local is like an embedded NoSQL database (similar to SQLite or Redis)
 * - Async API (like Oracle's PL/SQL with COMMIT statements)
 * - Key-value store (like Redis: SET key value, GET key)
 * - No SQL queries (we handle filtering in JavaScript)
 */

import type { WordStats, ExtensionSettings, StorageSchema } from './types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from './types';
import {
  TOP_200_COMMON_WORDS,
  PHASE2_THRESHOLD,
  KNOWN_THRESHOLD,
  MIN_PKNOWN,
  MAX_PKNOWN,
  COMMON_ENGLISH_WORDS,
  ENGLISH_WORD_RANK,
} from './constants';

// ============================================================================
// SETTINGS MANAGEMENT (Configuration Table CRUD)
// ============================================================================

/**
 * Get current extension settings
 *
 * SQL Equivalent:
 * SELECT * FROM settings LIMIT 1;
 *
 * @returns Current settings or default settings if none exist
 */
export async function getSettings(): Promise<ExtensionSettings> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return (data.settings as ExtensionSettings) || DEFAULT_SETTINGS;
}

/**
 * Update extension settings
 *
 * SQL Equivalent:
 * UPDATE settings SET enabled = ?, density = ? WHERE id = 1;
 *
 * @param newSettings - Partial settings to update (like UPDATE with specific columns)
 */
export async function updateSettings(
  newSettings: Partial<ExtensionSettings>
): Promise<void> {
  const currentSettings = await getSettings();

  // Merge with existing settings (like UPDATE with defaults for unchanged columns)
  const updatedSettings: ExtensionSettings = {
    ...currentSettings,
    ...newSettings,
  };

  // Write back to storage (COMMIT equivalent)
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: updatedSettings,
  });
}

// ============================================================================
// WORD STATS MANAGEMENT (word_stats Table CRUD)
// ============================================================================

/**
 * Get statistics for a single word
 *
 * SQL Equivalent:
 * SELECT * FROM word_stats WHERE word = ?;
 *
 * @param word - The English word to look up (Primary Key)
 * @returns Word statistics or null if word hasn't been tracked yet
 */
export async function getWordStats(word: string): Promise<WordStats | null> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.WORD_STATS);
  const allStats = (data.word_stats as Record<string, WordStats>) || {};
  return allStats[word] || null;
}

/**
 * Get all word statistics
 *
 * SQL Equivalent:
 * SELECT * FROM word_stats;
 *
 * @returns Map of all tracked words (word -> WordStats)
 */
export async function getAllWordStats(): Promise<Record<string, WordStats>> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.WORD_STATS);
  return (data.word_stats as Record<string, WordStats>) || {};
}

/**
 * Track word exposure (called when word is displayed on page)
 *
 * SQL Equivalent (UPSERT/MERGE):
 * MERGE INTO word_stats USING (SELECT ? as word) src
 * ON (word_stats.word = src.word)
 * WHEN MATCHED THEN
 *   UPDATE SET
 *     exposureCount = exposureCount + 1,
 *     lastSeen = CURRENT_TIMESTAMP,
 *     pKnown = calculate_pknown(exposureCount + 1, recallFailures)
 * WHEN NOT MATCHED THEN
 *   INSERT (word, exposureCount, recallFailures, firstSeen, lastSeen, pKnown)
 *   VALUES (?, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.0);
 *
 * @param word - The word that was displayed to the user
 * @param translation - The translated word shown to the user (stored on first exposure)
 */
export async function trackExposure(word: string, translation?: string): Promise<void> {
  // Read current state (SELECT)
  const allStats = await getAllWordStats();

  // Get existing record or create new one (COALESCE/NVL equivalent)
  const existingStats = allStats[word];

  if (existingStats) {
    // UPDATE case: Word already exists
    existingStats.exposureCount += 1;
    existingStats.lastSeen = Date.now();
    existingStats.pKnown = calculatePKnown(
      existingStats.exposureCount,
      existingStats.recallFailures
    );
    // Store translation if we now have one and didn't before
    if (translation && !existingStats.translation) {
      existingStats.translation = translation;
    }
    allStats[word] = existingStats;
  } else {
    // INSERT case: New word
    const newStats: WordStats = {
      word,
      translation,
      exposureCount: 1,
      recallFailures: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      pKnown: 0.0, // New word, completely unknown
    };
    allStats[word] = newStats;
  }

  // Write back to storage (COMMIT)
  await chrome.storage.local.set({
    [STORAGE_KEYS.WORD_STATS]: allStats,
  });
}

/**
 * Track recall failure (called when user hovers to see original word)
 *
 * SQL Equivalent:
 * UPDATE word_stats
 * SET recallFailures = recallFailures + 1,
 *     pKnown = calculate_pknown(exposureCount, recallFailures + 1)
 * WHERE word = ?;
 *
 * @param word - The word user couldn't recall (needed to hover)
 */
export async function trackRecallFailure(word: string): Promise<void> {
  const allStats = await getAllWordStats();

  // Defensive check: Only update if word exists (WHERE clause validation)
  if (!allStats[word]) {
    console.warn(`Cannot track recall failure: word "${word}" not found`);
    return;
  }

  // Update counters (SET clause)
  allStats[word].recallFailures += 1;
  allStats[word].pKnown = calculatePKnown(
    allStats[word].exposureCount,
    allStats[word].recallFailures
  );

  // Write back (COMMIT)
  await chrome.storage.local.set({
    [STORAGE_KEYS.WORD_STATS]: allStats,
  });
}

// ============================================================================
// CALCULATION LOGIC (Business Logic / Computed Columns)
// ============================================================================

/**
 * Calculate probability that user knows a word (simplified SRS algorithm)
 *
 * Database Analogy: This is like a deterministic function or computed column
 * CREATE FUNCTION calculate_pknown(exposure INT, failures INT)
 * RETURNS FLOAT DETERMINISTIC
 *
 * Algorithm:
 * - If user never saw the word: pKnown = 0.0 (NULL handling)
 * - If user saw it N times and failed M times: successRate = (N - M) / N
 * - Apply floor (0.1) and ceiling (0.95) bounds
 *
 * Example:
 * - Saw 10 times, failed 2 times: successRate = 8/10 = 0.80 → pKnown = 0.80
 * - Saw 5 times, failed 5 times: successRate = 0/5 = 0.00 → pKnown = 0.10 (floor)
 * - Saw 20 times, failed 0 times: successRate = 20/20 = 1.00 → pKnown = 0.95 (ceiling)
 *
 * @param exposureCount - Total number of times word was shown
 * @param recallFailures - Number of times user hovered (forgot the word)
 * @returns Probability between 0.1 and 0.95
 */
export function calculatePKnown(
  exposureCount: number,
  recallFailures: number
): number {
  // Handle edge case: never exposed (like NULL handling)
  if (exposureCount === 0) return 0.0;

  // Calculate success rate (like a calculated field)
  const successRate = (exposureCount - recallFailures) / exposureCount;

  // Apply bounds (like LEAST/GREATEST in SQL or BETWEEN clause)
  return Math.max(MIN_PKNOWN, Math.min(MAX_PKNOWN, successRate));
}

/**
 * Get word priority score for replacement selection
 *
 * Database Analogy: Like a view or query that calculates priority dynamically
 * CREATE VIEW word_priorities AS
 * SELECT word,
 *   CASE
 *     WHEN pKnown IS NULL THEN 1.0  -- New words, high priority
 *     WHEN pKnown > 0.85 THEN 0.1   -- Known words, low priority
 *     ELSE 1.0 - pKnown             -- Learning words, inverse priority
 *   END as priority
 * FROM word_stats;
 *
 * Priority Logic:
 * - New words (never seen): priority = 1.0 (highest)
 * - Known words (pKnown > 0.85): priority = 0.1 (lowest, skip these)
 * - Learning words (0.0 - 0.85): priority = 1.0 - pKnown (inverse relationship)
 *
 * Example:
 * - Word never seen: priority = 1.0 (introduce new vocabulary)
 * - Word with pKnown = 0.3: priority = 0.7 (needs practice)
 * - Word with pKnown = 0.9: priority = 0.1 (already mastered, skip)
 *
 * @param word - The word to calculate priority for
 * @returns Priority score (0.0 - 1.0), higher = more important to show
 */
/**
 * Map an unseen word's English frequency rank to a starting priority in [0.5, 1.0].
 * Rank 0 (most common) → 1.0; last rank (least common in list) → 0.5.
 * Words not in the frequency list → 0.5.
 */
function frequencyPriority(word: string): number {
  const rank = ENGLISH_WORD_RANK.get(word.toLowerCase());
  if (rank === undefined) return 0.5;
  return 1.0 - (rank / (COMMON_ENGLISH_WORDS.length - 1)) * 0.5;
}

export async function getWordPriority(word: string): Promise<number> {
  const stats = await getWordStats(word);

  // Case 1: New word (never tracked) - priority varies by how common it is
  if (!stats) return frequencyPriority(word);

  // Case 2: Known word (mastered) - LOW priority
  if (stats.pKnown >= KNOWN_THRESHOLD) return 0.1;

  // Case 3: Learning word - Inverse priority
  // Lower pKnown = Higher priority (needs more practice)
  return 1.0 - stats.pKnown;
}

// ============================================================================
// ANALYTICS & REPORTING (For Dashboard UI - P2)
// ============================================================================

/**
 * Get learning summary for dashboard
 *
 * SQL Equivalent:
 * SELECT
 *   COUNT(*) as totalWords,
 *   SUM(CASE WHEN pKnown >= 0.85 THEN 1 ELSE 0 END) as knownWords,
 *   SUM(CASE WHEN pKnown >= 0.3 AND pKnown < 0.85 THEN 1 ELSE 0 END) as learningWords,
 *   SUM(CASE WHEN pKnown < 0.3 THEN 1 ELSE 0 END) as newWords
 * FROM word_stats;
 *
 * @returns Summary statistics for dashboard display
 */
export async function getLearningSummary() {
  const allStats = await getAllWordStats();
  const statsArray = Object.values(allStats);

  return {
    totalWords: statsArray.length,
    knownWords: statsArray.filter((s) => s.pKnown >= KNOWN_THRESHOLD).length,
    learningWords: statsArray.filter(
      (s) => s.pKnown >= 0.3 && s.pKnown < KNOWN_THRESHOLD
    ).length,
    newWords: statsArray.filter((s) => s.pKnown < 0.3).length,
  };
}

/**
 * Get top N words by last seen (most recent first)
 *
 * SQL Equivalent:
 * SELECT * FROM word_stats
 * ORDER BY lastSeen DESC
 * LIMIT ?;
 *
 * @param limit - Number of words to return
 * @returns Array of WordStats sorted by recency
 */
export async function getRecentWords(limit: number = 20): Promise<WordStats[]> {
  const allStats = await getAllWordStats();

  return Object.values(allStats)
    .sort((a, b) => b.lastSeen - a.lastSeen) // ORDER BY lastSeen DESC
    .slice(0, limit); // LIMIT N
}

// ============================================================================
// PHASE 2 TRIGGER LOGIC (Transition Detection)
// ============================================================================

/**
 * Check if user is ready for Phase 2 (sentence-level translation)
 *
 * SQL Equivalent:
 * SELECT
 *   (SELECT COUNT(*) FROM word_stats
 *    WHERE word IN (SELECT word FROM top_200_common)
 *    AND pKnown >= 0.85) / 200.0 as knownRatio
 * FROM dual;
 *
 * Logic:
 * - Count how many of the top 200 common Spanish words the user knows
 * - If they know >= 70% (140 words), trigger Phase 2
 *
 * @returns true if user should transition to Phase 2, false otherwise
 */
export async function shouldEnablePhase2(): Promise<boolean> {
  const allStats = await getAllWordStats();

  // Count how many top-200 words are known (WHERE pKnown >= 0.85)
  const knownCount = TOP_200_COMMON_WORDS.filter((word) => {
    const stats = allStats[word];
    return stats && stats.pKnown >= KNOWN_THRESHOLD;
  }).length;

  // Calculate ratio (knownCount / total)
  const knownRatio = knownCount / TOP_200_COMMON_WORDS.length;

  // Check threshold (HAVING knownRatio >= 0.70)
  return knownRatio >= PHASE2_THRESHOLD;
}

/**
 * Trigger Phase 2 if conditions are met
 *
 * SQL Equivalent:
 * UPDATE settings
 * SET currentPhase = 2
 * WHERE currentPhase = 1
 * AND (SELECT should_enable_phase2() FROM dual) = TRUE;
 *
 * @returns true if Phase 2 was activated, false if already in Phase 2 or not ready
 */
export async function checkAndTriggerPhase2(): Promise<boolean> {
  const settings = await getSettings();

  // Already in Phase 2
  if (settings.currentPhase === 2) return false;

  // Check if user is ready
  const isReady = await shouldEnablePhase2();

  if (isReady) {
    // Update to Phase 2 (UPDATE + COMMIT)
    await updateSettings({ currentPhase: 2 });
    console.log('🎉 Phase 2 activated! Switching to sentence-level translation');
    return true;
  }

  return false;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all stored data (for testing/debugging)
 *
 * SQL Equivalent:
 * TRUNCATE TABLE word_stats;
 * DELETE FROM settings;
 *
 * WARNING: This is destructive! Use only for testing.
 */
export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
  console.warn('⚠️ All storage data cleared');
}

/**
 * Export all data as JSON (for backup/debugging)
 *
 * SQL Equivalent:
 * SELECT * FROM word_stats
 * UNION ALL
 * SELECT * FROM settings;
 *
 * @returns Complete storage snapshot
 */
export async function exportData(): Promise<StorageSchema> {
  const [wordStats, settings] = await Promise.all([
    getAllWordStats(),
    getSettings(),
  ]);

  return {
    word_stats: wordStats,
    settings,
  };
}
