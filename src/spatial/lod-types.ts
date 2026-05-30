// LodRenderer — Level of Detail types
// S-02: Integer permille for health/weight. Deterministic tick counter for animation.
// Pure TypeScript — no Svelte, no DOM.

/** Discrete LOD levels */
export type LodLevel = 0 | 1 | 2 | 3;

/** Zoom thresholds for LOD transitions */
export interface LodThresholds {
  /** Zoom >= l0 → L0 (full). Default 0.8. */
  l0: number;
  /** Zoom >= l1 → L1 (compact). Default 0.4. */
  l1: number;
  /** Zoom >= l2 → L2 (dot/chip). Default 0.15. */
  l2: number;
  /** Zoom < l2 → L3 (pixel field). */
}

/** Default LOD thresholds matching ADR spec */
export const DEFAULT_LOD_THRESHOLDS: LodThresholds = {
  l0: 0.8,
  l1: 0.4,
  l2: 0.15,
};

/** LOD renderer configuration */
export interface LodRendererConfig {
  /** Zoom thresholds */
  thresholds?: LodThresholds;
  /** Cross-fade transition duration in ms. Default 300. */
  crossFadeDuration?: number;
}

/** Per-cell LOD state tracked by the renderer */
export interface CellLodState {
  cellId: string;
  /** Current active LOD level */
  currentLevel: LodLevel;
  /** Previous LOD level (for cross-fade) */
  previousLevel: LodLevel | null;
  /** Transition progress: 0 = showing previous, 1 = showing current. Null if not transitioning. */
  transitionProgress: number | null;
  /** Timestamp when transition started */
  transitionStart: number | null;
}

/** Resolve zoom factor to LOD level */
export function zoomToLod(zoom: number, thresholds: LodThresholds = DEFAULT_LOD_THRESHOLDS): LodLevel {
  if (zoom >= thresholds.l0) return 0;
  if (zoom >= thresholds.l1) return 1;
  if (zoom >= thresholds.l2) return 2;
  return 3;
}

/** LOD level descriptions for accessibility */
export const LOD_DESCRIPTIONS: Record<LodLevel, string> = {
  0: 'Full: editable cell with titlebar and resize handles',
  1: 'Compact: title, type icon, first-line preview',
  2: 'Chip: colored circle with abbreviation',
  3: 'Pixel field: heat-mapped color mosaic',
};

/** L2 chip: 2-letter abbreviation from label */
export function chipAbbrev(label: string): string {
  const words = label.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}
