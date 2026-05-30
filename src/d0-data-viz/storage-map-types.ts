// StorageMap — BSP treemap types (wt:sovra-1115)
// S-02: No HashMap/HashSet — use sorted arrays for lookups.
// Pure TypeScript — no Svelte, no DOM.

/** Ownership tier for a storage node */
export type OwnerTier = 'kos' | 'external' | 'unknown';

/** A single storage node in the treemap */
export interface StorageNode {
  path: string;
  bytes: number;
  ownerTier: OwnerTier;
  label?: string;
  children?: StorageNode[];
}

/** A flattened treemap cell ready for rendering */
export interface TreemapCell {
  path: string;
  label: string;
  bytes: number;
  ownerTier: OwnerTier;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Layout result from the squarified treemap algorithm */
export interface TreemapLayout {
  cells: TreemapCell[];
  totalBytes: number;
}

/** StorageMap component configuration */
export interface StorageMapConfig {
  /** Minimum cell dimension in px. Default 32. */
  minCellSize?: number;
  /** Gap between cells in px. Default 2. */
  gap?: number;
  /** Show path labels inside cells. Default true. */
  showLabels?: boolean;
}

/** Color palette per owner tier */
export const TIER_COLORS: Record<OwnerTier, { fill: string; stroke: string; text: string }> = {
  kos: {
    fill: 'rgba(184, 115, 51, 0.25)',
    stroke: 'rgba(184, 115, 51, 0.6)',
    text: '#d4a06a',
  },
  external: {
    fill: 'rgba(160, 152, 128, 0.15)',
    stroke: 'rgba(160, 152, 128, 0.4)',
    text: '#a09880',
  },
  unknown: {
    fill: 'rgba(90, 82, 69, 0.15)',
    stroke: 'rgba(90, 82, 69, 0.3)',
    text: '#706858',
  },
};

// ── Squarified treemap layout ──────────────────────────────────────────────

/**
 * Compute a squarified treemap layout for flat node lists.
 * S-02: deterministic — sorted by bytes descending, no randomness.
 * S-05: bounded — iterates finite node array.
 */
export function computeTreemap(
  nodes: StorageNode[],
  width: number,
  height: number,
  config: StorageMapConfig = {}
): TreemapLayout {
  const gap = config.gap ?? 2;
  const minCell = config.minCellSize ?? 32;

  // Sort descending by size (deterministic, S-02)
  const sorted = [...nodes].sort((a, b) => b.bytes - a.bytes);
  const totalBytes = sorted.reduce((sum, n) => sum + n.bytes, 0);

  if (totalBytes === 0 || sorted.length === 0) {
    return { cells: [], totalBytes: 0 };
  }

  const cells: TreemapCell[] = [];
  const aspectRatio = width / height;

  // Simple slice-and-dice treemap (row-based for readability)
  const usableWidth = width - gap * 2;
  const usableHeight = height - gap * 2;

  let x = gap;
  let y = gap;
  let rowHeight = usableHeight;

  // Group into rows based on aspect ratio
  const rowTarget = Math.max(1, Math.round(Math.sqrt(sorted.length / aspectRatio)));

  for (let i = 0; i < sorted.length; i += rowTarget) {
    const row = sorted.slice(i, i + rowTarget);
    const rowBytes = row.reduce((sum, n) => sum + n.bytes, 0);

    // Row height proportional to row's share of total
    const actualRowHeight = Math.max(minCell, (rowBytes / totalBytes) * usableHeight);

    let cellX = x;
    for (const node of row) {
      const cellWidth = Math.max(minCell, (node.bytes / rowBytes) * usableWidth);
      const label = node.label ?? node.path.split('/').pop() ?? node.path;

      cells.push({
        path: node.path,
        label,
        bytes: node.bytes,
        ownerTier: node.ownerTier,
        x: cellX,
        y,
        width: cellWidth - gap,
        height: actualRowHeight - gap,
      });

      cellX += cellWidth;
    }

    y += actualRowHeight;
  }

  return { cells, totalBytes };
}

/** Format bytes to human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log2(bytes) / 10);
  const clamped = Math.min(i, units.length - 1);
  const value = bytes / Math.pow(1024, clamped);
  return `${value.toFixed(clamped === 0 ? 0 : 1)} ${units[clamped]}`;
}
