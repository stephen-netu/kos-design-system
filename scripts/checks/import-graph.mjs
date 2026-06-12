// CI guard: layering, cycles, and runtime-dependency integrity.
//
// Fails (exit 1) when:
//  1. A core layer imports upward (p0 ← u0 ← f0 ← l0 ← fabric must flow down).
//  2. Any directory-level import cycle exists under src/.
//  3. Shipped (non-test) code imports a package that is not declared in
//     dependencies or peerDependencies — the bug class where a devDependency
//     is imported at runtime and breaks published consumers (F-01/F-02).
//
// Origin: external review @ 51b3401 (REVIEW-FINDINGS.md).

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const SRC = path.join(ROOT, 'src');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const declared = new Set([
	...Object.keys(pkg.dependencies ?? {}),
	...Object.keys(pkg.peerDependencies ?? {}),
]);

// Node-only modules deliberately living in src/ (documented exceptions).
const NODE_BUILTIN_ALLOWLIST = new Set([
	'p0-primitives/tokens/contrast-audit.ts', // node-only audit script, runs via tsx/vitest
]);
const NODE_BUILTINS = new Set(['fs', 'path', 'url', 'os', 'crypto', 'util', 'child_process', 'process']);

const CORE = { 'p0-primitives': 0, 'u0-primitives': 1, 'f0-forms': 2, 'l0-layout': 3, fabric: 4 };
const RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g;

// Strip comments so import examples in JSDoc/line comments don't trip the guard.
function stripComments(text) {
	return text
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/(^|[^:])\/\/[^\n]*/g, '$1')
		.replace(/<!--[\s\S]*?-->/g, '');
}

const files = [];
(function walk(d) {
	for (const e of fs.readdirSync(d, { withFileTypes: true })) {
		const p = path.join(d, e.name);
		if (e.isDirectory()) walk(p);
		else if (/\.(ts|js|svelte)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) files.push(p);
	}
})(SRC);

const errors = [];
const adj = new Map();

for (const f of files) {
	const rel = path.relative(SRC, f);
	const isTest = /\.test\.(ts|js)$/.test(rel);
	const fromTop = rel.split(path.sep)[0];
	const text = stripComments(fs.readFileSync(f, 'utf8'));

	for (const m of text.matchAll(RE)) {
		const spec = m[1] || m[2] || m[3];
		if (!spec) continue;

		if (spec.startsWith('.')) {
			const resolved = path.resolve(path.dirname(f), spec);
			if (!resolved.startsWith(SRC)) continue;
			const toTop = path.relative(SRC, resolved).split(path.sep)[0];
			if (toTop === fromTop || toTop.endsWith('.css') || toTop.endsWith('.js') || toTop.endsWith('.ts')) {
				if (toTop === fromTop) continue;
			}
			if (fromTop in CORE && toTop in CORE && CORE[toTop] > CORE[fromTop]) {
				errors.push(`LAYERING: ${rel} (${fromTop}) imports upward from ${toTop}: "${spec}"`);
			}
			if (!adj.has(fromTop)) adj.set(fromTop, new Set());
			adj.get(fromTop).add(toTop);
			continue;
		}

		if (spec.startsWith('$')) {
			errors.push(`ALIAS: ${rel} imports "${spec}" — SvelteKit aliases do not resolve in this package`);
			continue;
		}

		if (isTest) continue; // test-only imports may use devDependencies

		const pkgName = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
		const bare = pkgName.replace(/^node:/, '');
		if (NODE_BUILTINS.has(bare) || pkgName.startsWith('node:')) {
			if (!NODE_BUILTIN_ALLOWLIST.has(rel.split(path.sep).join('/'))) {
				errors.push(`NODE-BUILTIN: ${rel} imports "${spec}" in shipped code (breaks browser/SSR bundles)`);
			}
			continue;
		}
		if (pkgName === 'svelte') continue; // peer
		if (!declared.has(pkgName)) {
			errors.push(`UNDECLARED-DEP: ${rel} imports "${pkgName}" which is not in dependencies/peerDependencies`);
		}
	}
}

// Directory-level cycle detection
const seen = new Set();
const stack = new Set();
function dfs(n, trail) {
	if (stack.has(n)) {
		errors.push('CYCLE: ' + trail.slice(trail.indexOf(n)).concat(n).join(' -> '));
		return;
	}
	if (seen.has(n)) return;
	seen.add(n);
	stack.add(n);
	for (const m of adj.get(n) ?? []) dfs(m, trail.concat(n));
	stack.delete(n);
}
for (const n of adj.keys()) dfs(n, []);

if (errors.length) {
	console.error(`import-graph: ${errors.length} violation(s)\n` + errors.map((e) => '  ' + e).join('\n'));
	process.exit(1);
}
console.log(`import-graph: OK (${files.length} files; layering, cycles, and runtime deps clean)`);
