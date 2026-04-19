// D0 Data Viz — Barrel Export

// Types
export type {
  DataPoint,
  DataSeries,
  ChartProps,
  MetricCardProps,
  TimelineEntry,
  TimelineProps,
} from './types';

// Checkpoint Types (ADR: ui-timeline-checkpoint-bar-001)
export type {
  Checkpoint,
  CheckpointComponentType,
  CheckpointStatus,
  CheckpointBarProps,
  PreviewState,
  RollbackConfirmation,
  RollbackResult,
  TimelineStoreState,
  TimelineStoreActions,
  KeyboardNavigationState,
  CheckpointKeyboardAction,
} from './checkpoint-types';
export {
  CHECKPOINT_COLORS,
  CHECKPOINT_STATUS_SYMBOLS,
  CHECKPOINT_KEYBOARD_ACTIONS,
  VISIBLE_CHECKPOINTS,
  CHECKPOINT_BAR_HEIGHT,
  CHECKPOINT_NODE_SIZE,
  CHECKPOINT_NODE_ACTIVE_SIZE,
  getCheckpointColor,
} from './checkpoint-types';

// StorageMap (wt:sovra-1115)
export type { StorageNode, StorageMapConfig, TreemapCell, TreemapLayout, OwnerTier } from './storage-map-types';
export { computeTreemap, formatBytes, TIER_COLORS } from './storage-map-types';

// Components
export { default as BarChart } from './BarChart.svelte';
export { default as SparkLine } from './SparkLine.svelte';
export { default as MetricCard } from './MetricCard.svelte';
export { default as Timeline } from './Timeline.svelte';
export { default as StorageMap } from './StorageMap.svelte';
export { default as CheckpointBar } from './CheckpointBar.svelte';
export { default as CheckpointPill } from './CheckpointPill.svelte';

// Theme Integration
export {
  CHECKPOINT_CSS_VARS,
  CHECKPOINT_COLOR_LABELS,
  CHECKPOINT_DEFAULT_COLORS,
  getEffectiveCheckpointColor,
  THEME_INTEGRATION,
} from './theme-integration';
