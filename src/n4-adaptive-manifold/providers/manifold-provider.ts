// ManifoldProvider — S³ stereographic projection layout.
// Pure arithmetic: quaternion orientation → 2D disk coordinates.
// O(n), deterministic, zero simulation.
//
// Agents: projected from actual [w,i,j,k] via isometric rotation + orthographic flatten.
// Tasks: positioned by rotation_axis metadata, row-packed within axis clusters.
//
// S-02: no Math.random, no HashMap — all placement is arithmetic.

import type {
  ManifoldSnapshot,
  AlgorithmProvider,
  LayoutAlgorithm,
} from '../types.js';
import type { NodeLayout, LayoutResult } from '../../n1-flow-canvas/types.js';

// ── Node sizes (symbol body only, not flag extent) ──────────────────────────

function nodeSize(kind: string, status: string): { w: number; h: number } {
  switch (kind) {
    case 'agent': return { w: 54, h: 48 };
    case 'task':  return status === 'active' ? { w: 120, h: 32 } : { w: 90, h: 26 };
    case 'signal': return { w: 28, h: 24 };
    default:      return { w: 90, h: 26 };
  }
}

// ── Axis mapping ─────────────────────────────────────────────────────────────
// i = Accumulation (left), j = Actuation (right), k = Relation (top)
// These are the canonical axis positions on the projected disk.

const AXIS_POSITIONS: Record<string, { x: number; y: number }> = {
  accumulation: { x: -0.6, y: 0.0 },   // i-axis → left
  actuation:    { x: 0.6, y: 0.0 },    // j-axis → right
  relation:     { x: 0.0, y: -0.6 },   // k-axis → top
};

// Hybrid axis positions are interpolated between the two axes.
function hybridPosition(
  axisA: string,
  weightA: number,
  axisB: string,
  weightB: number,
): { x: number; y: number } {
  const a = AXIS_POSITIONS[axisA] ?? { x: 0, y: 0 };
  const b = AXIS_POSITIONS[axisB] ?? { x: 0, y: 0 };
  return {
    x: a.x * weightA + b.x * weightB,
    y: a.y * weightA + b.y * weightB,
  };
}

// Column-based fallback positions — spread tasks across the disk by TOS lifecycle stage.
// Used when rotation_axis metadata is not yet set (common during early pipeline stages).
// Positions are in normalized disk coordinates [-1, 1].
// Cluster centers are separated so that KiCad flags (~140px wide) don't overlap
// across clusters. Flags flip direction at x > 55% viewport width, so left-side
// clusters extend right and right-side clusters extend left — keep same-Y clusters
// at least 0.45 normalized units apart in X (~180px at 960px canvas width).
const COLUMN_POSITIONS: Record<string, { x: number; y: number }> = {
  SEED:    { x: -0.62, y: -0.28 }, // upper-left  — proposing, accumulating
  SPROUT:  { x: -0.22, y: -0.70 }, // top-center  — growing, active
  WEED:    { x: -0.62, y:  0.42 }, // lower-left  — being weeded
  GO:      { x:  0.65, y:  0.02 }, // right        — actuating, running
  CONSULT: { x:  0.52, y: -0.52 }, // upper-right  — relation, consulting
  FREEZE:  { x:  0.52, y:  0.50 }, // lower-right  — blocked, frozen
  COMPOST: { x:  0.00, y:  0.65 }, // bottom       — completed
  PRUNE:   { x:  0.22, y:  0.65 }, // bottom-right — pruned
};

