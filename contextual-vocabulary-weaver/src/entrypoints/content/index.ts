import styles from './styles.css?inline';
import { getSettings } from '@/lib/storage/api';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('Content script loaded');

    const settings = await getSettings();

    // If regex patterns are defined, only run on matching URLs
    const patterns = settings.siteRegexPatterns || [];
    if (patterns.length > 0) {
      const url = window.location.href;
      const matches = patterns.some(p => {
        try { return new RegExp(p).test(url); } catch { return false; }
      });
      if (!matches) return;
    }

    // Inject CSS into page
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // Future: P4 will add word replacement logic here
    // For now, just ensure CSS is loaded
  },
});
