import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  srcDir: 'src',
  vite: () => ({
    plugins: [react()],
    resolve: {
      alias: {
        // Map @p3 to P3's source so Vite bundles it directly.
        // Vite resolves P3's 'compromise' dependency via normal Node module
        // resolution (walks up to ../P3/node_modules automatically).
        '@p3': path.resolve(__dir, '../P3/src'),
        // Map @lib to the root lib/ directory (P4/P5 shared modules).
        // Needed because srcDir is 'src', making relative paths from
        // src/entrypoints/* to root lib/ fragile.
        '@lib': path.resolve(__dir, 'lib'),
      },
    },
  }),
  runner: {
    startUrls: ['https://en.wikipedia.org/wiki/Wikipedia'],
  },
  manifest: {
    name: 'Contextual Vocabulary Weaver',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
    host_permissions: ['<all_urls>'],
    action: {},
    browser_specific_settings: {
      gecko: {
        id: 'cvw@hackathon.dev',
      },
    },
  }
});
