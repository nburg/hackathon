import { defineConfig } from 'wxt';

export default defineConfig({
manifest: {
    name: 'Contextual Vocabulary Weaver',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: ['<all_urls>'],
    action: {}
  }
});