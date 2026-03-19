/**
 * Storage Layer Type Definitions
 *
 * Database Analogy: This file is like your CREATE TABLE statements and schema definitions
 * in SQL. It defines the structure of data we'll store in chrome.storage.local.
 */

/**
 * WordStats - Individual word tracking record
 *
 * Database Analogy: Like a row in the "word_stats" table
 * Primary Key: word (the English word being tracked)
 */
export interface WordStats {
  /** The word being tracked (Primary Key) */
  word: string;

  /** The translated word in the target language (stored on first exposure) */
  translation?: string;

  /** How many times user has been exposed to this word (Counter column, auto-increments) */
  exposureCount: number;

  /** How many times user hovered to see original (recall failure counter) */
  recallFailures: number;

  /** Timestamp when word was first seen (BIGINT, like DEFAULT CURRENT_TIMESTAMP on INSERT) */
  firstSeen: number;

  /** Timestamp when word was last seen (BIGINT, like ON UPDATE CURRENT_TIMESTAMP) */
  lastSeen: number;

  /**
   * Probability that user knows this word (0.0 - 1.0)
   * Database Analogy: This is a COMPUTED/CALCULATED column, like a materialized view
   * Formula: Based on successRate = (exposureCount - recallFailures) / exposureCount
   */
  pKnown: number;
}

/**
 * Extension Settings
 *
 * Database Analogy: Like a singleton configuration table (single row with all settings)
 * Similar to system parameter tables like pg_settings or v$parameter in Oracle
 */
export interface ExtensionSettings {
  /** Global on/off switch for the extension */
  enabled: boolean;

  /**
   * Replacement density (0.0 - 1.0)
   * 0.01 = 1% of words replaced (Beginner)
   * 0.05 = 5% of words replaced (Intermediate)
   * 0.10 = 10% of words replaced (Aggressive)
   */
  density: number;

  /** Target language code (locked to 'es' for POC) */
  targetLanguage: string;

  /**
   * Current learning phase
   * 1 = Phase 1 (isolated word replacement)
   * 2 = Phase 2 (sentence-level replacement)
   */
  currentPhase: 1 | 2;
}

/**
 * Complete storage schema
 *
 * Database Analogy: This represents the entire database with multiple tables
 * chrome.storage.local stores this as a nested JSON structure
 */
export interface StorageSchema {
  /** All word statistics (map of word -> WordStats) */
  word_stats: Record<string, WordStats>;

  /** Extension configuration */
  settings: ExtensionSettings;
}

/**
 * Storage Keys - Constants for accessing chrome.storage.local
 *
 * Database Analogy: Like table names in your database
 */
export const STORAGE_KEYS = {
  WORD_STATS: 'word_stats',
  SETTINGS: 'settings',
} as const;

/**
 * Default settings when extension is first installed
 *
 * Database Analogy: Like DEFAULT values in a CREATE TABLE statement
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  density: 0.05, // 5% replacement (intermediate)
  targetLanguage: 'es', // Spanish
  currentPhase: 1, // Start with Phase 1
};
