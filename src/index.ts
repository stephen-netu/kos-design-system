// LEAP Design System — HDA-organized frontend primitives
// @kos/design-system
//
// Barrel: light layers only. Heavy modules (n1–n4, g0-geo, editor, v0-diagrams,
// spatial, fabric, map, x0-enchanted-blocks) are available via subpath imports only.

// CSS imports
import './base.css';
/* NOTE: control-room.css is opt-in via data-theme="control-room" — import it explicitly if needed */
import './p0-primitives/tokens/validity-tokens.css';
import './n0-node-graph/n0-tokens.css';
import './d0-data-viz/d0-tokens.css';

// B0 App Shell — Global LEAP chrome (CommandBar, intent dispatch, system state)
export * from './b0-app-shell';
// P0 Primitives — Shared types, utilities, design tokens
export * from './p0-primitives';
// U0 Primitives — Atomic UI components
export * from './u0-primitives';
// L0 Layout — Layout compositions
export * from './l0-layout';
// S0 Lifecycle — Component lifecycle phases (constrain → layout → interact → render)
export * from './s0-lifecycle';
// S0 State — Store primitives (Svelte 5 runes)
// Subpath only: consumers must import via @stephen-netu/design-system/s0-state
// to avoid module-scope singleton side effects from the root barrel.
// T0 Transport — Tauri IPC
export * from './t0-transport';
// F0 Forms — Form primitives
export * from './f0-forms';
// D0 Data Viz — Charts, metrics, timelines
export * from './d0-data-viz';
// N0 Node Graph — Visual composition primitives (SVG DAG, <100 nodes)
export * from './n0-node-graph';
// Epistemic types — public LEAP plugin contracts for assay, allay,
// expert identity, and provenance metadata.
export * from './epistemic';
// Platform protocols — public LEAP shell/plugin boundary metadata,
// including HUD contribution and indicator contracts.
export * from './platform';

// N1 Flow Canvas — pure types + generic adapter utilities (no runtime: no elkjs, no web-worker)
export type {
  GraphNode,
  GraphEdge,
  GraphSnapshot,
  NodeLayout,
  LayoutResult,
  WorkerIn,
  WorkerOut,
  WorkerMessage,
  GraphStateApi,
  EdgeRevealState,
} from './n1-flow-canvas/types.js';
export { EDGE_REVEAL_STAGGER_MS } from './n1-flow-canvas/types.js';
export { nodeHitTest, domEventToCanvasCoords, parseMentionEdges, parseGroupedSequenceEdges } from './n1-flow-canvas/utils.js';
