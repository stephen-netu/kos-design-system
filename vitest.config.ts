import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
        setupFiles: [`${__dirname}/vitest-setup.ts`],
    },
});
