// Canvas Theme Helper — reads CSS custom properties at runtime for canvas rendering.
// Allows canvas components (FlowCanvas, ForceGraph, etc.) to respect runtime theming
// without hardcoded hex values.
//
// Usage:
//   const theme = getCanvasTheme();
//   context.fillStyle = theme.node;
//   context.strokeStyle = theme.accentRamp.solid;    // e.g. "rgb(184 115 51)"
//   context.fillStyle   = theme.accentRamp.alpha(0.3); // e.g. "rgba(184,115,51,0.3)"
//
// The helper reads from the document root's computed styles (or a provided element),
// so it picks up whatever theme and user accent the consumer has active.

interface SeverityPalette {
  critical: string;
  major: string;
  minor: string;
}

interface QuaternionPalette {
  i: string;
  j: string;
  k: string;
}

/** Runtime-derived accent ramp. Values are pre-parsed for Canvas 2D use. */
export interface AccentRamp {
  /** Solid accent — e.g. "rgb(184 115 51)" — use for borders, active edges, cursors. */
  solid: string;
  /** Lighter variant (+16% toward white in OKLab approximation). */
  hi: string;
  /** Darker variant (-22% toward black). */
  lo: string;
  /** Return an rgba string at the given alpha (0–1). */
  alpha: (a: number) => string;
}

interface CanvasTheme {
  bg: string;
  node: string;
  nodeBorder: string;
  nodeHover: string;
  nodeText: string;
  edgeLine: string;
  edgeFade: string;
  focus: string;
  severity: SeverityPalette;
  quaternion: QuaternionPalette;
  /** Accent ramp derived from the single seed (--accent-primary). */
  accentRamp: AccentRamp;
}

/**
 * Resolve a CSS custom property to its computed value from a target element.
 * Falls back to the provided default if the property is undefined or SSR.
 */
function resolveCssVar(name: string, fallback: string, el: Element = document.documentElement): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

// --- Accent ramp derivation -------------------------------------------------
// Canvas 2D cannot use CSS color-mix(). We derive the ramp in JS by parsing
// the accent seed and adjusting lightness. This mirrors what tokens.css does
// via color-mix, keeping canvas rendering in sync with CSS theming.

/** Parse a hex color string to [r, g, b] (0–255). Falls back to brass. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length === 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return [184, 115, 51]; // brass fallback
}

/** Linear-interpolate a channel toward white (positive t) or black (negative t). */
function tint(c: number, t: number): number {
  return Math.round(t > 0 ? c + (255 - c) * t : c + c * t);
}

/**
 * Build an AccentRamp from an RGB triplet.
 * hi  ≈ color-mix(in oklab, seed, #fff 16%)
 * lo  ≈ color-mix(in oklab, seed, #000 22%)
 */
function buildRamp(r: number, g: number, b: number): AccentRamp {
  const hiR = tint(r, 0.16), hiG = tint(g, 0.16), hiB = tint(b, 0.16);
  const loR = tint(r, -0.22), loG = tint(g, -0.22), loB = tint(b, -0.22);
  return {
    solid: `rgb(${r} ${g} ${b})`,
    hi:    `rgb(${hiR} ${hiG} ${hiB})`,
    lo:    `rgb(${loR} ${loG} ${loB})`,
    alpha: (a: number) => `rgba(${r},${g},${b},${a})`,
  };
}

/**
 * Resolve the accent seed and return a canvas-ready AccentRamp.
 * Reads --accent-primary from the target element's computed styles.
 * Call once per frame (or on theme change) and cache the result.
 */
export function resolveAccentRamp(el: Element = document.documentElement): AccentRamp {
  if (typeof document === 'undefined') return buildRamp(184, 115, 51);
  const seed = getComputedStyle(el).getPropertyValue('--accent-primary').trim() || '#b87333';
  const [r, g, b] = hexToRgb(seed);
  return buildRamp(r, g, b);
}

/**
 * Get the current canvas theme by reading CSS custom properties.
 * This enables runtime theming for all canvas-based components.
 * Pass a container element to resolve tokens scoped to a ThemeProvider.
 */
export function getCanvasTheme(el: Element = document.documentElement): CanvasTheme {
  const ramp = resolveAccentRamp(el);
  const rv = (name: string, fb: string) => resolveCssVar(name, fb, el);
  return {
    bg:         rv('--color-bg-canvas', '#121518'),
    node:       rv('--color-bg-panel',  '#181c20'),
    nodeBorder: ramp.solid,
    nodeHover:  rv('--color-bg-panel-elevated', '#20252a'),
    nodeText:   rv('--color-text-primary',      '#e7e9eb'),
    edgeLine:   ramp.solid,
    edgeFade:   ramp.alpha(0.3),
    focus:      rv('--color-warning',           '#d8a23c'),
    severity: {
      critical: rv('--color-error',          '#cf4e4e'),
      major:    rv('--color-warning',         '#d8a23c'),
      minor:    rv('--color-text-tertiary',   '#646b72'),
    },
    quaternion: {
      i: ramp.hi,
      j: rv('--color-success', '#3fae9f'),
      k: rv('--color-warning', '#d8a23c'),
    },
    accentRamp: ramp,
  };
}

export type { AccentRamp, CanvasTheme };
