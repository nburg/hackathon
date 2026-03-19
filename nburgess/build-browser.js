import * as esbuild from 'esbuild';

// Build for browser
await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/browser.js',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: false,
});

console.log('✅ Browser bundle created: dist/browser.js');
