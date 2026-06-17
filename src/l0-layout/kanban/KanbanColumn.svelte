<script lang="ts">
  /**
   * KanbanColumn — Merged canonical component.
   *
   * Combines fabric's ColumnState props pattern with l0's Snippet children,
   * Badge composition, WIP limit, and ds-kanban-* CSS classes.
   *
   * @package @kos/design-system/fabric/layout
   */
  import type { Snippet } from 'svelte';
  import type { CardData } from './KanbanCard.svelte';

  export interface ColumnData {
    id: string;
    title: string;
    color?: string;
    wipLimit?: number;
  }

  export interface Props {
    column: ColumnData;
    isDropTarget?: boolean;
    isCollapsed?: boolean;
    isMoveTarget?: boolean;
    onCardClick?: (card: CardData) => void;
    onCardDragStart?: (card: CardData) => void;
    onCardDragEnd?: () => void;
    onDrop?: (targetColumnId: string, cardId: string) => void;
    onDragOver?: (columnId: string) => void;
    onDragLeave?: (columnId: string) => void;
    onAddCard?: (columnId: string) => void;
    onMenuClick?: (columnId: string) => void;
    onCardKeyDown?: (e: KeyboardEvent, cardId: string, sourceColumnId: string) => void;
    moveMode?: boolean;
    children?: Snippet;
    actions?: Snippet;
    class?: string;
  }

  let {
    column,
    isDropTarget = false,
    isCollapsed = false,
    isMoveTarget = false,
    onCardClick,
    onCardDragStart,
    onCardDragEnd,
    onDrop,
    onDragOver,
    onDragLeave,
    onAddCard,
    onMenuClick,
    onCardKeyDown,
    moveMode = false,
    children,
    actions,
    class: className = '',
  }: Props = $props();

  let isDragTarget = $state(false);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    isDragTarget = true;
    onDragOver?.(column.id);
  }

  function handleDragLeave(e: DragEvent) {
    isDragTarget = false;
    onDragLeave?.(column.id);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragTarget = false;
    const cardId = e.dataTransfer?.getData('text/plain');
    if (cardId) {
      onDrop?.(column.id, cardId);
    }
  }
</script>

<div
  class="ds-kanban-column {className}"
  class:is-move-target={isMoveTarget}
  data-column-id={column.id}
>
  <header class="ds-kanban-column-header">
    <div class="ds-kanban-column-title-group">
      {#if column.color}
        <span
          class="ds-kanban-column-color"
          style="background: {column.color}"
        ></span>
      {/if}
      <h3 class="ds-kanban-column-title">{column.title}</h3>
    </div>

    <div class="ds-kanban-column-actions">
      {#if actions}
        {@render actions()}
      {/if}
      {#if onAddCard}
        <button
          class="ds-kanban-column-add-btn"
          onclick={() => onAddCard?.(column.id)}
          title="Add card"
          aria-label={`Add card to ${column.title}`}
        >
          +
        </button>
      {/if}
      {#if onMenuClick}
        <button
          class="ds-kanban-column-menu-btn"
          onclick={() => onMenuClick?.(column.id)}
          title="Column menu"
          aria-label={`Menu for ${column.title}`}
        >
          ⋯
        </button>
      {/if}
    </div>
  </header>

  {#if !isCollapsed}
    <div
      class="ds-kanban-column-content"
      class:is-drag-target={isDropTarget || isDragTarget}
      role="region"
      aria-label={`${column.title} column`}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
    >
      <div class="ds-kanban-column-scroll-area">
        {#if children}
          {@render children()}
        {/if}
      </div>

      <div class="ds-kanban-drop-indicator"></div>
    </div>
  {/if}
</div>

<style>
  .ds-kanban-column {
    display: flex;
    flex-direction: column;
    min-width: 18.75rem;
    max-width: 22.5rem;
    height: 100%;
    background: var(--color-bg-panel);
    border-radius: var(--radius-lg, 0.5rem);
    border: var(--border-width-thin) solid var(--border-default);
    flex-shrink: 0;
    transition: border-color var(--transition-normal, 0.2s);
  }

  .ds-kanban-column.is-move-target {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 var(--border-width-thin) var(--color-accent);
  }

  .ds-kanban-column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    border-bottom: var(--border-width-thin) solid var(--border-subtle);
    flex-shrink: 0;
  }

  .ds-kanban-column-title-group {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .ds-kanban-column-color {
    width: var(--space-2);
    height: var(--space-2);
    border-radius: 50%;
    flex-shrink: 0;
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
    gap: var(--space-1);
  }

  .ds-kanban-column-add-btn,
  .ds-kanban-column-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    padding: var(--space-1);
    border-radius: var(--radius-sm, 0.25rem);
    cursor: pointer;
    font-size: var(--text-base);
    line-height: 1;
    transition: color 0.15s, background 0.15s;
  }

  .ds-kanban-column-add-btn:hover,
  .ds-kanban-column-menu-btn:hover {
    color: var(--color-text-secondary);
    background: var(--color-bg-canvas);
  }

  .ds-kanban-column-content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 5rem;
    transition: background var(--transition-fast, 0.15s);
  }

  .ds-kanban-column-scroll-area {
    padding: var(--space-3);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: 100%;
  }

  .ds-kanban-column-scroll-area::-webkit-scrollbar {
    width: var(--size-divider);
  }
  .ds-kanban-column-scroll-area::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-full);
  }
  .ds-kanban-column-scroll-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .ds-kanban-column-content.is-drag-target {
    background: var(--color-accent-faint, rgba(128,128,128,0.05));
  }

  .ds-kanban-drop-indicator {
    position: absolute;
    inset: var(--space-3);
    border: var(--border-width-default) dashed var(--color-accent);
    border-radius: var(--radius-md);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-fast, 0.15s);
  }

  .ds-kanban-column-content.is-drag-target .ds-kanban-drop-indicator {
    opacity: 1;
  }
</style>
