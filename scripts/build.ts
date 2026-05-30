import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');

// Clean dist
if (existsSync(DIST)) rmSync(DIST, { recursive: true });
mkdirSync(DIST, { recursive: true });

// Generate tokens.json first
execSync('node scripts/generate-tokens-json.ts', { cwd: ROOT, stdio: 'inherit' });

// Run svelte-package to generate .d.ts and copy sources
const sveltePackage = resolve(ROOT, 'node_modules/.pnpm/@sveltejs+package@2.5.7_svelte@5.55.9_@typescript-eslint+types@8.59.4__typescript@5.9.3/node_modules/.bin/svelte-package');

try {
	execSync(`"${sveltePackage}"`, {
		cwd: ROOT,
		stdio: 'inherit',
		env: {
			...process.env,
			PACKAGE_OUTPUT_DIR: 'dist',
		},
	});
	console.log('Build complete → dist/');
} catch (err) {
	console.error('svelte-package failed, falling back to manual copy');
	// Fallback: just copy src to dist
	execSync(`cp -r src/* ${DIST}/`, { cwd: ROOT });
	console.log('Fallback copy complete → dist/');
}
