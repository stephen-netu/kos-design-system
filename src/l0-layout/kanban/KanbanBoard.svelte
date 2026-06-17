<script lang="ts">
  /**
   * KanbanBoard — Merged canonical component.
   *
   * Combines the props/callbacks pattern from fabric with the scroll
   * container and ds-kanban-* CSS classes from l0-layout.
   *
   * Keyboard DnD (F-16): Focus a card and press Space to enter move mode.
   * Arrow keys change the target column. Enter confirms. Escape cancels.
   *
   * @package @kos/design-system/fabric/layout
   */
  import type { Snippet } from 'svelte';
  import KanbanColumn from './KanbanColumn.svelte';
  import KanbanCard from './KanbanCard.svelte';
  import type { ColumnData } from './KanbanColumn.svelte';
  import type { CardData } from './KanbanCard.svelte';

  interface ColumnState {
    column: ColumnData;
    cards: CardData[];
    isDropTarget?: boolean;
    isCollapsed?: boolean;
  }

  export interface Props {
    columns: ColumnState[];
    onCardMove?: (cardId: string, sourceColumnId: string, targetColumnId: string) => void;
    onCardClick?: (card: CardData) => void;
    onAddCard?: (columnId: string) => void;
    onAddColumn?: () => void;
    onColumnMenuClick?: (columnId: string) => void;
    title?: string;
    header?: Snippet;
    class?: string;
  }

  let {
    columns,
    onCardMove,
    onCardClick,
    onAddCard,
    onAddColumn,
    onColumnMenuClick,
    title,
    header,
    class: className = '',
  }: Props = $props();

  let draggedCardId = $state<string | null>(null);
  let activeDropColumn = $state<string | null>(null);

  // Keyboard DnD state
  let moveMode = $state(false);
  let moveCardId = $state<string | null>(null);
  let moveSourceColumnId = $state<string | null>(null);
  let moveTargetColumnIdx = $state<number>(0);

  function enterMoveMode(cardId: string, sourceColumnId: string) {
    moveMode = true;
    moveCardId = cardId;
    moveSourceColumnId = sourceColumnId;
    moveTargetColumnIdx = Math.max(columns.findIndex(c => c.column.id === sourceColumnId), 0);
  }

  function exitMoveMode() {
    moveMode = false;
    moveCardId = null;
    moveSourceColumnId = null;
    moveTargetColumnIdx = 0;
  }

  function confirmMove() {
    if (!moveCardId || !moveSourceColumnId) return;
    const targetId = columns[moveTargetColumnIdx]?.column.id;
    if (targetId && targetId !== moveSourceColumnId) {
      onCardMove?.(moveCardId, moveSourceColumnId, targetId);
    }
    exitMoveMode();
  }

  function handleCardDragStart(card: CardData) {
    draggedCardId = card.id;
  }

  function handleCardDragEnd() {
    draggedCardId = null;
    activeDropColumn = null;
  }

  function handleDragOver(columnId: string) {
    if (draggedCardId && columnId !== activeDropColumn) {
      activeDropColumn = columnId;
    }
  }

  function handleDragLeave(columnId: string) {
    if (activeDropColumn === columnId) {
      activeDropColumn = null;
    }
  }

  function handleDrop(targetColumnId: string, cardId: string) {
    if (!draggedCardId) return;
    const sourceColumn = columns.find(c => c.cards.some(card => card.id === cardId));
    if (sourceColumn && sourceColumn.column.id !== targetColumnId) {
      onCardMove?.(cardId, sourceColumn.column.id, targetColumnId);
    }
    draggedCardId = null;
    activeDropColumn = null;
  }

  function handleCardKeyDown(e: KeyboardEvent, cardId: string, sourceColumnId: string) {
    if (e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      if (moveMode) {
        confirmMove();
      } else {
        enterMoveMode(cardId, sourceColumnId);
      }
      return;
    }
    if (!moveMode) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveTargetColumnIdx = Math.min(moveTargetColumnIdx + 1, columns.length - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveTargetColumnIdx = Math.max(moveTargetColumnIdx - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      confirmMove();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      exitMoveMode();
    }
  }

  const moveTargetColumn = $derived(columns[moveTargetColumnIdx]);
</script>

<div class="ds-kanban-board {className}">
  {#if title || header || onAddColumn}
    <header class="ds-kanban-board-header">
      {#if title}
        <h2 class="ds-kanban-board-title">{title}</h2>
      {/if}
      {#if header}
        {@render header()}
      {/if}
      {#if onAddColumn}
        <button class="ds-kanban-add-column-btn" onclick={() => onAddColumn?.()}>
          + Add Column
        </button>
      {/if}
    </header>
  {/if}

  {#if moveMode}
    <div class="ds-kanban-move-toast" role="status" aria-live="polite">
      Moving card — ← → to choose column, Enter to confirm, Escape to cancel
      <span class="ds-kanban-move-target">→ {moveTargetColumn?.column.title ?? ''}</span>
    </div>
  {/if}

  <div class="ds-kanban-board-scroll">
    <div class="ds-kanban-board-track" role="list" aria-label={title || 'Kanban board'}>
      {#each columns as columnState (columnState.column.id)}
        <KanbanColumn
          column={columnState.column}
          isDropTarget={activeDropColumn === columnState.column.id || (moveMode && moveTargetColumn?.column.id === columnState.column.id)}
          isCollapsed={columnState.isCollapsed}
          isMoveTarget={moveMode && moveTargetColumn?.column.id === columnState.column.id}
          onCardClick={onCardClick}
          onCardDragStart={handleCardDragStart}
          onCardDragEnd={handleCardDragEnd}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onAddCard={onAddCard}
          onMenuClick={onColumnMenuClick}
          onCardKeyDown={handleCardKeyDown}
          moveMode={moveMode}
        >
          {#each columnState.cards as card (card.id)}
            <KanbanCard
              {card}
              isDragging={draggedCardId === card.id || (moveMode && moveCardId === card.id)}
              isSelected={moveMode && moveCardId === card.id}
              onClick={() => onCardClick?.(card)}
              onDragStart={() => handleCardDragStart(card)}
              onDragEnd={handleCardDragEnd}
              onKeyDown={(e: KeyboardEvent) => handleCardKeyDown(e, card.id, columnState.column.id)}
              moveMode={moveMode}
            />
          {/each}
        </KanbanColumn>
      {/each}
    </div>
  </div>
</div>

<style>
  .ds-kanban-board {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--color-bg-root);
    background-image: radial-gradient(var(--grid-dot, rgba(255,255,255,0.03)) var(--border-width-thin), transparent var(--border-width-thin));
    background-size: var(--space-5) var(--space-5);
  }

  .ds-kanban-board-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-bottom: var(--border-width-thin) solid var(--border-subtle);
    flex-shrink: 0;
  }

  .ds-kanban-board-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .ds-kanban-add-column-btn {
    margin-left: auto;
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: var(--border-width-thin) solid var(--border-default);
    border-radius: var(--radius-md, 0.375rem);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .ds-kanban-add-column-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .ds-kanban-move-toast {
    padding: var(--space-2) var(--space-5);
    background: var(--color-accent-faint, rgba(128,128,128,0.08));
    border-bottom: var(--border-width-thin) solid var(--border-subtle);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    flex-shrink: 0;
  }

  .ds-kanban-move-target {
    color: var(--color-accent);
    font-weight: 500;
  }

  .ds-kanban-board-scroll {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  .ds-kanban-board-scroll::-webkit-scrollbar {
    height: var(--space-3);
  }
  .ds-kanban-board-scroll::-webkit-scrollbar-thumb {
    background: var(--color-accent-muted);
    border-radius: var(--radius-full);
    border: var(--border-width-heavy) solid var(--color-bg-root);
  }
  .ds-kanban-board-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .ds-kanban-board-track {
    display: flex;
    height: 100%;
    padding: var(--space-4) var(--space-5);
    gap: var(--space-4);
    min-width: min-content;
  }
</style>
