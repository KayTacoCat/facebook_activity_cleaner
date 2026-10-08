import { build } from 'vite';
import { copyFile, readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist');

await build({
  configFile: false,
  root,
  build: {
    outDir,
    emptyOutDir: true,
    target: 'chrome114',
    minify: false,
    rolldownOptions: {
      input: {
        sidepanel: resolve(root, 'sidepanel.html'),
        background: resolve(root, 'src/background/serviceWorker.ts')
      },
      output: { entryFileNames: '[name].js', chunkFileNames: 'assets/[name]-[hash].js' }
    }
  }
});

// Chrome manifest content scripts are classic scripts, so emit one import-free IIFE.
await build({
  configFile: false,
  root,
  build: {
    outDir,
    emptyOutDir: false,
    target: 'chrome114',
    minify: false,
    lib: {
      entry: resolve(root, 'src/content/activityContentScript.ts'),
      name: 'FacebookActivityCleaner',
      formats: ['iife'],
      fileName: () => 'contentScript.js'
    }
  }
});

await copyFile(resolve(root, 'manifest.json'), resolve(outDir, 'manifest.json'));
const manifest = JSON.parse(await readFile(resolve(outDir, 'manifest.json'), 'utf8'));
for (const file of [manifest.background.service_worker, manifest.side_panel.default_path,
  ...manifest.content_scripts.flatMap(script => script.js)]) {
  await access(resolve(outDir, file));
}
