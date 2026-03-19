// Bookmarklet to inject P3 module on any page
// This bundles everything inline to avoid CORS

javascript:(function() {
  // Check if already loaded
  if (window.P3) {
    alert('P3 already loaded! Check console.');
    return;
  }

  // Load compromise.js first
  const compromiseScript = document.createElement('script');
  compromiseScript.src = 'https://unpkg.com/compromise@14.15.0/builds/compromise.min.js';
  compromiseScript.onload = function() {
    console.log('✅ compromise.js loaded');

    // Now inject our P3 code
    const p3Script = document.createElement('script');
    p3Script.type = 'module';
    p3Script.textContent = `
      import('http://localhost:8080/dist/index.js').then(P3 => {
        window.P3 = P3;
        console.log('✅ P3 Module loaded!');

        // Auto-run extraction
        const candidates = P3.extractCandidates(document);
        console.log(\`📊 Found \${candidates.length} word candidates\`);

        // Show summary
        const posCounts = candidates.reduce((acc, c) => {
          acc[c.pos] = (acc[c.pos] || 0) + 1;
          return acc;
        }, {});

        console.log('📈 POS Distribution:', posCounts);
        console.log('🔬 Sample (first 20):', candidates.slice(0, 20));
        console.table(candidates.slice(0, 20));

        alert(\`P3 Module Ready!\\n\\nFound \${candidates.length} candidates\\nNouns: \${posCounts.Noun || 0}\\nVerbs: \${posCounts.Verb || 0}\\n\\nCheck console for details.\`);
      }).catch(err => {
        console.error('❌ Failed to load P3:', err);
        alert('Failed to load P3. Make sure http-server is running with --cors flag.');
      });
    `;
    document.body.appendChild(p3Script);
  };

  compromiseScript.onerror = function() {
    alert('Failed to load compromise.js from CDN');
  };

  document.head.appendChild(compromiseScript);
})();
