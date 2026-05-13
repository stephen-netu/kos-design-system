// Contrast Audit — WCAG color contrast validation for design system tokens
// Runs in Node via tsx; can also be used as a vitest test module
//
// Checks all foreground/background token pairs against WCAG 2.2 AA:
//   - Normal text: contrast ratio >= 4.5:1
//   - Large text (>=18px or >=14px bold): contrast ratio >= 3:1
//   - UI components & borders: contrast ratio >= 3:1
//
// Related: LEAP-PRINCIPIA-v4 S-03 (semantic conservation),
//          leap-frontend-hardening-2026-05-12.md item E

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// ---------------------------------------------------------------------------
// 1. Color parsing utilities
// ---------------------------------------------------------------------------

interface RGB {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

/** Parse hex color (#rgb, #rrggbb) to RGB */
function parseHex(hex: string): RGB | null {
  hex = hex.trim().replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) return null;
  const n = parseInt(hex, 16);
  if (isNaN(n)) return null;
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
    alpha: 1,
  };
}

/** Parse rgb(r,g,b) or rgba(r,g,b,a) to RGB */
function parseRgb(func: string): RGB | null {
  const match = func.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?%?)\s*,\s*(\d+(?:\.\d+)?%?)\s*,\s*(\d+(?:\.\d+)?%?)(?:\s*,\s*([0-9.]+))?\s*\)$/i,
  );
  if (!match) return null;
  const toByte = (v: string) => {
    const num = parseFloat(v);
    return v.endsWith('%') ? Math.round((num / 100) * 255) : Math.min(255, Math.max(0, Math.round(num)));
  };
  return {
    r: toByte(match[1]),
    g: toByte(match[2]),
    b: toByte(match[3]),
    alpha: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

/** Parse HSLA colors */
function parseHsl(func: string): RGB | null {
  const match = func.match(
    /^hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?%?)\s*,\s*(\d+(?:\.\d+)?%?)(?:\s*,\s*([0-9.]+))?\s*\)$/i,
  );
  if (!match) return null;
  const h = parseFloat(match[1]) / 360;
  const s = parseFloat(match[2]) / (match[2].endsWith('%') ? 100 : 1);
  const l = parseFloat(match[3]) / (match[3].endsWith('%') ? 100 : 1);
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    alpha: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

/** Parse any CSS color to RGB */
function parseColor(value: string): RGB | null {
  value = value.trim();
  if (value.startsWith('#')) return parseHex(value);
  if (value.startsWith('rgb')) return parseRgb(value);
  if (value.startsWith('hsl')) return parseHsl(value);
  return null;
}

// ---------------------------------------------------------------------------
// 2. Relative luminance and contrast ratio (WCAG 2.2)
// ---------------------------------------------------------------------------

