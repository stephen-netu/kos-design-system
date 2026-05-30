import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TOKENS_CSS_PATH = resolve(ROOT, 'src/p0-primitives/tokens/tokens.css');
const TOKENS_JSON_PATH = resolve(ROOT, 'src/p0-primitives/tokens/tokens.json');

/**
 * Categorization map: CSS custom-property name → dot-path in tokens.json.
 * e.g. ['colors', 'accent', 'primary'] → colors.accent.primary
 */
const CATEGORY_MAP: Record<string, string[]> = {
  // colors.core
  '--color-bg-app': ['colors', 'core', 'bgApp'],
  '--color-bg-canvas': ['colors', 'core', 'bgCanvas'],
  '--color-bg-panel': ['colors', 'core', 'bgPanel'],
  '--color-bg-panel-elevated': ['colors', 'core', 'bgPanelElevated'],
  '--color-card-bg': ['colors', 'core', 'cardBg'],
  '--color-card-bg-warm': ['colors', 'core', 'cardBgWarm'],
  '--color-card-bg-cool': ['colors', 'core', 'cardBgCool'],

  // colors.text
  '--color-text-primary': ['colors', 'text', 'primary'],
  '--color-text-secondary': ['colors', 'text', 'secondary'],
  '--color-text-tertiary': ['colors', 'text', 'tertiary'],
  '--color-text-muted': ['colors', 'text', 'muted'],
  '--color-text-inverse': ['colors', 'text', 'inverse'],
  '--color-card-text-primary': ['colors', 'text', 'cardPrimary'],
  '--color-card-text-secondary': ['colors', 'text', 'cardSecondary'],
  '--color-card-text-tertiary': ['colors', 'text', 'cardTertiary'],

  // colors.accent
  '--color-accent': ['colors', 'accent', 'primary'],
  '--color-accent-hover': ['colors', 'accent', 'hover'],
  '--color-accent-active': ['colors', 'accent', 'active'],
  '--color-accent-glow': ['colors', 'accent', 'glow'],
  '--color-accent-subtle': ['colors', 'accent', 'subtle'],
  '--color-accent-muted': ['colors', 'accent', 'muted'],
  '--color-accent-faint': ['colors', 'accent', 'faint'],

  // colors.status
  '--color-success': ['colors', 'status', 'success'],
  '--color-warning': ['colors', 'status', 'warning'],
  '--color-error': ['colors', 'status', 'error'],
  '--color-info': ['colors', 'status', 'info'],

  // colors.semantic
  '--color-online': ['colors', 'semantic', 'online'],
  '--color-offline': ['colors', 'semantic', 'offline'],
  '--color-away': ['colors', 'semantic', 'away'],
  '--color-busy': ['colors', 'semantic', 'busy'],
  '--color-typing': ['colors', 'semantic', 'typing'],

  // colors.border
  '--border-subtle': ['colors', 'border', 'subtle'],
  '--border-default': ['colors', 'border', 'default'],
  '--border-hover': ['colors', 'border', 'hover'],
  '--border-focus': ['colors', 'border', 'focus'],
  '--divider-color': ['colors', 'border', 'divider'],

  // typography.fonts
  '--font-sans': ['typography', 'fonts', 'sans'],
  '--font-mono': ['typography', 'fonts', 'mono'],
  '--font-serif': ['typography', 'fonts', 'serif'],

  // typography.scale
  '--text-xs': ['typography', 'scale', 'xs'],
  '--text-sm': ['typography', 'scale', 'sm'],
  '--text-base': ['typography', 'scale', 'base'],
  '--text-lg': ['typography', 'scale', 'lg'],
  '--text-xl': ['typography', 'scale', 'xl'],
  '--text-2xl': ['typography', 'scale', '2xl'],
  '--text-3xl': ['typography', 'scale', '3xl'],
  '--text-4xl': ['typography', 'scale', '4xl'],

  // spacing
  '--space-05': ['spacing', '05'],
  '--space-1': ['spacing', '1'],
  '--space-15': ['spacing', '15'],
  '--space-2': ['spacing', '2'],
  '--space-2': ['spacing', '2'],
  '--space-3': ['spacing', '3'],
  '--space-4': ['spacing', '4'],
  '--space-5': ['spacing', '5'],
  '--space-6': ['spacing', '6'],
  '--space-8': ['spacing', '8'],
  '--space-10': ['spacing', '10'],
  '--space-12': ['spacing', '12'],
  '--space-16': ['spacing', '16'],

  // radius
  '--radius-sm': ['radius', 'sm'],
  '--radius-md': ['radius', 'md'],
  '--radius-lg': ['radius', 'lg'],
  '--radius-xl': ['radius', 'xl'],
  '--radius-full': ['radius', 'full'],

  // shadows
  '--shadow-sm': ['shadows', 'sm'],
  '--shadow-md': ['shadows', 'md'],
  '--shadow-lg': ['shadows', 'lg'],
  '--shadow-xl': ['shadows', 'xl'],
  '--shadow-glow': ['shadows', 'glow'],
  '--shadow-glow-lg': ['shadows', 'glowLg'],
  '--shadow-inner': ['shadows', 'inner'],
  '--shadow-card': ['shadows', 'card'],
  '--shadow-card-hover': ['shadows', 'cardHover'],

  // animations (transitions)
  '--transition-fast': ['animations', 'fast'],
  '--transition-normal': ['animations', 'normal'],
  '--transition-slow': ['animations', 'slow'],
  '--transition-bounce': ['animations', 'bounce'],
  '--transition-spring': ['animations', 'spring'],

  // epistemic
  '--epistemic-cleared': ['epistemic', 'cleared'],
  '--epistemic-cleared-glow': ['epistemic', 'clearedGlow'],
  '--epistemic-blocked': ['epistemic', 'blocked'],
  '--epistemic-blocked-glow': ['epistemic', 'blockedGlow'],
  '--epistemic-pending': ['epistemic', 'pending'],
  '--epistemic-pending-glow': ['epistemic', 'pendingGlow'],
  '--epistemic-degraded': ['epistemic', 'degraded'],
  '--epistemic-degraded-glow': ['epistemic', 'degradedGlow'],
  '--epistemic-stage-0': ['epistemic', 'stage0'],
  '--epistemic-stage-1': ['epistemic', 'stage1'],
  '--epistemic-stage-2': ['epistemic', 'stage2'],
  '--epistemic-stage-3': ['epistemic', 'stage3'],
  '--epistemic-stage-4': ['epistemic', 'stage4'],
  '--epistemic-stage-5': ['epistemic', 'stage5'],
  '--epistemic-stage-5-glow': ['epistemic', 'stage5Glow'],

  // expert
  '--expert-atelier': ['expert', 'atelier'],
  '--expert-agora': ['expert', 'agora'],
  '--expert-ryu': ['expert', 'ryu'],
  '--expert-sovereign': ['expert', 'sovereign'],
  '--expert-agent': ['expert', 'agent'],
};

