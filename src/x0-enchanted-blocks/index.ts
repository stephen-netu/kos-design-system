// X0 Enchanted Blocks — Adaptive spatial content system
// Phase 1: Foundation (measurement + adaptive sizing)

// Core primitives
export {
  measureBlock,
  measureBlockPreview,
  measureBlocksBatch,
  calculateCanvasHeight,
  calculateOptimalColumnWidth,
  DEFAULT_FONT,
  DEFAULT_MONO_FONT,
  IDEAL_READING_WIDTH,
  MAX_BLOCK_HEIGHT,
  MAX_CONTENT_LENGTH,
} from './core/block-layout.js';

export type {
  BlockMetrics,
  LayoutOptions,
} from './core/block-layout.js';

// Block types and classification
export {
  ALL_BLOCK_TYPES,
  BLOCK_TYPE_LABELS,
  BLOCK_TYPE_ICONS,
  BLOCK_TYPE_COLORS,
  nextBlockType,
  prevBlockType,
  classifyBlockHeuristic,
} from './core/block-types.js';

export type {
  BlockType,
  EnchantedBlockData,
} from './core/block-types.js';

// Components
export { default as EnchantedBlock } from './components/EnchantedBlock.svelte';
export { default as NodepadBlock } from './components/NodepadBlock.svelte';

// Future exports (Phase 2-5):
// export { useBlockEnrichment } from './hooks/useBlockEnrichment.svelte.js';
// export { default as EnchantedCanvas } from './components/EnchantedCanvas.svelte';
// export { classifyBlockLLM } from './core/classifier.js';
