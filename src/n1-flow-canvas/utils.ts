// N1 Flow Canvas — Generic graph adapter utilities
// These are the reusable algorithms; apps supply their own domain types + config.
// S-02: all collections use Map/Array — no Set iteration order assumptions

import type { GraphEdge, NodeLayout } from './types.js';

// ── Hit testing ───────────────────────────────────────────────────────────────

/**
 * Returns the id of the first node whose layout rect contains (x, y), or null.
 *
 * When the canvas element is scaled (CSS width ≠ canvas pixel width), pass
 * scaleX/scaleY to convert event coordinates before testing.
 *
 * @param x       - click x in canvas pixel space
 * @param y       - click y in canvas pixel space
 * @param positions - GraphState.positions map
 */
export function nodeHitTest(
  x: number,
  y: number,
  positions: Map<string, NodeLayout>,
): string | null {
  for (const [id, layout] of positions) {
    if (
      x >= layout.x &&
      x <= layout.x + layout.width &&
      y >= layout.y &&
      y <= layout.y + layout.height
    ) {
      return id;
    }
  }
  return null;
}

/**
 * Convert a DOM click event on a container element to canvas pixel coordinates,
 * accounting for CSS scaling between container size and canvas resolution.
 */
export function domEventToCanvasCoords(
  event: MouseEvent,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const scaleX = canvasWidth  / rect.width;
  const scaleY = canvasHeight / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top)  * scaleY,
  };
}

// ── Edge inference ────────────────────────────────────────────────────────────

/**
 * Parse directed dependency edges by scanning each item's description for
 * regex matches that reference another item's id.
 *
 * Generic — works for any item type. Apps supply:
 * - `idFn`   — extract the item's own id
 * - `descFn` — extract the text to scan (description, notes, etc.)
 * - `mentionRegex` — must have one capture group yielding the referenced id
 * - `mentionToId`  — convert regex capture to a canonical id (e.g. `m => 'wt-' + m`)
 *
 * @example KOS usage:
 *   parseMentionEdges(tasks, t => t.id, t => t.description ?? '', /wt-(\d+)/g, m => `wt-${m}`)
 */
export function parseMentionEdges<T>(
  items: T[],
  idFn: (item: T) => string,
  descFn: (item: T) => string,
  mentionRegex: RegExp,
  mentionToId: (capture: string) => string,
  edgesMap: Map<string, GraphEdge> = new Map(),
): Map<string, GraphEdge> {
  const knownIds = new Set(items.map(idFn));

  for (const item of items) {
    const sourceId = idFn(item);
    const text = descFn(item);
    if (!text) continue;

    for (const match of text.matchAll(mentionRegex)) {
      const targetId = mentionToId(match[1]);
      if (!knownIds.has(targetId)) continue;

      const edgeId = `${sourceId}->${targetId}`;
      if (edgesMap.has(edgeId)) continue;

      edgesMap.set(edgeId, {
        id:       edgeId,
        sourceId,
        targetId,
        label:    'depends_on',
      });
    }
  }

  return edgesMap;
}

/**
 * Create sequential "related" edges between items that share the same group key,
 * ordered by a sort key. Produces a chain: group[0]→group[1]→group[2]…
 *
 * Generic — apps supply:
 * - `idFn`       — extract item id
 * - `groupKeyFn` — items with the same key become a chain (e.g. domain+workspace)
 * - `sortKeyFn`  — ordering within each group (e.g. createdAt string, or id)
 *
 * @example KOS usage:
 *   parseGroupedSequenceEdges(tasks, t => t.id,
 *     t => `${t.domain ?? ''}:${t.workspace ?? ''}`,
 *     t => t.createdAt ?? t.id)
 */
export function parseGroupedSequenceEdges<T>(
  items: T[],
  idFn: (item: T) => string,
  groupKeyFn: (item: T) => string,
  sortKeyFn: (item: T) => string,
  edgesMap: Map<string, GraphEdge> = new Map(),
): Map<string, GraphEdge> {
  const sorted = [...items].sort((a, b) => sortKeyFn(a).localeCompare(sortKeyFn(b)));

  const groups = new Map<string, T[]>();
  for (const item of sorted) {
    const key = groupKeyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  for (const groupItems of groups.values()) {
    if (groupItems.length < 2) continue;
    for (let i = 0; i < groupItems.length - 1; i++) {
      const sourceId = idFn(groupItems[i]);
      const targetId = idFn(groupItems[i + 1]);
      const edgeId   = `${sourceId}->${targetId}`;
      if (edgesMap.has(edgeId)) continue;
      edgesMap.set(edgeId, { id: edgeId, sourceId, targetId, label: 'related' });
    }
  }

  return edgesMap;
}
