// BlockWriter — layout composition for visual block-based writing
// Controlled component — no internal store. Consumers own state.
// Uses ZoneTiler (BSP) for layout, contenteditable for inline editing.

export { default as BlockWriter } from './BlockWriter.svelte';
export { default as BlockItem } from './BlockItem.svelte';
export { default as BlockHeader } from './BlockHeader.svelte';
export { default as BlockContent } from './BlockContent.svelte';
export { default as BlockConnectionLines } from './BlockConnectionLines.svelte';

export type {
  WritingBlock,
  BlockConnection,
  BlockWriterSchema,
  BlockWriterConfig,
  WritingPhase,
  BlockOrigin,
} from './block-writer-types.js';

// SplitDirection is re-exported from the spatial module

export { PHASE_CONFIG } from './block-writer-types.js';

export { renderMarkdown, renderInlineMarkdown } from './markdown.js';
