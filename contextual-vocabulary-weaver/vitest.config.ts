import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.ts',
        '**/*.config.js',
        'dist/',
        '.output/',
      ],
    },
  },
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, './lib'),
      '@p3': path.resolve(__dirname, '../P3/src'),
    },
  },
});