// Parse rotation_axis string back to a 2D position.
// Pure axis: "actuation" → AXIS_POSITIONS["actuation"]
// Hybrid: "accumulation:0.6,actuation:0.4" → interpolated
// Null with cluster hint: falls back to column-based spread position.
function axisToPosition(
  rotationAxis: string | null | undefined,
  cluster?: string | null,
): { x: number; y: number } {
  if (!rotationAxis) {
    // Fall back to column-based spread so tasks aren't all at center
    return COLUMN_POSITIONS[cluster ?? ''] ?? { x: 0, y: 0.3 };
  }

  if (rotationAxis.includes(',')) {
    // Hybrid format: "axisA:weightA,axisB:weightB"
    const parts = rotationAxis.split(',');
    const [axisA, wA] = parts[0].split(':');
    const [axisB, wB] = parts[1].split(':');
    return hybridPosition(axisA, parseFloat(wA), axisB, parseFloat(wB));
  }

  return AXIS_POSITIONS[rotationAxis] ?? { x: 0, y: 0.3 };
}

// ── Agent projection: quaternion [w,i,j,k] → 2D disk ────────────────────────
//
// The quaternion imaginary components (i, j, k) form a point inside the unit ball
// (since |q|=1, we have i²+j²+k² ≤ 1). We apply an isometric rotation to get a
// good viewing angle, then orthographically project to 2D.
//
// Isometric rotation: rotate 45° around Y, then 35.264° around X
// (the standard isometric viewing angle). This spreads the three axes evenly
// on the 2D plane.

const ISO_ANGLE_Y = Math.PI / 4;           // 45°
const ISO_ANGLE_X = Math.asin(1 / Math.sqrt(3)); // ~35.264°

function projectQuaternionToDisk(
  orientation: [number, number, number, number], // [w, i, j, k]
): { x: number; y: number } {
  const [, qi, qj, qk] = orientation;

  // Rotate around Y axis
  const cosY = Math.cos(ISO_ANGLE_Y);
  const sinY = Math.sin(ISO_ANGLE_Y);
  const rx = qi * cosY + qk * sinY;
  const ry = qj;
  const rz = -qi * sinY + qk * cosY;

  // Rotate around X axis
  const cosX = Math.cos(ISO_ANGLE_X);
  const sinX = Math.sin(ISO_ANGLE_X);
  const finalY = ry * cosX - rz * sinX;

  // Orthographic projection: drop Z
  return { x: rx, y: finalY };
}

// ── ManifoldProvider ─────────────────────────────────────────────────────────

export class ManifoldProvider implements AlgorithmProvider {
  readonly algorithm: LayoutAlgorithm = 'manifold';

