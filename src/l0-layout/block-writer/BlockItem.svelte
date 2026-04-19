<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WritingBlock, WritingPhase, SplitDirection } from './block-writer-types.js';
  import type { ZoneRect } from '../../spatial/zone-tiler-types.js';
  import BlockHeader from './BlockHeader.svelte';
  import BlockContent from './BlockContent.svelte';

  interface Props {
    block: WritingBlock;
    zoneRect: ZoneRect;
    isFocused: boolean;
    isEditing: boolean;
    allowHorizontalSplit?: boolean;
    onEditStart?: (blockId: string) => void;
    onEditEnd?: (blockId: string) => void;
    onContentChange?: (blockId: string, content: string) => void;
    onPhaseChange?: (blockId: string, phase: WritingPhase) => void;
    onSplit?: (blockId: string, direction: SplitDirection) => void;
    onDelete?: (blockId: string) => void;
    onTitleChange?: (blockId: string, title: string) => void;
    footer?: Snippet<[WritingBlock]>;
  }

  let {
    block,
    zoneRect,
    isFocused,
    isEditing,
    allowHorizontalSplit = true,
    onEditStart,
    onEditEnd,
    onContentChange,
    onPhaseChange,
    onSplit,
    onDelete,
    onTitleChange,
    footer,
  }: Props = $props();

  const isTiny = $derived(!isEditing && (zoneRect.width * zoneRect.height < 2000 || zoneRect.width < 80 || zoneRect.height < 60));
</script>

<div
  class="ds-block-item"
  class:ds-block-item-focused={isFocused}
  class:ds-block-item-editing={isEditing}
  class:ds-block-item-tiny={isTiny}
  style:width="{zoneRect.width}px"
  style:height="{zoneRect.height}px"
>
  {#if isTiny}
    <div class="ds-tiny-indicator ds-phase-{block.phase}">
      <div class="ds-tiny-id">{block.id.slice(0, 4)}</div>
      {#if isFocused}
        <div class="ds-tiny-hint">Press Enter to edit</div>
      {/if}
    </div>
  {:else}
    <BlockHeader
      blockId={block.id}
      title={block.title}
      phase={block.phase}
      isFocused={isFocused}
      allowHorizontalSplit={allowHorizontalSplit}
      onPhaseChange={onPhaseChange}
      onSplit={onSplit}
      onDelete={onDelete}
      onTitleChange={onTitleChange}
    />

    <BlockContent
      content={block.content}
      isEditing={isEditing}
      onEditStart={() => onEditStart?.(block.id)}
      onEditEnd={() => onEditEnd?.(block.id)}
      onContentChange={(content) => onContentChange?.(block.id, content)}
    />
  {/if}

  {#if footer}
    <div class="ds-block-footer">
      {@render footer(block)}
    </div>
  {/if}

  {#if block.annotation}
    <div class="ds-block-annotation">
      {block.annotation}
    </div>
  {/if}
</div>

<style>
  .ds-block-item {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-panel, #222);
    border-radius: var(--radius-md, 8px);
    overflow: hidden;
    position: relative;
    transition: box-shadow 0.15s ease;
  }

  .ds-block-item-focused {
    box-shadow: inset 0 0 0 1.5px var(--color-accent, #b87333);
  }

  .ds-block-item-editing {
    box-shadow: inset 0 0 0 1.5px var(--color-accent, #b87333),
                0 0 12px rgba(184, 115, 51, 0.12);
  }

  .ds-block-item-tiny {
    background: transparent;
  }

  .ds-tiny-indicator {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-1, 4px);
    border-radius: var(--radius-md, 8px);
    background: var(--color-bg-panel, #222);
    cursor: pointer;
    overflow: hidden;
  }

  .ds-tiny-indicator.ds-phase-seed { border-left: 3px solid var(--color-phase-seed, #8fbc8f); }
  .ds-tiny-indicator.ds-phase-sprout { border-left: 3px solid var(--color-phase-sprout, #90ee90); }
  .ds-tiny-indicator.ds-phase-flower { border-left: 3px solid var(--color-phase-flower, #ffa500); }
  .ds-tiny-indicator.ds-phase-scelle { border-left: 3px solid var(--color-phase-scelle, #ff4500); }

  .ds-tiny-id {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs, 10px);
    color: var(--color-text-muted, #a09880);
    opacity: 0.6;
  }

  .ds-tiny-hint {
    font-size: var(--text-xs, 10px);
    color: var(--color-accent, #b87333);
    margin-top: 4px;
    text-align: center;
    line-height: 1.1;
  }

  .ds-block-footer {
    display: flex;
    align-items: center;
    gap: var(--space-2, 8px);
    padding: var(--space-1, 4px) var(--space-3, 12px) var(--space-2, 8px);
    font-size: var(--text-xs, 11px);
    color: var(--color-text-muted, #a09880);
    border-top: 1px solid var(--color-border, #333);
    flex-shrink: 0;
  }

  .ds-block-annotation {
    position: absolute;
    top: var(--space-2, 8px);
    right: var(--space-2, 8px);
    max-width: 200px;
    padding: var(--space-1, 4px) var(--space-2, 8px);
    background: rgba(184, 115, 51, 0.12);
    border: 1px solid rgba(184, 115, 51, 0.25);
    border-radius: var(--radius-sm, 4px);
    font-size: var(--text-xs, 11px);
    color: var(--color-accent, #b87333);
    font-style: italic;
    pointer-events: none;
    z-index: 1;
  }
</style>
