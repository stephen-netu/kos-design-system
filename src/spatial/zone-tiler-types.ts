// ZoneTiler — BSP tree zone layout types
// S-02: No HashMap/HashSet — use sorted arrays for zone lookup.
// Pure TypeScript — no Svelte, no DOM.

/** Privacy state matching Rust SealState enum */
export type PrivacyState = 'ouvert' | 'scelle';

/** Leaf node — a visible zone */
export interface ZoneLeaf {
  kind: 'leaf';
  id: string;
  label: string;
  /** Optional tint for zone background. Ouvert zones derive color from content; Scelle uses fixed hazard treatment. */
  colorTint?: string;
  privacyState: PrivacyState;
}

/** Split direction */
export type SplitDirection = 'horizontal' | 'vertical';

/** Internal split node — divides space into two children */
export interface ZoneSplit {
  kind: 'split';
  direction: SplitDirection;
  /** Divider position as fraction (0–1) of parent dimension */
  ratio: number;
  first: BspNode;
  second: BspNode;
}

/** A BSP tree node: either a leaf zone or a split */
export type BspNode = ZoneLeaf | ZoneSplit;

/** Computed zone rectangle (absolute pixel coords within container) */
export interface ZoneRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zone: ZoneLeaf;
}

/** Computed divider rectangle for hit-testing and rendering */
export interface DividerRect {
  /** Path from root to this split (for identity) */
  path: string;
  direction: SplitDirection;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Reference to parent split for ratio mutation */
  splitRef: ZoneSplit;
}

/** ZoneTiler configuration */
export interface ZoneTilerConfig {
  /** Minimum zone dimension in px. Default 120. */
  minZoneSize?: number;
  /** Divider thickness in px. Default 6. */
  dividerThickness?: number;
  /** Divider hit-area expansion in px (each side). Default 4. */
  dividerHitExpand?: number;
}

// ── BSP utilities ──────────────────────────────────────────────────────────

/** Flatten a BSP tree into leaf zones with computed rectangles */
export function flattenBsp(
  node: BspNode,
  x: number,
  y: number,
  w: number,
  h: number,
  dividerThickness: number
): { zones: ZoneRect[]; dividers: DividerRect[] } {
  if (node.kind === 'leaf') {
    return {
      zones: [{ id: node.id, x, y, width: w, height: h, zone: node }],
      dividers: [],
    };
  }

  const dt = dividerThickness;
  const { direction, ratio, first, second } = node;

  let firstRect: { x: number; y: number; w: number; h: number };
  let secondRect: { x: number; y: number; w: number; h: number };
  let divider: DividerRect;

  if (direction === 'horizontal') {
    // Split left/right
    const splitX = x + (w - dt) * ratio;
    firstRect = { x, y, w: splitX - x, h };
    secondRect = { x: splitX + dt, y, w: x + w - splitX - dt, h };
    divider = {
      path: `${x},${y}:h:${ratio.toFixed(4)}`,
      direction,
      x: splitX,
      y,
      width: dt,
      height: h,
      splitRef: node,
    };
  } else {
    // Split top/bottom
    const splitY = y + (h - dt) * ratio;
    firstRect = { x, y, w, h: splitY - y };
    secondRect = { x, y: splitY + dt, w, h: y + h - splitY - dt };
    divider = {
      path: `${x},${y}:v:${ratio.toFixed(4)}`,
      direction,
      x,
      y: splitY,
      width: w,
      height: dt,
      splitRef: node,
    };
  }

  const a = flattenBsp(first, firstRect.x, firstRect.y, firstRect.w, firstRect.h, dt);
  const b = flattenBsp(second, secondRect.x, secondRect.y, secondRect.w, secondRect.h, dt);

  return {
    zones: [...a.zones, ...b.zones],
    dividers: [divider, ...a.dividers, ...b.dividers],
  };
}

/** Find a zone leaf by id in the BSP tree */
export function findZone(node: BspNode, id: string): ZoneLeaf | null {
  if (node.kind === 'leaf') return node.id === id ? node : null;
  return findZone(node.first, id) ?? findZone(node.second, id);
}

/** Create a default single-zone BSP tree */
export function createDefaultBsp(id = 'main', label = 'Main'): ZoneLeaf {
  return { kind: 'leaf', id, label, privacyState: 'ouvert' };
}

/** Split a leaf zone into two zones. Returns a new BSP tree (immutable). */
export function splitZone(
  root: BspNode,
  targetId: string,
  direction: SplitDirection,
  newZone: ZoneLeaf,
  ratio = 0.5
): BspNode {
  if (root.kind === 'leaf') {
    if (root.id === targetId) {
      return {
        kind: 'split',
        direction,
        ratio,
        first: root,
        second: newZone,
      };
    }
    return root;
  }
  return {
    ...root,
    first: splitZone(root.first, targetId, direction, newZone, ratio),
    second: splitZone(root.second, targetId, direction, newZone, ratio),
  };
}

/** Serialize BSP tree to JSON (for desk persistence) */
export function serializeBsp(node: BspNode): string {
  return JSON.stringify(node);
}

/** Deserialize BSP tree from JSON */
export function deserializeBsp(json: string): BspNode {
  return JSON.parse(json) as BspNode;
}
