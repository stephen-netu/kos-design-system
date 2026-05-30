// N4 Adaptive Manifold — Unified topology-aware graph layout layer
// Gravitational canvas: GravitationalProvider, classifier, orchestrator, transitions

export type {
  LayoutAlgorithm,
  NodeStatus,
  ManifoldNode,
  ManifoldEdge,
  ManifoldSnapshot,
  NodeStyleEntry,
  NodeStyleRegistry,
  LayoutPreferences,
  EasingCurve,
  AlgorithmProvider,
  TopologyMetrics,
  ClassificationResult,
  AnimationMomentKind,
  AnimationFrame,
  EasingFn,
  LayoutSuggestion,
  ResolvedThemeColors,
  NodeLayout,
  LayoutResult,
  LoopPhase,
  PinnacleEvent,
  PhaseVisualParams,
  PhaseTheme,
  GravitationalConfig,
  NodeIndicatorState,
} from './types.js';

export { DEFAULT_LAYOUT_PREFERENCES, DEFAULT_GRAVITATIONAL_CONFIG } from './types.js';

export { classifyTopology, computeMetrics, STABILITY_TICKS } from './classifier.js';
export { LayoutOrchestrator } from './orchestrator.js';
export { TransitionAnimator, EASING_FUNCTIONS } from './transition.js';

export { GravitationalProvider } from './providers/gravitational-provider.js';

export { default as AdaptiveManifold } from './AdaptiveManifold.svelte';
export { default as SuggestionIndicator } from './SuggestionIndicator.svelte';
export { default as DetailCard } from './DetailCard.svelte';

export { PinnacleEventInferrer } from './pinnacle-events.js';
export { resolvePhaseTheme, DEFAULT_PHASE_THEME } from './phase-theme.js';
