<script lang="ts">
  /**
   * KanbanBoard - Fabric Component
   * 
   * Multi-column kanban board with drag-drop support.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @kos/design-system/fabric/layout
   * @adr 2026-04-12-leap-substrate-refactor-001
   */
  import type { ColumnData } from './KanbanColumn.svelte';
  import type { CardData } from './KanbanCard.svelte';

  interface ColumnState {
    column: ColumnData;
    cards: CardData[];
    isDropTarget?: boolean;
    isCollapsed?: boolean;
  }

  interface Props {
    columns: ColumnState[];
    onCardMove?: (cardId: string, sourceColumnId: string, targetColumnId: string) => void;
    onCardClick?: (card: CardData) => void;
    onAddCard?: (columnId: string) => void;
    onAddColumn?: () => void;
    onColumnMenuClick?: (columnId: string) => void;
    title?: string;
  }

  const props: Props = $props();

  let draggedCardId = $state<string | null>(null);
  let activeDropColumn = $state<string | null>(null);

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

    const sourceColumn = props.columns.find(c => 
      c.cards.some(card => card.id === cardId)
    );
    
    if (sourceColumn && sourceColumn.column.id !== targetColumnId) {
      props.onCardMove?.(cardId, sourceColumn.column.id, targetColumnId);
    }

    draggedCardId = null;
    activeDropColumn = null;
  }
</script>

{#await import('./KanbanColumn.svelte') then { default: KanbanColumn }}
  <div class="kanban-board" role="region" aria-label="{props.title || 'Kanban board'}">
    {#if props.title}
      <header class="board-header">
        <h2 class="board-title">{props.title}</h2>
        <button 
          class="add-column-btn"
          onclick={() => props.onAddColumn?.()}
        >
          + Add Column
        </button>
      </header>
    {/if}

    <div class="board-content" role="list">
      {#each props.columns as columnState (columnState.column.id)}
        <KanbanColumn
          column={columnState.column}
          cards={columnState.cards}
          isDropTarget={activeDropColumn === columnState.column.id}
          isCollapsed={columnState.isCollapsed}
          onCardClick={props.onCardClick}
          onCardDragStart={handleCardDragStart}
          onCardDragEnd={handleCardDragEnd}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onAddCard={props.onAddCard}
          onMenuClick={props.onColumnMenuClick}
        />
      {/each}
    </div>
  </div>
{/await}

<style>
  .kanban-board {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--color-bg-root, #111111);
  }

  .board-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    flex-shrink: 0;
  }

  .board-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary, #f2efe9);
    margin: 0;
  }

  .add-column-btn {
    padding: 8px 16px;
    background: transparent;
    border: 1px solid var(--border-default, #333333);
    border-radius: var(--radius-md, 0.375rem);
    color: var(--color-text-secondary, #a09880);
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .add-column-btn:hover {
    border-color: var(--color-accent, #b87333);
    color: var(--color-accent, #b87333);
  }

  .board-content {
    display: flex;
    gap: 16px;
    padding: 16px 20px;
    overflow-x: auto;
    overflow-y: hidden;
    flex: 1;
    align-items: flex-start;
  }
</style>