function sRGBtoLinear(c: number): number {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: RGB): number {
  const adjustAlpha = (c: number) => c * rgb.alpha + 0 * (1 - rgb.alpha);
  const r = sRGBtoLinear(adjustAlpha(rgb.r));
  const g = sRGBtoLinear(adjustAlpha(rgb.g));
  const b = sRGBtoLinear(adjustAlpha(rgb.b));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: RGB, b: RGB): number {
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return lighter === darker ? 1 : (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// 3. CSS token extraction & resolution
// ---------------------------------------------------------------------------

interface TokenPair {
  name: string;
  fg: string;
  bg: string;
  minRatio: number;
  type: 'normal' | 'large' | 'ui';
  /** If true, failure is expected (decorative/secondary) and gets a warning instead */
  decorative?: boolean;
}

const TOKEN_PAIRS: TokenPair[] = [
  // Normal text — 4.5:1 required
  { name: 'text-primary on bg-primary',       fg: '--color-text-primary',    bg: '--color-bg-primary',     minRatio: 4.5, type: 'normal' },
  { name: 'text-secondary on bg-primary',     fg: '--color-text-secondary',  bg: '--color-bg-primary',     minRatio: 4.5, type: 'normal' },
  { name: 'text-primary on bg-secondary',     fg: '--color-text-primary',    bg: '--color-bg-secondary',   minRatio: 4.5, type: 'normal' },
  { name: 'text-secondary on bg-secondary',   fg: '--color-text-secondary',  bg: '--color-bg-secondary',   minRatio: 4.5, type: 'normal' },
  { name: 'text-primary on bg-panel',         fg: '--color-text-primary',    bg: '--color-bg-panel',       minRatio: 4.5, type: 'normal' },
  { name: 'text-secondary on bg-panel',       fg: '--color-text-secondary',  bg: '--color-bg-panel',       minRatio: 4.5, type: 'normal' },
  { name: 'accent on bg-primary',             fg: '--color-accent',          bg: '--color-bg-primary',     minRatio: 4.5, type: 'normal' },
  { name: 'success on bg-primary',            fg: '--color-success',         bg: '--color-bg-primary',     minRatio: 4.5, type: 'normal' },
  { name: 'warning on bg-primary',            fg: '--color-warning',         bg: '--color-bg-primary',     minRatio: 4.5, type: 'normal' },
  { name: 'error on bg-primary',              fg: '--color-error',           bg: '--color-bg-primary',     minRatio: 4.5, type: 'normal' },
  { name: 'info on bg-primary',               fg: '--color-info',            bg: '--color-bg-primary',     minRatio: 4.5, type: 'normal' },
  { name: 'text-primary on bg-canvas',        fg: '--color-text-primary',    bg: '--color-bg-canvas',      minRatio: 4.5, type: 'normal' },
  { name: 'text-primary on card-bg',          fg: '--color-text-primary',    bg: '--color-card-bg',        minRatio: 4.5, type: 'normal' },
  { name: 'text-primary on bg-elevated',      fg: '--color-text-primary',    bg: '--color-bg-elevated',    minRatio: 4.5, type: 'normal' },
  { name: 'text-primary on bg-app',           fg: '--color-text-primary',    bg: '--color-bg-app',         minRatio: 4.5, type: 'normal' },
  { name: 'validity-high on bg-primary',      fg: '--validity-high',         bg: '--color-bg-primary',     minRatio: 4.5, type: 'normal' },
  { name: 'validity-critical on bg-primary',  fg: '--validity-critical',     bg: '--color-bg-primary',     minRatio: 4.5, type: 'normal' },
  { name: 'text-inverse on accent',           fg: '--color-text-inverse',    bg: '--color-accent',         minRatio: 4.5, type: 'normal' },

  // Large text / secondary — 3:1 required
  { name: 'text-muted on bg-primary',         fg: '--color-text-muted',      bg: '--color-bg-primary',     minRatio: 3,   type: 'large' },
  { name: 'text-muted on bg-secondary',       fg: '--color-text-muted',      bg: '--color-bg-secondary',   minRatio: 3,   type: 'large' },
  { name: 'text-muted on bg-panel',           fg: '--color-text-muted',      bg: '--color-bg-panel',       minRatio: 3,   type: 'large' },
  { name: 'text-muted on bg-canvas',          fg: '--color-text-muted',      bg: '--color-bg-canvas',      minRatio: 3,   type: 'large' },
  { name: 'text-primary on card-bg',          fg: '--color-text-primary',    bg: '--color-card-bg',        minRatio: 4.5, type: 'large' },
  { name: 'text-secondary on card-bg',        fg: '--color-text-secondary',  bg: '--color-card-bg',        minRatio: 4.5, type: 'large' },

  // UI components — 3:1 required
  { name: 'border-focus on bg-primary',       fg: '--border-focus',          bg: '--color-bg-primary',     minRatio: 3,   type: 'ui' },
  { name: 'border-default on bg-primary',     fg: '--border-default',        bg: '--color-bg-primary',     minRatio: 3,   type: 'ui' },
  { name: 'text-inverse on accent-bg',        fg: '--color-text-inverse',    bg: '--color-accent-active',  minRatio: 3,   type: 'ui' },
  { name: 'text-muted on bg-elevated',        fg: '--color-text-muted',      bg: '--color-bg-panel-elevated', minRatio: 3, type: 'ui' },

  // Decorative/ambient — 1.5:1 (informational only, not accessibility-critical)
  { name: 'border-subtle on bg-primary',      fg: '--border-subtle',         bg: '--color-bg-primary',     minRatio: 1.5, type: 'ui', decorative: true },
  { name: 'accent-subtle on bg-primary',      fg: '--color-accent-subtle',   bg: '--color-bg-primary',     minRatio: 1.5, type: 'ui', decorative: true },
];

interface AuditResult {
  name: string;
  fg: string;
  bg: string;
  fgResolved: string;
  bgResolved: string;
  ratio: number;
  required: number;
  pass: boolean;
  type: string;
  decorative: boolean;
  status: 'pass' | 'fail' | 'warn';
}

function extractCSSVariables(cssContent: string): Map<string, string> {
  // Strip CSS comments before parsing
  const clean = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
  const vars = new Map<string, string>();
  const regex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+?)(?=\s*(?:;|$))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(clean)) !== null) {
    const name = '--' + match[1];
    const value = match[2].trim();
    vars.set(name, value);
  }
  return vars;
}

/**
 * Resolve CSS variable references with full chain traversal.
 * Handles nested var(--a, var(--b, default)) patterns.
 */
function resolveVarValue(value: string, variables: Map<string, string>, depth = 0): string {
  if (depth > 20) return value;
  return value.replace(/var\(([^)]+)\)/g, (_, inner) => {
    const parts = inner.split(',').map((p) => p.trim());
    const varName = parts[0].trim();
    const fallback = parts.length > 1 ? parts.slice(1).join(',') : undefined;
    // Normalize: some vars in tokens.css lack the -- prefix in var() references
    const lookupName = varName.startsWith('--') ? varName : '--' + varName;
    const resolved = variables.get(lookupName);
    if (resolved !== undefined) {
      return resolveVarValue(resolved, variables, depth + 1);
    }
    if (fallback !== undefined) {
      return resolveVarValue(fallback, variables, depth + 1);
    }
    // If we can't resolve at all, try without -- prefix
    if (lookupName !== varName) {
      const alt = variables.get(varName);
      if (alt !== undefined) return resolveVarValue(alt, variables, depth + 1);
    }
    return value;
  });
}

