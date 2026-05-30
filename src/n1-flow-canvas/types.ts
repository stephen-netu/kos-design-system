// N1 Flow Canvas — Shared Types
// Pure TypeScript — no Svelte, no DOM dependencies
// S-02: all collections use Map/Array with deterministic ordering (no Set/Object spread iteration)

import type { Point, Size } from '../p0-primitives/types/geometry';

export type { Point, Size };

// === Graph Primitives ===

export interface GraphNode {
  id: string;
  label: string;
  /** Optional semantic data (task status, flow phase, etc.) */
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  /** Optional: task wt-NNN dependency references */
  label?: string;
}

// === GraphSnapshot — readonly, fed to ELK worker, never mutated during layout ===

export interface GraphSnapshot {
  readonly nodes: ReadonlyArray<GraphNode>;
  readonly edges: ReadonlyArray<GraphEdge>;
  /** Node id used as layout/BFS root */
  readonly focusNodeId: string | null;
}

// === Computed Layout ===

export interface NodeLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  /** Euclidean positions from ELK, keyed by node id */
  positions: Map<string, NodeLayout>;
  /** BFS traversal order starting from focusNodeId (or arbitrary root if null) */
  bfsOrder: ReadonlyArray<string>;
}

// === Worker Protocol ===

export interface WorkerIn {
  type: 'layout';
  snapshot: GraphSnapshot;
  /** Canvas dimensions for ELK bounds */
  canvasWidth: number;
  canvasHeight: number;
}

export interface WorkerOut {
  type: 'layout_result';
  result: LayoutResult;
}

export type WorkerMessage = WorkerIn | WorkerOut;

// === GraphState — mutable, holds Spring-wrapped positions ===
// Implemented in graph-state.svelte.ts (Svelte 5 runes required)
// Defined here as an interface for type-checking without Svelte dependency

export interface GraphStateApi {
  /** Current node positions (Spring targets). Read these for rendering. */
  readonly positions: Map<string, NodeLayout>;
  /** Current BFS order for edge reveal animation */
  readonly bfsOrder: ReadonlyArray<string>;
  /** Update Spring targets from a completed layout. Does NOT reset current positions. */
  applyLayout(result: LayoutResult): void;
  /** Re-center Poincaré disk on this node. Does NOT trigger re-layout. */
  setFocusCenter(nodeId: string): void;
  /** Mark ELK layout root. Triggers worker re-compute. */
  setLayoutRoot(nodeId: string): void;
}

// === Edge Reveal Animation ===

export interface EdgeRevealState {
  /** Edge id → current lineDashOffset (0.0 = fully drawn, 1.0 = hidden) */
  offsets: Map<string, number>;
}

/** Stagger delay per BFS wave step (ms). Deterministic — no Math.random. */
export const EDGE_REVEAL_STAGGER_MS = 30;

// === Geometry (imported from p0-primitives, re-exported for convenience) ===
