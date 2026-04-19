import type { PhaseTheme, PhaseVisualParams } from './types.js';

const PHASES = ['seed', 'sprout', 'go', 'consult', 'weed', 'freeze', 'compost', 'prune'] as const;

function resolvePhaseParams(
  style: CSSStyleDeclaration,
  phase: string,
): PhaseVisualParams {
  const get = (prop: string) =>
    style.getPropertyValue(`--n4-phase-${phase}-${prop}`).trim();

  return {
    background: get('background') || '#1a1a1a',
    brightness: parseFloat(get('brightness')) || 0.5,
    indicatorIntensity: parseFloat(get('indicator-intensity')) || 0.5,
    ambientPulseSpeed: parseFloat(get('pulse-speed')) || 3,
    saturation: parseFloat(get('saturation')) || 0.8,
  };
}

/**
 * Resolve PhaseTheme from CSS custom properties on a container element.
 * Re-call on data-theme or class mutation.
 */
export function resolvePhaseTheme(el: HTMLElement): PhaseTheme {
  const style = getComputedStyle(el);
  const theme: Record<string, PhaseVisualParams> = {};
  for (const phase of PHASES) {
    theme[phase] = resolvePhaseParams(style, phase);
  }
  return theme as unknown as PhaseTheme;
}

/** Fallback theme if CSS tokens are not set */
export const DEFAULT_PHASE_THEME: PhaseTheme = {
  seed: {
    background: '#1a1a1a',
    brightness: 0.4,
    indicatorIntensity: 0.3,
    ambientPulseSpeed: 4,
    saturation: 0.6,
  },
  sprout: {
    background: '#1a1c1a',
    brightness: 0.7,
    indicatorIntensity: 0.7,
    ambientPulseSpeed: 2.5,
    saturation: 0.85,
  },
  go: {
    background: '#1c1a18',
    brightness: 1.0,
    indicatorIntensity: 1.0,
    ambientPulseSpeed: 1.5,
    saturation: 1.0,
  },
  consult: {
    background: '#1b1a1c',
    brightness: 0.85,
    indicatorIntensity: 0.85,
    ambientPulseSpeed: 2.0,
    saturation: 0.9,
  },
  weed: {
    background: '#1c1b18',
    brightness: 0.65,
    indicatorIntensity: 0.6,
    ambientPulseSpeed: 2.5,
    saturation: 0.75,
  },
  freeze: {
    background: '#1a1a1e',
    brightness: 0.2,
    indicatorIntensity: 0.1,
    ambientPulseSpeed: 8,
    saturation: 0.2,
  },
  compost: {
    background: '#1a1a1a',
    brightness: 0.25,
    indicatorIntensity: 0.15,
    ambientPulseSpeed: 6,
    saturation: 0.3,
  },
  prune: {
    background: '#1c1a1a',
    brightness: 0.2,
    indicatorIntensity: 0.1,
    ambientPulseSpeed: 8,
    saturation: 0.2,
  },
};
