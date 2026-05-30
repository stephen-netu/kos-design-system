// N4 Adaptive Manifold — Core Types
// Pure TypeScript — no Svelte, no DOM dependencies
// S-02: deterministic ordering, no HashMap/Set iteration

import type { NodeLayout, LayoutResult } from '../n1-flow-canvas/types.js';

// === Topology Kinds ===

/** The active layout algorithm. Gravitational is the only registered provider. */
export type LayoutAlgorithm = 'gravitational' | 'manifold';

// === Node Status ===

/** Visual treatment for nodes — maps to --n4-node-* design tokens. */
export type NodeStatus =
  | 'active'      // Brass glow, full opacity
  | 'idle'        // Muted, reduced opacity
  | 'blocked'     // Warning accent, dashed border
  | 'completed'   // Faded, can be auto-hidden
  | 'critical';   // Error accent, pulse animation

// === Manifold Data Primitives ===

/** A node in the adaptive manifold. Domain-agnostic — the canvas never inspects metadata. */
export interface ManifoldNode {
  /** Stable ID across snapshots. Same entity = same ID across domains. */
  id: string;
  /** Domain-defined type: 'task', 'agent', 'signal', 'capability', 'intent', etc. */
  kind: string;
  /** Display name. */
  label: string;
  /** Visual treatment — maps to design tokens. */
  status: NodeStatus;
  /** 0–1, influences node size and gravity. */
  weight: number;
  /** User has fixed this node's position. */
  pinned: boolean;
  /** Domain-specific, opaque to canvas. Exposed in click handlers. */
  metadata: Record<string, unknown>;
  /** Optional spatial hints — domain adapters can suggest, canvas can ignore. */
  hint?: { x?: number; y?: number; cluster?: string; rotation_axis?: string | null };
}

/** An edge in the adaptive manifold. */
export interface ManifoldEdge {
  id: string;
  /** Source node ID. */
  source: string;
  /** Target node ID. */
  target: string;
  /** Domain-defined relationship: 'depends_on', 'delegates_to', 'emits', etc. */
  relation: string;
  /** Whether the edge has direction (arrow). */
  directed: boolean;
  /** 0–1, influences edge visual weight and spring tension. */
  strength: number;
  /** If true, edge fades after animation (for signal pulses). */
  transient: boolean;
  /** Domain-specific, opaque to canvas. */
  metadata: Record<string, unknown>;
}

/** Immutable snapshot of manifold data — the input to all layout providers. */
export interface ManifoldSnapshot {
  /** SOVEREIGN deterministic sequence — not wall clock. S-02 compliant. */
  readonly sequence: number;
  readonly nodes: ReadonlyArray<ManifoldNode>;
  readonly edges: ReadonlyArray<ManifoldEdge>;
  /** 'initial' = full graph, 'incremental' = delta (new nodes/edges only). */
  readonly epoch: 'initial' | 'incremental';
}

// === Node Style Registry ===

/** Maps node `kind` strings to visual treatment. Registered by consuming apps, not the canvas. */
export interface NodeStyleEntry {
  /** Icon identifier (e.g. lucide icon name). */
  icon: string;
  /** Node shape for rendering. */
  shape: 'rounded-rect' | 'hexagon' | 'diamond' | 'pill' | 'rect' | 'circle';
  /** CSS custom property name for accent color (e.g. '--n4-kind-task'). */
  accentVar: string;
}

export type NodeStyleRegistry = Record<string, NodeStyleEntry>;

// ManifoldDomain (tab-per-domain adapter pattern) was removed per
// pinnacle-garden-observer-001 ADR. All entity types coexist on one composite canvas.
// Old per-domain adapters in consuming apps (tasksAdapter, agentsAdapter, etc.) are dead code.

// === Layout Preferences ===

/** User/adaptive preferences that influence topology selection and rendering. */
export interface LayoutPreferences {
  /** Lock to a specific algorithm, bypassing the classifier. null = auto. */
  lockedAlgorithm: LayoutAlgorithm | null;
  /** Animate transitions between layouts. Default true. */
  animate: boolean;
  /** Morph transition duration in ms. Default 600. */
  morphDurationMs: number;
  /** Easing curve identifier. Default 'easeInOutCubic'. */
  easing: EasingCurve;
}

export type EasingCurve =
  | 'linear'
  | 'easeInOutCubic'
  | 'easeOutExpo'
  | 'spring';

/** Default layout preferences — auto-classify, animate, 600ms easeInOutCubic. */
export const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferences = {
  lockedAlgorithm: null,
  animate: true,
  morphDurationMs: 600,
  easing: 'easeInOutCubic',
};

// === Algorithm Provider Interface ===

/**
 * Each layout algorithm has an AlgorithmProvider that computes node positions.
 * Providers are stateless — all context comes from arguments.
 * Implementations must be deterministic given the same snapshot + dimensions.
 */
export interface AlgorithmProvider {
  /** The layout algorithm this provider implements. */
  readonly algorithm: LayoutAlgorithm;

  /**
   * Compute a layout for the given snapshot within the given canvas bounds.
   * Returns a LayoutResult with positions and BFS order.
   * May be async (e.g. ELK runs a web worker).
   */
  layout(
    snapshot: ManifoldSnapshot,
    canvasWidth: number,
    canvasHeight: number,
  ): Promise<LayoutResult>;
}

// === Classifier ===

