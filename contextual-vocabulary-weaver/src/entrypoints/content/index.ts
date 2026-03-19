import styles from './styles.css?inline';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Content script loaded');

    // Inject CSS into page
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // Future: P4 will add word replacement logic here
    // For now, just ensure CSS is loaded
  },
});