  async layout(
    snapshot: ManifoldSnapshot,
    canvasWidth: number,
    canvasHeight: number,
  ): Promise<LayoutResult> {
    const { nodes, edges } = snapshot;
    if (nodes.length === 0) {
      return { positions: new Map(), bfsOrder: [] };
    }

    // Guard: if canvas hasn't been measured yet, return empty to avoid
    // collapsing all nodes to (0,0).
    if (canvasWidth < 100 || canvasHeight < 100) {
      return { positions: new Map(), bfsOrder: [] };
    }

    // Asymmetric disk radii — use more horizontal space since canvases are typically wider.
    // X uses 42% of width, Y uses 38% of height. This spreads nodes across the full viewport
    // rather than clustering near center.
    const diskRadiusX = canvasWidth * 0.42;
    const diskRadiusY = canvasHeight * 0.38;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const positions = new Map<string, NodeLayout>();

    // ── Separate agents and tasks ──────────────────────────────────────────
    const agents = nodes.filter(n => n.kind === 'agent');
    const tasks = nodes.filter(n => n.kind === 'task');
    const others = nodes.filter(n => n.kind !== 'agent' && n.kind !== 'task');

    // ── Agents: project from quaternion orientation ────────────────────────
    // Agents occupy the inner disk (45% radius) so they never land on top of
    // task clusters, which live on the full outer disk (100% radius).
    const AGENT_DISK_SCALE = 0.45;
    for (const agent of agents) {
      const size = nodeSize(agent.kind, agent.status);
      const proj = projectQuaternionToDisk(
        (agent.metadata.orientation as [number, number, number, number]) ?? [1, 0, 0, 0],
      );

      const x = centerX + proj.x * diskRadiusX * AGENT_DISK_SCALE - size.w / 2;
      const y = centerY + proj.y * diskRadiusY * AGENT_DISK_SCALE - size.h / 2;

      positions.set(agent.id, {
        id: agent.id,
        x,
        y,
        width: size.w,
        height: size.h,
      });
    }

    // ── Tasks: position by rotation axis, row-packed within clusters ───────
    // Group tasks by their axis position (normalized to a string key)
    const taskGroups = new Map<string, Array<{ task: typeof tasks[number]; pos: { x: number; y: number } }>>();
    for (const task of tasks) {
      const rotationAxis = task.hint?.rotation_axis as string | null | undefined;
      const cluster = task.hint?.cluster as string | null | undefined;
      const pos = axisToPosition(rotationAxis, cluster);
      const key = `${pos.x.toFixed(2)},${pos.y.toFixed(2)}`;
      if (!taskGroups.has(key)) taskGroups.set(key, []);
      taskGroups.get(key)!.push({ task, pos });
    }

    // Pack tasks within each cluster: row-major, left-to-right.
    //
    // Padding geometry (close-zoom KiCad flag constraints):
    //   Flag extends 118px from node center (tip=8 + body=110).
    //   Node half-width = 45px. Next col body starts at TASK_PAD_W - 45px.
    //   No-overlap condition: 118 < TASK_PAD_W - 45 → TASK_PAD_W > 163 → use 170.
    //   FLAG_H_HIT = 36px. No-overlap: TASK_PAD_H > 36 → use 40.
    //
    // MAX_COLS: uncapped sqrt(N). For large clusters (e.g. 207 SEED tasks) this
    // spreads wide (15 cols × 170px = 2550px), forcing fit-zoom below 0.8 (mid-tier
    // chips). At close zoom only ~6 cols are visible at once — no flag overlap.
    const TASK_PAD_W = 170;  // 118px flag extent + 52px margin → 7px gap to next col
    const TASK_PAD_H = 40;   // 36px FLAG_H_HIT + 4px gap

    for (const [key, group] of taskGroups) {
      const MAX_COLS = Math.max(1, Math.ceil(Math.sqrt(group.length)));
      const [cx, cy] = key.split(',').map(Number);
      const clusterCenterX = centerX + cx * diskRadiusX;
      const clusterCenterY = centerY + cy * diskRadiusY;

      const cols = Math.min(MAX_COLS, group.length);
      const totalWidth = cols * TASK_PAD_W;
      const startX = clusterCenterX - totalWidth / 2;
      const startY = clusterCenterY - TASK_PAD_H / 2;

      for (let i = 0; i < group.length; i++) {
        const { task } = group[i];
        const size = nodeSize(task.kind, task.status);
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = startX + col * TASK_PAD_W + (TASK_PAD_W - size.w) / 2;
        const y = startY + row * TASK_PAD_H + (TASK_PAD_H - size.h) / 2;

        positions.set(task.id, {
          id: task.id,
          x,
          y,
          width: size.w,
          height: size.h,
        });
      }
    }

    // ── Others (signals, etc.): place at center ────────────────────────────
    for (const node of others) {
      const size = nodeSize(node.kind, node.status);
      positions.set(node.id, {
        id: node.id,
        x: centerX - size.w / 2,
        y: centerY - size.h / 2,
        width: size.w,
        height: size.h,
      });
    }

    // ── BFS order for edge reveal ──────────────────────────────────────────
    const incoming = new Set(edges.map(e => e.target));
    const roots = nodes.filter(n => !incoming.has(n.id)).map(n => n.id);
    const visited = new Set<string>();
    const bfsOrder: string[] = [];
    const queue = [...roots];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      bfsOrder.push(id);
      for (const e of edges) {
        if (e.source === id && !visited.has(e.target)) queue.push(e.target);
      }
    }
    for (const n of nodes) {
      if (!visited.has(n.id)) bfsOrder.push(n.id);
    }

    return { positions, bfsOrder };
  }
}
