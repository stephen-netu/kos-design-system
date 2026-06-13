import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, './src');

export default defineConfig({
    plugins: [
        svelte({
            compilerOptions: { hmr: false },
        }),
    ],
    resolve: {
        conditions: ['browser', 'module', 'import'],
        dedupe: ['svelte', '@sveltejs/vite-plugin-svelte'],
        alias: {
            '@stephen-netu/design-system/': `${srcDir}/`,
            '@kos/design-system/': `${srcDir}/`,
            '@stephen-netu/design-system': `${srcDir}/index.ts`,
            '@kos/design-system': `${srcDir}/index.ts`,
        },
    },
    test: {
        include: ['src/**/*.test.ts'],
        environment: 'jsdom',
        setupFiles: [`${__dirname}/vitest-setup.ts`],
    },
});
