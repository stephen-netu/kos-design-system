// BlockWriter — data model types
// Pure TypeScript — no Svelte, no DOM.
//
// WritingPhase is intentionally a subset of Ryu FlowColumn.
// Writing doesn't need WEED, CONSULT, or PRUNE — those are task-management phases.

import type { BspNode } from '../../spatial/zone-tiler-types.js';
export type { SplitDirection } from '../../spatial/zone-tiler-types.js';

/** Writing lifecycle — subset of Ryu FlowColumn */
export type WritingPhase = 'seed' | 'sprout' | 'go' | 'freeze' | 'compost';

/** Block origin — local equivalent of CardOrigin (no cross-package import) */
export type BlockOrigin = 'authored' | 'ingested' | 'sovereign';

/** A single writing block */
export interface WritingBlock {
  id: string;
  title: string;
  content: string;
  phase: WritingPhase;
  tags: string[];
  links: string[];
  annotation?: string;
  file_path?: string;
  origin: BlockOrigin;
  created_at: number;
  last_edited_at: number;
}

/** Connection between two blocks */
export interface BlockConnection {
  fromId: string;
  toId: string;
  label?: string;
}

/** Full schema — controlled state passed to BlockWriter */
export interface BlockWriterSchema {
  blocks: WritingBlock[];
  bspTree: BspNode;
  connections: BlockConnection[];
  focusedBlockId: string;
}

/** BlockWriter configuration */
export interface BlockWriterConfig {
  /** Min block height in px. Default 80. */
  minBlockHeight?: number;
  /** Divider thickness in px. Default 6. (passed to ZoneTiler) */
  dividerThickness?: number;
  /** Allow horizontal splits (side-by-side blocks). Default true. */
  allowHorizontalSplit?: boolean;
}

/** Phase display config — maps to Badge color variant */
export const PHASE_CONFIG: Record<WritingPhase, { label: string; color: 'warning' | 'info' | 'success' | 'accent' | 'neutral' }> = {
  seed:    { label: 'Seed',    color: 'warning' },
  sprout:  { label: 'Sprout',  color: 'info' },
  go:      { label: 'Go',      color: 'success' },
  freeze:  { label: 'Freeze',  color: 'accent' },
  compost: { label: 'Compost', color: 'neutral' },
};
