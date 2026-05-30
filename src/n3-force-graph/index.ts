// N3 Force Graph — Force-directed graph with health-aware rendering
// Depends on: force-graph (vasturiano)
//
// Components:
//   ForceGraph.svelte  — Canvas 2D wrapper (wt-797)
//   health-node.ts     — nodeCanvasObject callback (wt-798)
//   animated-edge.ts   — linkCanvasObject callback (wt-799)
//   GraphTooltip.svelte — Floating tooltip (wt-800)

export type {
  ForceGraphNode,
  ForceGraphLink,
  ForceGraphData,
  HealthNodeConfig,
  AnimatedEdgeConfig,
  TooltipPosition,
} from './types.js';

export { healthToColor, healthToGlow } from './types.js';

export { default as ForceGraph } from './ForceGraph.svelte';
export { default as GraphTooltip } from './GraphTooltip.svelte';

export {
  createHealthNodeRenderer,
  createHealthNodeAreaPaint,
  advancePulseTick,
  getPulseTick,
} from './health-node.js';

export { createAnimatedEdgeRenderer } from './animated-edge.js';
