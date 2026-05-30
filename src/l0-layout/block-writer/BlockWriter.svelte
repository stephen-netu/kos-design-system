<script module lang="ts">
  // Re-export types for consumer convenience
  export type {
    WritingBlock,
    BlockConnection,
    BlockWriterSchema,
    BlockWriterConfig,
    WritingPhase,
    BlockOrigin,
    SplitDirection,
  } from './block-writer-types.js';
  export { PHASE_CONFIG } from './block-writer-types.js';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type {
    BlockWriterSchema,
    BlockWriterConfig,
    WritingBlock,
    WritingPhase,
    SplitDirection,
  } from './block-writer-types.js';
  import type { ZoneRect } from '../../spatial/zone-tiler-types.js';
  import { flattenBsp } from '../../spatial/zone-tiler-types.js';
  import ZoneTiler from '../../spatial/ZoneTiler.svelte';
  import BlockItem from './BlockItem.svelte';
  import BlockConnectionLines from './BlockConnectionLines.svelte';

  // ── Props ────────────────────────────────────────────────────────────────

  interface Props {
    schema: BlockWriterSchema;
    config?: BlockWriterConfig;
    width: number;
    height: number;
    onSchemaChange?: (schema: BlockWriterSchema) => void;
    onBlockFocus?: (blockId: string) => void;
    onBlockContentChange?: (blockId: string, content: string) => void;
    onBlockPhaseChange?: (blockId: string, phase: WritingPhase) => void;
    onBlockAdd?: (afterBlockId: string, direction: SplitDirection) => void;
    onBlockRemove?: (blockId: string) => void;
    onBlockTitleChange?: (blockId: string, title: string) => void;
    onBlockEditEnd?: (blockId: string) => void;
    footer?: Snippet<[WritingBlock]>;
  }

  let {
    schema,
    config,
    width,
    height,
    onSchemaChange,
    onBlockFocus,
    onBlockContentChange,
    onBlockPhaseChange,
    onBlockAdd,
    onBlockRemove,
    onBlockTitleChange,
    onBlockEditEnd,
    footer,
  }: Props = $props();

  // ── Computed layout ──────────────────────────────────────────────────────

  const dividerThickness = $derived(config?.dividerThickness ?? 6);

  const currentZones = $derived(
    flattenBsp(schema.bspTree, 0, 0, width, height, dividerThickness).zones
  );

  // ── Local state ──────────────────────────────────────────────────────────

  let focusedBlockId = $state('');
  let editingBlockId: string | null = $state(null);

  // Sync focus from schema prop (one-way: schema → local)
  $effect(() => {
    focusedBlockId = schema.focusedBlockId;
  });

  // ── Zone content lookup ──────────────────────────────────────────────────

  function getBlockForZone(zoneId: string): WritingBlock | undefined {
    return schema.blocks.find(b => b.id === zoneId);
  }

  // ── Event handlers ───────────────────────────────────────────────────────

  function handleFocusChange(zoneId: string) {
    focusedBlockId = zoneId;
    editingBlockId = null;
    onBlockFocus?.(zoneId);
  }

  function handleResize(tree: typeof schema.bspTree) {
    onSchemaChange?.({ ...schema, bspTree: tree });
  }

  function handleSplitRequest(zoneId: string, direction: SplitDirection) {
    onBlockAdd?.(zoneId, direction);
  }

  function handleEditStart(blockId: string) {
    editingBlockId = blockId;
    focusedBlockId = blockId;
  }

  function handleEditEnd(blockId: string) {
    if (editingBlockId === blockId) {
      editingBlockId = null;
      onBlockEditEnd?.(blockId);
    }
  }

  function handleContentChange(blockId: string, content: string) {
    onBlockContentChange?.(blockId, content);
  }

  function handlePhaseChange(blockId: string, phase: WritingPhase) {
    onBlockPhaseChange?.(blockId, phase);
  }

  function handleSplit(blockId: string, direction: SplitDirection) {
    onBlockAdd?.(blockId, direction);
  }

  function handleDelete(blockId: string) {
    onBlockRemove?.(blockId);
  }

  function handleTitleChange(blockId: string, title: string) {
    onBlockTitleChange?.(blockId, title);
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────

  function handleKeydown(e: KeyboardEvent) {
    if (!focusedBlockId) return;

    // Enter: start editing focused block (when not already editing)
    if (e.key === 'Enter' && !editingBlockId && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      editingBlockId = focusedBlockId;
      return;
    }

    // Escape: exit editing
    if (e.key === 'Escape' && editingBlockId) {
      e.preventDefault();
      editingBlockId = null;
      return;
    }
  }

  // ── ZoneTiler config ─────────────────────────────────────────────────────

  const tilerConfig = $derived({
    minZoneSize: config?.minBlockHeight ?? 80,
    dividerThickness,
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="ds-block-writer"
  style:width="{width}px"
  style:height="{height}px"
  onkeydown={handleKeydown}
>
  <!-- ZoneTiler: BSP layout where each zone = one block -->
  <ZoneTiler
    tree={schema.bspTree}
    {width}
    {height}
    config={tilerConfig}
    bind:focusedZoneId={focusedBlockId}
    onResize={handleResize}
    onFocusChange={handleFocusChange}
    onSplitRequest={handleSplitRequest}
  >
    {#snippet zoneContent(zone: ZoneRect)}
      {@const block = getBlockForZone(zone.id)}
      {#if block}
        <BlockItem
          {block}
          zoneRect={zone}
          isFocused={zone.id === focusedBlockId}
          isEditing={zone.id === editingBlockId}
          allowHorizontalSplit={config?.allowHorizontalSplit ?? true}
          onEditStart={handleEditStart}
          onEditEnd={handleEditEnd}
          onContentChange={handleContentChange}
          onPhaseChange={handlePhaseChange}
          onSplit={handleSplit}
          onDelete={handleDelete}
          onTitleChange={handleTitleChange}
          {footer}
        />
      {/if}
    {/snippet}
  </ZoneTiler>

  <!-- Connection lines SVG overlay -->
  <BlockConnectionLines
    connections={schema.connections}
    zones={currentZones}
    {focusedBlockId}
  />
</div>

<style>
  .ds-block-writer {
    position: relative;
    overflow: hidden;
    background: var(--color-bg-app, #1a1a1a);
    border-radius: var(--radius-md, 8px);
  }
</style>
