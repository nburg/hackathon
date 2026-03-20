/**
 * Storage Layer Public API
 *
 * Database Analogy: This is like a "package specification" in Oracle PL/SQL
 * or a public interface in Java - it exports only the functions other modules need.
 *
 * Usage by other team members:
 *
 * P2 (Dashboard UI):
 *   import { getAllWordStats, getLearningSummary } from '@/lib';
 *
 * P4 (Translation Pipeline):
 *   import { getWordPriority, trackExposure, trackRecallFailure } from '@/lib';
 */

// Export all types
export type { WordStats, ExtensionSettings, StorageSchema } from './types';

// Export constants that others might need
export { STORAGE_KEYS, DEFAULT_SETTINGS } from './types';
export { TOP_200_COMMON_WORDS, PHASE2_THRESHOLD, KNOWN_THRESHOLD } from './constants';

// Export all storage functions
export {
  // Settings management
  getSettings,
  updateSettings,
  // Word stats management
  getWordStats,
  getAllWordStats,
  trackExposure,
  trackRecallFailure,
  // Calculation logic
  calculatePKnown,
  getWordPriority,
  // Analytics
  getLearningSummary,
  getRecentWords,
  // Phase 2 logic
  shouldEnablePhase2,
  checkAndTriggerPhase2,
  // Utilities
  clearAllData,
  exportData,
} from './storage-manager';