/** Run contrast checks on all defined token pairs */
export function auditContrast(cssContent: string): AuditResult[] {
  const variables = extractCSSVariables(cssContent);

  // Also extract from control-room theme if present
  // (both themes share the same variable names in their respective :root scopes)

  return TOKEN_PAIRS.map((pair) => {
    const rawFg = variables.get(pair.fg) ?? '';
    const rawBg = variables.get(pair.bg) ?? '';

    const resolvedFg = resolveVarValue(rawFg, variables);
    const resolvedBg = resolveVarValue(rawBg, variables);

    const fgColor = parseColor(resolvedFg);
    const bgColor = parseColor(resolvedBg);

    let ratio = 0;
    let pass = false;
    let status: 'pass' | 'fail' | 'warn' = 'pass';

    if (fgColor && bgColor) {
      ratio = contrastRatio(fgColor, bgColor);
      pass = ratio >= pair.minRatio;
      if (pass && pair.type === 'normal' && ratio < pair.minRatio * 1.15) {
        status = 'warn';
      } else if (pass) {
        status = 'pass';
      } else if (pair.decorative) {
        status = 'warn';
      } else {
        status = 'fail';
      }
    } else {
      // Can't resolve colors — mark as fail with 0 ratio
      ratio = 0;
      pass = false;
      status = 'fail';
    }

    return {
      name: pair.name,
      fg: pair.fg,
      bg: pair.bg,
      fgResolved: resolvedFg,
      bgResolved: resolvedBg,
      ratio: Math.round(ratio * 100) / 100,
      required: pair.minRatio,
      pass,
      type: pair.type,
      decorative: !!pair.decorative,
      status,
    };
  });
}

/** Format audit results for terminal output */
export function formatAuditReport(results: AuditResult[]): string {
  const failures = results.filter((r) => r.status === 'fail');
  const warnings = results.filter((r) => r.status === 'warn');
  const passes = results.filter((r) => r.status === 'pass');

  let output = '\n';
  output += '═══════════════════════════════════════════════════════════════════\n';
  output += '  COLOR CONTRAST AUDIT — Design System Token Palette\n';
  output += '  WCAG 2.2 AA Compliance Check\n';
  output += '═══════════════════════════════════════════════════════════════════\n\n';

  if (failures.length === 0) {
    output += '  ✅ ALL CONTRAST CHECKS PASSED\n\n';
  } else {
    output += `  ❌ ${failures.length} FAILURES FOUND\n\n`;
  }

  // Summary table
  output += '  Token Pair                               │ Ratio │ Req  │ Status\n';
  output += '  ─────────────────────────────────────────│──────│──────│──────\n';

  for (const r of results) {
    let status: string;
    if (r.status === 'pass') status = '✅ PASS';
    else if (r.status === 'fail') status = '❌ FAIL';
    else status = '⚠️  WARN';
    output += `  ${r.name.padEnd(39)}│ ${r.ratio.toFixed(2).padStart(6)} │ ${r.required.toFixed(1).padStart(5)} │ ${status}\n`;
  }

  if (failures.length > 0) {
    output += `\n  ❌ FAILURES:\n`;
    for (const f of failures) {
      output += `     - ${f.name}: ${f.ratio.toFixed(2)}:1 (need ${f.required}:1)\n`;
      output += `       Fg: ${f.fgResolved} | Bg: ${f.bgResolved}\n`;
    }
  }

  if (warnings.length > 0) {
    output += `\n  ⚠️  WARNINGS (${warnings.length} marginal or decorative):\n`;
    for (const w of warnings) {
      output += `     - ${w.name} (${w.ratio.toFixed(2)}:1 vs ${w.required}:1 required)`;
      if (w.decorative) output += ' [decorative]';
      output += '\n';
    }
  }

  output += '\n  ───────────────────────────────────────────────────────────────\n';
  output += `  Total: ${results.length} | Passed: ${passes.length} | Warned: ${warnings.length} | Failed: ${failures.length}\n`;
  output += '═══════════════════════════════════════════════════════════════════\n';

  return output;
}

// ---------------------------------------------------------------------------
// 5. CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const cssPath = path.resolve(__dirname, './tokens.css');

  if (!existsSync(cssPath)) {
    console.error(`Token file not found: ${cssPath}`);
    return 1;
  }

  const cssContent = readFileSync(cssPath, 'utf-8');
  const results = auditContrast(cssContent);

  console.log(formatAuditReport(results));

  const failures = results.filter((r) => r.status === 'fail');
  if (failures.length > 0) {
    return 1;
  }
  return 0;
}

main().then((code) => process.exit(code)).catch((e) => {
  console.error(e);
  process.exit(1);
});