/** Topology metrics computed once per classification. */
export interface TopologyMetrics {
  nodeCount: number;
  edgeCount: number;
  edgeDensity: number;
  maxDepth: number;
  rootCount: number;
  cycleCount: number;
  componentCount: number;
  maxClusterSize: number;
}

/** Result of topology classification — recommended algorithm with reasoning. */
export interface ClassificationResult {
  /** Recommended layout algorithm. */
  recommended: LayoutAlgorithm;
  /** Confidence 0–1 of the recommendation. */
  confidence: number;
  /** Human-readable reason. */
  reason: string;
  /** All algorithms ranked by fitness, descending. */
  ranked: Array<{ algorithm: LayoutAlgorithm; fitness: number }>;
  /** Computed topology metrics. */
  metrics: TopologyMetrics;
}

// === Transition / Animation ===

/** Named animation moment types from the ADR. */
export type AnimationMomentKind =
  | 'settle'    // Initial layout or incremental update
  | 'morph'     // Layout algorithm switch
  | 'pulse'     // Transient edge signal
  | 'arrive'    // New node added
  | 'depart'    // Node removed
  | 'focus';    // User clicked a node

/** A single frame in a layout transition animation. */
export interface AnimationFrame {
  /** Interpolated positions at this frame. */
  positions: Map<string, NodeLayout>;
  /** Progress 0→1 through the transition. */
  progress: number;
  /** Elapsed ms since transition start. */
  elapsedMs: number;
}

/** Easing function: takes t (0→1), returns eased t (0→1). */
export type EasingFn = (t: number) => number;

// === Suggestion ===

/** A layout suggestion to show the user when the classifier disagrees with current view. */
export interface LayoutSuggestion {
  /** Suggested algorithm to switch to. */
  algorithm: LayoutAlgorithm;
  /** Confidence 0–1 of the suggestion. */
  confidence: number;
  /** Human-readable reason. */
  reason: string;
  /** Whether the user has dismissed this suggestion. */
  dismissed: boolean;
  /** Whether the user has pinned their current layout. */
  pinned: boolean;
}

// === Resolved Theme Colors ===

/** Colors resolved from --n4-* CSS tokens at mount time via getComputedStyle. */
export interface ResolvedThemeColors {
  canvasBg: string;
  nodeActive: string;
  nodeIdle: string;
  nodeBlocked: string;
  nodeCompleted: string;
  nodeCritical: string;
  nodeBg: string;
  nodeBorder: string;
  nodeText: string;
  edgeColor: string;
  edgeActive: string;
  pulseColor: string;
  pulseCritical: string;
}

// === Garden Observer Types ===

/** Inferred phase in the perceive-think-act-sync loop */
export type LoopPhase = 'perceive' | 'think' | 'act' | 'sync' | 'idle';

/**
 * Canonical event shape consumed by the Pinnacle canvas.
 *
 * Note: the ADR also specified `entry: SigchainEntry`, but that type lives in
 * SOVEREIGN — the design-system cannot take that dependency. `sequence` provides
 * the same S-04 auditability anchor. Consumers needing the raw sigchain entry
 * should carry it separately alongside the PinnacleEvent.
 */
export interface PinnacleEvent {
  /** Which agent this event concerns */
  agentId: string;
  /** Task/capability being interacted with, if any */
  targetId: string | null;
  /** Inferred loop phase */
  loopPhase: LoopPhase;
  /** Sigchain sequence number (deterministic ordering, not wall clock) */
  sequence: number;
}

/** Visual parameters for a single FLOW phase */
export interface PhaseVisualParams {
  /** Canvas background tint */
  background: string;
  /** 0-1 multiplier on indicator layer brightness */
  brightness: number;
  /** 0-1 multiplier on indicator opacity */
  indicatorIntensity: number;
  /** Seconds per ambient pulse cycle */
  ambientPulseSpeed: number;
  /** 0-1 desaturation factor (0 = full desaturation for freeze) */
  saturation: number;
}

/** Maps FLOW phases to visual parameters — the theming contract */
export interface PhaseTheme {
  seed: PhaseVisualParams;
  sprout: PhaseVisualParams;
  go: PhaseVisualParams;
  consult: PhaseVisualParams;
  weed: PhaseVisualParams;
  freeze: PhaseVisualParams;
  compost: PhaseVisualParams;
  prune: PhaseVisualParams;
}

/** Configuration for the gravitational force simulation */
export interface GravitationalConfig {
  /** 0-1: how strongly role pulls toward zone */
  roleGravityStrength: number;
  /** 0-1: how strongly current work pulls agent toward target */
  interactionPullStrength: number;
  /** Velocity decay per tick (0-1, higher = more damping) */
  damping: number;
  /** Minimum node separation in pixels */
  collisionRadius: number;
  /** Subtle random motion amplitude when idle */
  ambientDrift: number;
}

export const DEFAULT_GRAVITATIONAL_CONFIG: GravitationalConfig = {
  roleGravityStrength: 0.3,
  interactionPullStrength: 0.6,
  damping: 0.85,
  collisionRadius: 45,
  ambientDrift: 0.5,
};

/** Per-node indicator state for the compositing layer */
export interface NodeIndicatorState {
  /** Current loop phase (drives animation) */
  loopPhase: LoopPhase;
  /** Milliseconds in current phase (for pulse timing) */
  phaseElapsedMs: number;
  /** Target node ID if perceive/act trace is active */
  traceTargetId: string | null;
}

// === Re-export n1 types for convenience ===

export type { NodeLayout, LayoutResult } from '../n1-flow-canvas/types.js';
