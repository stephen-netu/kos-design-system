// S0 Lifecycle — Spatial/canvas rendering pipeline for the LEAP design system
//
// SCOPE: This module is for custom-rendered components that bypass the browser
// layout engine — canvas, WebGL, GPU-composited layers. Do NOT use for CSS/DOM
// components (buttons, panels, cards) — Svelte 5 runes + CSS are correct there.
//
// Target components:
//   spatial/ForceCanvas   — d3-force sim + canvas cell rendering
//   spatial/LodRenderer   — LOD-tiered cell rendering
//   spatial/BspTilingCanvas — BSP zone layout + canvas fills
//   spatial/SnapZoomCamera  — camera transforms over scene layers
//
// Constrain → layout → interact → render pipeline

// Core lifecycle interface
export { type Lifecycle, type LifecyclePhase, LIFECYCLE_PHASES, executeLifecycle } from './Lifecycle';

// Context types (one per phase)
export { type ConstraintContext, type SizeConstraint, type SizeConstraints } from './ConstraintContext';
export { type LayoutContext } from './LayoutContext';
export { type InteractionContext, type InteractionEvent, type EventOutcome } from './InteractionContext';
export { type RenderContext, type TextStyle, type ClipRegion, type DrawCommand } from './RenderContext';

// Scene graph
export { Scene, type SceneLayer, type ZIndex, type ClipBounds } from './Scene';

// Canvas 2D concrete implementation
export { CanvasRenderContext } from './CanvasRenderContext';
