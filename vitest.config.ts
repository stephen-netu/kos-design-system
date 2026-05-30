import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: { hmr: false },
    }),
  ],
  resolve: {
    conditions: ['browser', 'module', 'import'],
    dedupe: ['svelte', '@sveltejs/vite-plugin-svelte'],
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: './vitest-setup.ts',
  },
});
