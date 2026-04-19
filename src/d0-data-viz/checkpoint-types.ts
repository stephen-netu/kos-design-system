// D0 Data Viz — Checkpoint Timeline Types
// Pure TypeScript — no Svelte, no DOM dependencies
// ADR: ui-timeline-checkpoint-bar-001

// === Checkpoint Types ===

/** Component types for color coding per ADR spec */
export type CheckpointComponentType =
  | 'rust-crate'
  | 'ui-bundle'
  | 'config'
  | 'faculty-state'
  | 'substrate-binary'
  | 'system-snapshot';

/** Checkpoint status visual encoding */
export type CheckpointStatus = 'committed' | 'system' | 'proposed' | 'partial';

/** A single checkpoint entry on the timeline */
export interface Checkpoint {
  /** Unique sequence number (seqno per sigchain) */
  seqno: number;
  /** Human-readable identifier */
  id: string;
  /** Component name (e.g., "ryu-hamiltonian-panel") */
  component: string;
  /** Component type for color coding */
  componentType: CheckpointComponentType;
  /** Checkpoint status for visual encoding */
  status: CheckpointStatus;
  /** Version transition (optional) */
  version?: {
    from: string;
    to: string;
  };
  /** Author identifier */
  author?: string;
  /** Associated task ID */
  taskId?: string;
  /** Human description */
  description: string;
  /** Timestamp as sequence number reference */
  timestamp: number;
}

/** Color mapping — references CSS custom properties set by themeStore */
export const CHECKPOINT_COLORS: Record<CheckpointComponentType, string> = {
  'rust-crate': 'var(--d0-checkpoint-rust)',
  'ui-bundle': 'var(--d0-checkpoint-ui)',
  'config': 'var(--d0-checkpoint-config)',
  'faculty-state': 'var(--d0-checkpoint-faculty)',
  'substrate-binary': 'var(--d0-checkpoint-substrate)',
  'system-snapshot': 'var(--d0-checkpoint-aggregate)',
};

/** Get checkpoint color with fallback for when CSS vars aren't set */
export function getCheckpointColor(type: CheckpointComponentType, isDark = true): string {
  const fallbacks: Record<CheckpointComponentType, { light: string; dark: string }> = {
    'rust-crate': { light: '#8a5a28', dark: '#b87333' },
    'ui-bundle': { light: '#2d6b6e', dark: '#5f9ea0' },
    'config': { light: '#7c6fae', dark: '#a99fd6' },
    'faculty-state': { light: '#d4a03d', dark: '#e6c470' },
    'substrate-binary': { light: '#c75a5a', dark: '#d98a8a' },
    'system-snapshot': { light: '#6b7280', dark: '#9ca3af' },
  };
  return fallbacks[type][isDark ? 'dark' : 'light'];
}

/** Visual encoding for checkpoint status */
export const CHECKPOINT_STATUS_SYMBOLS: Record<CheckpointStatus, string> = {
  'committed': '◉',    // Filled circle
  'system': '◎',       // Double-ring circle
  'proposed': '○',     // Hollow circle
  'partial': '◐',      // Half-filled
};

// === Checkpoint Bar Props ===

export interface CheckpointBarProps {
  checkpoints: Checkpoint[];
  currentSeqno: number;
  previewSeqno?: number | null;
  onCheckpointClick?: (checkpoint: Checkpoint) => void;
  onCheckpointDoubleClick?: (checkpoint: Checkpoint) => void;
  /** Callback when "Now" handle is dragged (seqno target) */
  onNowHandleDrag?: (seqno: number) => void;
  /** Callback when exiting preview mode */
  onExitPreview?: () => void;
  'aria-label'?: string;
}

// === Preview Mode ===

export interface PreviewState {
  seqno: number;
  checkpoint: Checkpoint;
  isReadOnly: boolean;
}

export interface RollbackConfirmation {
  targetSeqno: number;
  targetCheckpoint: Checkpoint;
  currentSeqno: number;
  affectedComponents: string[];
  archivedConversations: number;
}

// === Keyboard Navigation ===

export interface KeyboardNavigationState {
  focusedIndex: number;
  isPreviewMode: boolean;
}

/** Keyboard action mapping per ADR accessibility spec */
export const CHECKPOINT_KEYBOARD_ACTIONS = {
  ArrowLeft: 'navigate-prev',
  ArrowRight: 'navigate-next',
  Enter: 'preview',
  'Shift+Enter': 'rollback',
  Escape: 'exit-preview',
  Home: 'jump-genesis',
  End: 'jump-now',
} as const;

export type CheckpointKeyboardAction =
  typeof CHECKPOINT_KEYBOARD_ACTIONS[keyof typeof CHECKPOINT_KEYBOARD_ACTIONS];

// === Store Interface (Framework Agnostic) ===

export interface TimelineStoreState {
  checkpoints: Checkpoint[];
  currentSeqno: number;
  previewSeqno: number | null;
  isScrubbing: boolean;
  visibleRange: { start: number; end: number };
}

export interface TimelineStoreActions {
  scrubTo(seqno: number): Promise<void>;
  exitPreview(): void;
  rollbackTo(seqno: number): Promise<RollbackResult>;
  navigateToCheckpoint(index: number): void;
}

export interface RollbackResult {
  success: boolean;
  newSeqno?: number;
  error?: string;
}

// === Lazy Loading Constants ===

/** Number of checkpoints to keep in memory (per ADR performance spec) */
export const VISIBLE_CHECKPOINTS = 50;

/** Checkpoint bar height in pixels (ADR spec: 48px) */
export const CHECKPOINT_BAR_HEIGHT = 48;

/** Node sizes for visual encoding */
export const CHECKPOINT_NODE_SIZE = 12;
export const CHECKPOINT_NODE_ACTIVE_SIZE = 16;
