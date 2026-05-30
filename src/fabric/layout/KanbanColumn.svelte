<script lang="ts">
  /**
   * KanbanColumn - Fabric Component
   * 
   * Droppable column for kanban cards with header and scrollable content.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @kos/design-system/fabric/layout
   * @adr 2026-04-12-leap-substrate-refactor-001
   */
  import { Plus, MoreHorizontal } from '@lucide/svelte';
  import type { CardData } from './KanbanCard.svelte';

  export interface ColumnData {
    id: string;
    title: string;
    color?: string;
    limit?: number;
  }

  export interface Props {
    column: ColumnData;
    cards: CardData[];
    isDropTarget?: boolean;
    isCollapsed?: boolean;
    onCardClick?: (card: CardData) => void;
    onCardDragStart?: (card: CardData) => void;
    onCardDragEnd?: (card: CardData) => void;
    onDrop?: (columnId: string, cardId: string) => void;
    onDragOver?: (columnId: string) => void;
    onDragLeave?: (columnId: string) => void;
    onAddCard?: (columnId: string) => void;
    onToggleCollapse?: (columnId: string) => void;
    onMenuClick?: (columnId: string) => void;
  }

  let { column, cards, isDropTarget, isCollapsed, onCardClick, onCardDragStart, onCardDragEnd, onDrop, onDragOver, onDragLeave, onAddCard, onToggleCollapse, onMenuClick }: Props = $props();

  let dragCounter = $state(0);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    onDragOver?.(column.id);
  }

  function handleDragEnter() {
    dragCounter++;
  }

  function handleDragLeave() {
    dragCounter--;
    if (dragCounter === 0) {
      onDragLeave?.(column.id);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter = 0;
    
    const cardId = e.dataTransfer?.getData('application/kanban-card');
    if (cardId) {
      onDrop?.(column.id, cardId);
    }
  }

  function handleCardDragStart(card: CardData, e: DragEvent) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/kanban-card', card.id);
      e.dataTransfer.effectAllowed = 'move';
    }
    onCardDragStart?.(card);
  }

  const cardCount = $derived(cards.length);
  const atLimit = $derived(column.limit ? cardCount >= column.limit : false);
</script>

<div
  class="kanban-column"
  class:drop-target={isDropTarget}
  class:collapsed={isCollapsed}
  class:at-limit={atLimit}
  ondragover={handleDragOver}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role="region"
  aria-label="Column: {column.title}"
>
  <div class="column-header">
    <div 
      class="column-color" 
      style="background: {column.color || 'var(--color-accent, var(--color-accent))'}"
    ></div>
    <button 
      class="column-title-btn"
      onclick={() => onToggleCollapse?.(column.id)}
      aria-expanded={!isCollapsed}
    >
      <span class="column-title">{column.title}</span>
      <span class="card-count" class:limit-near={atLimit}>
        {cardCount}{column.limit ? `/${column.limit}` : ''}
      </span>
    </button>
    <button 
      class="menu-btn"
      onclick={() => onMenuClick?.(column.id)}
      aria-label="Column menu"
    >
      <MoreHorizontal size={16} />
    </button>
  </div>

  {#if !isCollapsed}
    <div class="column-content" role="list">
      {#each cards as card (card.id)}
        {#await import('./KanbanCard.svelte') then { default: KanbanCard }}
          <KanbanCard
            {card}
            onClick={onCardClick}
            onDragStart={(c) => handleCardDragStart(c, event as unknown as DragEvent)}
            onDragEnd={onCardDragEnd}
          />
        {/await}
      {/each}
    </div>

    <button 
      class="add-card-btn"
      onclick={() => onAddCard?.(column.id)}
      disabled={atLimit}
    >
      <Plus size={14} />
      Add card
    </button>
  {/if}
</div>

<style>
  .kanban-column {
    display: flex;
    flex-direction: column;
    width: 280px;
    min-width: 280px;
    max-height: 100%;
    background: var(--color-bg-canvas, #1a1a1a);
    border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    border-radius: var(--radius-lg, 0.5rem);
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .kanban-column.drop-target {
    border-color: var(--color-accent, var(--color-accent));
    box-shadow: 0 0 0 2px var(--color-accent-muted);
  }

  .kanban-column.collapsed {
    width: auto;
    min-width: unset;
  }

  .kanban-column.at-limit {
    border-color: var(--color-warning, rgba(243, 156, 18, 0.3));
  }

  .column-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 12px;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
  }

  .column-color {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-sm, 0.25rem);
    flex-shrink: 0;
  }

  .column-title-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm, 0.25rem);
    color: inherit;
    text-align: left;
  }

  .column-title-btn:hover {
    background: rgba(255,255,255,0.05);
  }

  .column-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #f2efe9);
  }

  .card-count {
    font-size: 11px;
    padding: 2px 6px;
    background: var(--color-bg-panel, #222222);
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--color-text-tertiary, #706858);
  }

  .card-count.limit-near {
    color: var(--color-warning, #f39c12);
    background: rgba(243, 156, 18, 0.1);
  }

  .menu-btn {
    background: none;
    border: none;
    color: var(--color-text-tertiary, #706858);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm, 0.25rem);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s;
  }

  .kanban-column:hover .menu-btn {
    opacity: 1;
  }

  .menu-btn:hover {
    background: rgba(255,255,255,0.05);
    color: var(--color-text-secondary, #a09880);
  }

  .column-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .add-card-btn {
    margin: 0 12px 12px;
    padding: 8px 12px;
    background: transparent;
    border: 1px dashed var(--border-default, #333333);
    border-radius: var(--radius-md, 0.375rem);
    color: var(--color-text-tertiary, #706858);
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-15);
    transition: border-color 0.15s, color 0.15s;
  }

  .add-card-btn:hover:not(:disabled) {
    border-color: var(--color-accent, var(--color-accent));
    color: var(--color-accent, var(--color-accent));
  }

  .add-card-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
