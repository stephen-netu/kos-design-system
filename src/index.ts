// LEAP Design System — HDA-organized frontend primitives
// @kos/design-system

// CSS imports
import './base.css';
import './p0-primitives/tokens/tokens.css';
import './p0-primitives/tokens/control-room.css';
import './n0-node-graph/n0-tokens.css';
import './d0-data-viz/d0-tokens.css';
import './n4-adaptive-manifold/n4-tokens.css';

// B0 App Shell — Global LEAP chrome (CommandBar, intent dispatch, system state)
// B = Base shell layer — free in both SOVEREIGN HDA and existing DS prefixes
export * from './b0-app-shell';

// P0 Primitives — Shared types, utilities, design tokens
export * from './p0-primitives';

// U0 Primitives — Atomic UI components
export * from './u0-primitives';

// L0 Layout — Layout compositions
export * from './l0-layout';

// S0 State — Store primitives (Svelte 5 runes)
export * from './s0-state';

// T0 Transport — Tauri IPC
export * from './t0-transport';

// F0 Forms — Form primitives
export * from './f0-forms';

// D0 Data Viz — Charts, metrics, timelines
export * from './d0-data-viz';

// N0 Node Graph — Visual composition primitives (SVG DAG, <100 nodes)
export * from './n0-node-graph';

// N1 Flow Canvas — Canvas 2D + ELK layout + BFS edge reveal (PS2 aesthetic)
export * from './n1-flow-canvas';

// N2 Manifold Disk — Poincaré disk projection, wraps N1
export * from './n2-manifold-disk';

// N3 Force Graph — Force-directed graph with health-aware rendering (force-graph)
export * from './n3-force-graph';

// N4 Adaptive Manifold — Unified topology-aware graph layout with classifier
export * from './n4-adaptive-manifold';

// Entity Graph View — SOVEREIGN entity graph visualization
export * from './entity-graph-view';

// Epistemic types
export * from './epistemic';

// Platform — cross-boundary protocols (HUD, etc.)
export * from './platform';

// Spatial — BSP zone tiling, force-directed layout, LOD rendering, snap-zoom camera
export * from './spatial';

// G0 Geo — Geospatial map primitives (SovereignMap)
export * from './g0-geo';

// X0 Enchanted Blocks — Adaptive spatial content with Pretext measurement
export * from './x0-enchanted-blocks';
