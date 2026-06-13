import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    svelte({
      runes: true,
    }),
  ],
  resolve: {
    alias: {
      '@stephen-netu/design-system/': path.resolve(__dirname, './src/'),
      '@kos/design-system/': path.resolve(__dirname, './src/'),
      '@stephen-netu/design-system': path.resolve(__dirname, './src/index.ts'),
      '@kos/design-system': path.resolve(__dirname, './src/index.ts'),
    },
  },
});
