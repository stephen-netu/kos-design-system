<script lang="ts">
  import type { Snippet } from 'svelte';
  import Badge from '../../u0-primitives/badge/Badge.svelte';

  interface Props {
    id: string;
    title: string;
    count?: number;
    wipLimit?: number;
    isOverLimit?: boolean;
    class?: string;
    ondragover?: (e: DragEvent) => void;
    ondragleave?: (e: DragEvent) => void;
    ondrop?: (e: DragEvent) => void;
    children?: Snippet; // The KanbanCards go here
    actions?: Snippet; // Additional header actions (e.g. + button)
  }

  let {
    id,
    title,
    count = 0,
    wipLimit,
    isOverLimit = false,
    class: className = '',
    ondragover,
    ondragleave,
    ondrop,
    children,
    actions
  }: Props = $props();

  let isDragTarget = $state(false);

  // Derived state for WIP limit
  let overLimit = $derived(isOverLimit || (wipLimit !== undefined && count > wipLimit));

  function handleDragOver(e: DragEvent) {
    e.preventDefault(); // Necessary to allow dropping
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    isDragTarget = true;
    ondragover?.(e);
  }

  function handleDragLeave(e: DragEvent) {
    isDragTarget = false;
    ondragleave?.(e);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragTarget = false;
    ondrop?.(e);
  }
</script>

<div 
  class="ds-kanban-column {className}"
  class:is-over-limit={overLimit}
  data-column-id={id}
>
  <header class="ds-kanban-column-header">
    <div class="ds-kanban-column-title-group">
      <h3 class="ds-kanban-column-title">{title}</h3>
      <Badge
        variant={overLimit ? 'status' : 'outline'}
        color={overLimit ? 'error' : 'neutral'}
        size="sm"
      >
        {count} {#if wipLimit}/ {wipLimit}{/if}
      </Badge>
    </div>

    {#if actions}
      <div class="ds-kanban-column-actions">
        {@render actions()}
      </div>
    {/if}
  </header>

  <div 
    class="ds-kanban-column-content"
    class:is-drag-target={isDragTarget}
    role="region"
    aria-label={`${title} column`}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <div class="ds-kanban-column-scroll-area">
      {#if children}
        {@render children()}
      {/if}
    </div>

    <!-- Drop indicator overlay -->
    <div class="ds-kanban-drop-indicator"></div>
  </div>
</div>

<style>
  .ds-kanban-column {
    display: flex;
    flex-direction: column;
    min-width: 320px;
    max-width: 360px;
    height: 100%;
    background: var(--color-bg-panel);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    flex-shrink: 0;
    transition: border-color var(--transition-normal);
  }

  .ds-kanban-column.is-over-limit {
    border-color: rgba(166, 94, 94, 0.4);
    box-shadow: 0 0 0 1px rgba(166, 94, 94, 0.1) inset;
  }

  .ds-kanban-column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
  }

  .ds-kanban-column-title-group {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .ds-kanban-column-title {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .ds-kanban-column-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .ds-kanban-column-content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100px;
    background: transparent;
    transition: background var(--transition-fast);
  }

  .ds-kanban-column-scroll-area {
    padding: var(--space-3);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: 100%;
  }

  /* Custom scrollbar for column */
  .ds-kanban-column-scroll-area::-webkit-scrollbar {
    width: 6px;
  }
  .ds-kanban-column-scroll-area::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-full);
  }
  .ds-kanban-column-scroll-area::-webkit-scrollbar-track {
    background: transparent;
  }

  /* Drag Target State */
  .ds-kanban-column-content.is-drag-target {
    background: rgba(184, 115, 51, 0.05); /* Very subtle brass tint */
  }

  .ds-kanban-drop-indicator {
    position: absolute;
    inset: var(--space-3);
    border: 2px dashed var(--color-accent);
    border-radius: var(--radius-md);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-fast);
  }

  .ds-kanban-column-content.is-drag-target .ds-kanban-drop-indicator {
    opacity: 1;
  }
</style>
