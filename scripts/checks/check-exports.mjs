// CI guard: package.json exports map ↔ dist/ reality.
//
// Run AFTER `pnpm build`. Fails (exit 1) when any exports-map target is
// missing from dist/, or a bare-string subpath lacks an adjacent .d.ts
// (which is how TypeScript resolves types for string-form entries).
//
// Origin: external review @ 51b3401 (REVIEW-FINDINGS.md, focus area 5).

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

if (!fs.existsSync(path.join(ROOT, 'dist'))) {
	console.error('check-exports: dist/ missing — run `pnpm build` first');
	process.exit(1);
}

const errors = [];
for (const [sub, target] of Object.entries(pkg.exports)) {
	const conds = typeof target === 'string' ? { default: target } : target;
	for (const [cond, p] of Object.entries(conds)) {
		if (!fs.existsSync(path.join(ROOT, p))) errors.push(`MISSING: ${sub} [${cond}] -> ${p}`);
	}
	if (typeof target === 'string' && target.endsWith('.js')) {
		const dts = target.replace(/\.js$/, '.d.ts');
		if (!fs.existsSync(path.join(ROOT, dts))) errors.push(`NO-TYPES: ${sub} -> ${dts} not found next to entry`);
	}
}

if (errors.length) {
	console.error(`check-exports: ${errors.length} violation(s)\n` + errors.map((e) => '  ' + e).join('\n'));
	process.exit(1);
}
console.log(`check-exports: OK (${Object.keys(pkg.exports).length} subpaths resolve with types)`);
