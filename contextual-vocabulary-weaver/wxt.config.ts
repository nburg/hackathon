import { defineConfig } from 'wxt';
import { fileURLToPath } from 'url';
import path from 'path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  srcDir: '.',
  vite: () => ({
    resolve: {
      alias: {
        // Map @p3 to P3's source so Vite bundles it directly.
        // Vite resolves P3's 'compromise' dependency via normal Node module
        // resolution (walks up to ../P3/node_modules automatically).
        '@p3': path.resolve(__dir, '../P3/src'),
      },
    },
  }),
  manifest: {
    name: 'Contextual Vocabulary Weaver',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: ['<all_urls>'],
    action: {}
  }
});
