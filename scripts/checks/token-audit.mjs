// CI guard: every var(--token) referenced in src/ must be defined in src/.
//
// Catches the "phantom token dialect" bug class (F-09): a component styles
// itself with var(--bg-panel, #1a1a1a) where --bg-panel is defined nowhere,
// so the hardcoded fallback always wins and theming silently breaks.
//
// Exemptions:
//  - PARAM_VARS: per-instance parameters set at runtime rather than theme
//    tokens — either from markup style attributes (e.g. --cx/--cy on NodePort,
//    --type-color on blocks) or imperatively from JS (e.g. --ds-reveal-delay,
//    set by p0-primitives/utils/reveal.ts). These are consumed with an explicit
//    var(--x, fallback) and are correctly defined nowhere in src/.
//  - ACCENT_HOOKS: consumer override hooks, deliberately undefined; only
//    tokens.css may reference them (see the accent block comment there).
//  - Dynamic names (template interpolation) can't be statically audited.
//
// Origin: external review @ 51b3401 (REVIEW-FINDINGS.md, focus area 2).

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const SRC = path.join(ROOT, 'src');

const PARAM_VARS = new Set([
	'--cx', '--cy', '--type-color', '--handle-width', '--shape-border-radius',
	'--ds-reveal-delay', // set by reveal.ts via node.style.setProperty
]);
const ACCENT_HOOKS = new Set([
	'--accent-primary', '--accent-hover', '--accent-active', '--accent-glow',
	'--accent-muted', '--accent-subtle', '--accent-faint',
]);
const HOOK_HOME = 'p0-primitives/tokens/tokens.css';

const defined = new Set();
const refs = new Map();

const files = [];
(function walk(d) {
	for (const e of fs.readdirSync(d, { withFileTypes: true })) {
		const p = path.join(d, e.name);
		if (e.isDirectory()) walk(p);
		else if (/\.(css|svelte)$/.test(e.name)) files.push(p);
	}
})(SRC);

for (const f of files) {
	const rel = path.relative(SRC, f).split(path.sep).join('/');
	fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
		for (const m of line.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);
		for (const m of line.matchAll(/var\(\s*(--[a-zA-Z0-9{-]+)/g)) {
			const name = m[1];
			if (name.includes('{')) continue; // dynamic template — not auditable
			if (!refs.has(name)) refs.set(name, []);
			refs.get(name).push({ rel, line: i + 1 });
		}
	});
}

const errors = [];
for (const [name, uses] of refs) {
	if (defined.has(name) || PARAM_VARS.has(name)) continue;
	if (ACCENT_HOOKS.has(name)) {
		const outside = uses.filter((u) => u.rel !== HOOK_HOME);
		for (const u of outside) {
			errors.push(`HOOK-MISUSE: ${u.rel}:${u.line} consumes override hook ${name} — use the canonical --color-accent* token`);
		}
		continue;
	}
	for (const u of uses.slice(0, 5)) errors.push(`UNDEFINED: ${u.rel}:${u.line} references ${name}`);
	if (uses.length > 5) errors.push(`UNDEFINED: ...and ${uses.length - 5} more uses of ${name}`);
}

if (errors.length) {
	console.error(`token-audit: ${errors.length} violation(s)\n` + errors.map((e) => '  ' + e).join('\n'));
	process.exit(1);
}
console.log(`token-audit: OK (${defined.size} tokens defined, ${refs.size} names referenced, no phantoms)`);