interface TokenEntry {
  varName: string;
  value: string;
}

function parseTokens(css: string): TokenEntry[] {
  const tokens: TokenEntry[] = [];
  const regex = /^\s*(--[\w-]+)\s*:\s*(.+?)\s*;/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(css)) !== null) {
    tokens.push({ varName: match[1], value: match[2] });
  }
  return tokens;
}

function setNested(obj: Record<string, unknown>, path: string[], value: string): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key]) current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

function buildJson(tokens: TokenEntry[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const uncategorized: Record<string, string> = {};

  for (const token of tokens) {
    const path = CATEGORY_MAP[token.varName];
    if (!path) {
      const key = token.varName.replace(/^--/, '').replace(/-/g, '_');
      uncategorized[key] = `var(${token.varName})`;
      continue;
    }
    setNested(result, path, `var(${token.varName})`);
  }

  if (Object.keys(uncategorized).length > 0) {
    result['_uncategorized'] = uncategorized;
  }

  return result;
}

function main(): void {
  if (!existsSync(TOKENS_CSS_PATH)) {
    console.error(`tokens.css not found at ${TOKENS_CSS_PATH}`);
    process.exit(1);
  }

  const css = readFileSync(TOKENS_CSS_PATH, 'utf-8');
  const tokens = parseTokens(css);
  const json = buildJson(tokens);

  const output = JSON.stringify(json, null, 2) + '\n';
  writeFileSync(TOKENS_JSON_PATH, output, 'utf-8');
  console.log(`Generated tokens.json: ${tokens.length} tokens → ${TOKENS_JSON_PATH}`);
}

main();
