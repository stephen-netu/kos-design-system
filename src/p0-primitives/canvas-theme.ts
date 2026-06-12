// Canvas Theme Helper — reads CSS custom properties at runtime for canvas rendering
// Allows canvas components (FlowCanvas, ForceGraph, etc.) to respect runtime theming
// without hardcoded hex values.
//
// Usage:
//   const theme = getCanvasTheme();
//   context.fillStyle = theme.node;
//
// The helper reads from the document root's computed styles, so it picks up
// whatever theme the user has active (default dark, light, control-room, etc.).

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
}

/**
 * Resolve a CSS custom property to its computed value.
 * Falls back to the provided default if the property is undefined.
 */
function resolveCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const computed = getComputedStyle(document.documentElement).getPropertyValue(name);
  return computed.trim() || fallback;
}

/**
 * Get the current canvas theme by reading CSS custom properties.
 * This enables runtime theming for all canvas-based components.
 */
export function getCanvasTheme(): CanvasTheme {
  return {
    bg: resolveCssVar('--color-bg-canvas', '#1a1a1a'),
    node: resolveCssVar('--color-bg-panel', '#2a2a2a'),
    nodeBorder: resolveCssVar('--color-accent', '#b87333'),
    nodeHover: resolveCssVar('--color-bg-panel-elevated', '#3a3a3a'),
    nodeText: resolveCssVar('--color-text-primary', '#e8e0d0'),
    edgeLine: resolveCssVar('--color-accent', '#b87333'),
    edgeFade: resolveCssVar('--color-accent-muted', '#5a4a30'),
    focus: resolveCssVar('--color-warning', '#d4943a'),
    severity: {
      critical: resolveCssVar('--color-status-error', '#c14a4a'),
      major: resolveCssVar('--color-warning', '#d4a04c'),
      minor: resolveCssVar('--color-text-tertiary', '#6b6558'),
    },
    quaternion: {
      i: resolveCssVar('--accent-hover', '#d4892f'),
      j: resolveCssVar('--color-success', '#4fa8a2'),
      k: resolveCssVar('--color-warning', '#d4a04c'),
    },
  };
}

export type { CanvasTheme };
