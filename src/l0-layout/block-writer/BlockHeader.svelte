<script lang="ts">
  import { GripVertical, SplitSquareHorizontal, SplitSquareVertical, X } from '@lucide/svelte';
  import Badge from '../../u0-primitives/badge/Badge.svelte';
  import type { WritingPhase } from './block-writer-types.js';
  import type { SplitDirection } from '../../spatial/zone-tiler-types.js';
  import { PHASE_CONFIG } from './block-writer-types.js';

  interface Props {
    blockId: string;
    title: string;
    phase: WritingPhase;
    isFocused: boolean;
    allowHorizontalSplit?: boolean;
    onPhaseChange?: (blockId: string, phase: WritingPhase) => void;
    onSplit?: (blockId: string, direction: SplitDirection) => void;
    onDelete?: (blockId: string) => void;
    onTitleChange?: (blockId: string, title: string) => void;
  }

  let {
    blockId,
    title,
    phase,
    isFocused,
    allowHorizontalSplit = true,
    onPhaseChange,
    onSplit,
    onDelete,
    onTitleChange,
  }: Props = $props();

  const phaseConfig = $derived(PHASE_CONFIG[phase]);

  const phases: WritingPhase[] = ['seed', 'sprout', 'go', 'freeze', 'compost'];

  function cyclePhase() {
    const idx = phases.indexOf(phase);
    const next = phases[(idx + 1) % phases.length];
    onPhaseChange?.(blockId, next);
  }

  function handleTitleInput(e: Event) {
    const target = e.target as HTMLElement;
    onTitleChange?.(blockId, target.textContent ?? '');
  }

  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ds-block-header" class:ds-block-header-focused={isFocused}>
  <!-- Phase color bar (echoes KanbanCard priority bar) -->
  <div
    class="ds-block-phase-bar"
    style="background-color: var(--color-{phaseConfig.color});"
    title="Phase: {phaseConfig.label}"
  ></div>

  <!-- Drag handle -->
  <div class="ds-block-drag-handle" title="Drag to reorder">
    <GripVertical size={14} />
  </div>

  <!-- Phase badge (click to cycle) -->
  <button
    class="ds-block-phase-btn"
    onclick={cyclePhase}
    title="Cycle phase (current: {phaseConfig.label})"
  >
    <Badge variant="status" color={phaseConfig.color} size="sm">
      {phaseConfig.label}
    </Badge>
  </button>

  <!-- Editable title -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="ds-block-title"
    contenteditable="true"
    spellcheck="false"
    tabindex="0"
    role="textbox"
    aria-label="Block title"
    oninput={handleTitleInput}
    onkeydown={handleTitleKeydown}
  >{title}</div>

  <!-- Actions (visible on focus/hover) -->
  <div class="ds-block-actions">
    {#if onSplit}
      <button
        class="ds-block-action-btn"
        onclick={() => onSplit(blockId, 'vertical')}
        title="Split below (Ctrl+Shift+V)"
        aria-label="Split block below"
      >
        <SplitSquareVertical size={14} />
      </button>
      {#if allowHorizontalSplit}
        <button
          class="ds-block-action-btn"
          onclick={() => onSplit(blockId, 'horizontal')}
          title="Split beside (Ctrl+Shift+H)"
          aria-label="Split block beside"
        >
          <SplitSquareHorizontal size={14} />
        </button>
      {/if}
    {/if}
    {#if onDelete}
      <button
        class="ds-block-action-btn ds-block-action-delete"
        onclick={() => onDelete(blockId)}
        title="Delete block"
        aria-label="Delete block"
      >
        <X size={14} />
      </button>
    {/if}
  </div>
</div>

<style>
  .ds-block-header {
    display: flex;
    align-items: center;
    gap: var(--space-2, 8px);
    padding: var(--space-2, 8px) var(--space-3, 12px);
    position: relative;
    min-height: 32px;
  }

  .ds-block-phase-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    border-radius: var(--radius-xs, 2px) 0 0 var(--radius-xs, 2px);
  }

  .ds-block-drag-handle {
    color: var(--color-text-muted, #a09880);
    cursor: grab;
    padding: 2px;
    border-radius: var(--radius-sm, 4px);
    flex-shrink: 0;
    transition: color var(--transition-fast, 150ms ease);
  }

  .ds-block-drag-handle:hover {
    color: var(--color-text-secondary, #c0b8a8);
    background: var(--color-bg-panel, #222);
  }

  .ds-block-phase-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
  }

  .ds-block-title {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm, 13px);
    font-weight: 500;
    color: var(--color-text-primary, #e8e0d0);
    line-height: 1.3;
    outline: none;
    cursor: text;
    padding: 1px 4px;
    border-radius: var(--radius-sm, 4px);
    transition: background var(--transition-fast, 150ms ease);
  }

  .ds-block-title:focus {
    background: rgba(255, 255, 255, 0.04);
  }

  .ds-block-title:empty::before {
    content: 'Untitled block';
    color: var(--color-text-muted, #a09880);
    pointer-events: none;
  }

  .ds-block-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
    transition: opacity var(--transition-fast, 150ms ease);
    flex-shrink: 0;
  }

  .ds-block-header-focused .ds-block-actions,
  .ds-block-header:hover .ds-block-actions {
    opacity: 1;
  }

  .ds-block-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text-muted, #a09880);
    padding: 4px;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    transition: color var(--transition-fast, 150ms ease),
                background var(--transition-fast, 150ms ease);
  }

  .ds-block-action-btn:hover {
    color: var(--color-text-secondary, #c0b8a8);
    background: rgba(255, 255, 255, 0.06);
  }

  .ds-block-action-delete:hover {
    color: var(--color-error, #a65e5e);
    background: rgba(166, 94, 94, 0.15);
  }
</style>
