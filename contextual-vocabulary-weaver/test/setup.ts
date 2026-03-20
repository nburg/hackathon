/**
 * Test Setup - Mock Chrome APIs
 *
 * Database Analogy: Like creating a test database instance or mock schema
 * We create in-memory mocks of chrome.storage (like SQLite :memory: databases)
 */

import { vi } from 'vitest';

// In-memory storage mock (like an in-memory SQLite database)
const storageData: Record<string, unknown> = {};

// Mock chrome.storage.local (like a test database connection)
const mockStorageLocal = {
  get: vi.fn((keys: string | string[] | null) => {
    return Promise.resolve(
      typeof keys === 'string'
        ? { [keys]: storageData[keys] }
        : keys === null
          ? { ...storageData }
          : keys.reduce(
              (acc, key) => {
                acc[key] = storageData[key];
                return acc;
              },
              {} as Record<string, unknown>
            )
    );
  }),
  set: vi.fn((items: Record<string, unknown>) => {
    Object.assign(storageData, items);
    return Promise.resolve();
  }),
  remove: vi.fn((keys: string | string[]) => {
    const keysArray = typeof keys === 'string' ? [keys] : keys;
    keysArray.forEach((key) => delete storageData[key]);
    return Promise.resolve();
  }),
  clear: vi.fn(() => {
    Object.keys(storageData).forEach((key) => delete storageData[key]);
    return Promise.resolve();
  }),
};

// Mock chrome.storage.sync (similar to storage.local)
const syncStorageData: Record<string, unknown> = {};

const mockStorageSync = {
  get: vi.fn((keys: string | string[] | null) => {
    return Promise.resolve(
      typeof keys === 'string'
        ? { [keys]: syncStorageData[keys] }
        : keys === null
          ? { ...syncStorageData }
          : keys.reduce(
              (acc, key) => {
                acc[key] = syncStorageData[key];
                return acc;
              },
              {} as Record<string, unknown>
            )
    );
  }),
  set: vi.fn((items: Record<string, unknown>) => {
    Object.assign(syncStorageData, items);
    return Promise.resolve();
  }),
  remove: vi.fn((keys: string | string[]) => {
    const keysArray = typeof keys === 'string' ? [keys] : keys;
    keysArray.forEach((key) => delete syncStorageData[key]);
    return Promise.resolve();
  }),
  clear: vi.fn(() => {
    Object.keys(syncStorageData).forEach((key) => delete syncStorageData[key]);
    return Promise.resolve();
  }),
};

// Mock chrome.runtime for message passing
const mockRuntime = {
  sendMessage: vi.fn(() => Promise.resolve({ translated: 'test translation' })),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Setup global chrome object
global.chrome = {
  storage: {
    local: mockStorageLocal,
    sync: mockStorageSync,
  },
  runtime: mockRuntime,
} as unknown as typeof chrome;

// Also setup as browser for WebExtension API compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).browser = global.chrome;

// Helper function to clear all storage between tests (like TRUNCATE TABLE)
export function clearMockStorage() {
  Object.keys(storageData).forEach((key) => delete storageData[key]);
  Object.keys(syncStorageData).forEach((key) => delete syncStorageData[key]);
  vi.clearAllMocks();
}

// Helper to get current storage state (for debugging)
export function getMockStorageState() {
  return {
    local: { ...storageData },
    sync: { ...syncStorageData },
  };
}

// Helper to set storage state directly (for test setup)
export function setMockStorageState(local: Record<string, unknown>, sync?: Record<string, unknown>) {
  Object.keys(storageData).forEach((key) => delete storageData[key]);
  Object.assign(storageData, local);

  if (sync) {
    Object.keys(syncStorageData).forEach((key) => delete syncStorageData[key]);
    Object.assign(syncStorageData, sync);
  }
}
