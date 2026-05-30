import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/package').PackageOptions} */
const config = {
	compilerOptions: {
		generate: 'client',
	},
	preprocess: vitePreprocess(),
	kit: undefined,
};

export default config;
