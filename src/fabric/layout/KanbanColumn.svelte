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

  interface Props {
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

  const props: Props = $props();

  let dragCounter = $state(0);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    props.onDragOver?.(props.column.id);
  }

  function handleDragEnter() {
    dragCounter++;
  }

  function handleDragLeave() {
    dragCounter--;
    if (dragCounter === 0) {
      props.onDragLeave?.(props.column.id);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter = 0;
    
    const cardId = e.dataTransfer?.getData('application/kanban-card');
    if (cardId) {
      props.onDrop?.(props.column.id, cardId);
    }
  }

  function handleCardDragStart(card: CardData, e: DragEvent) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/kanban-card', card.id);
      e.dataTransfer.effectAllowed = 'move';
    }
    props.onCardDragStart?.(card);
  }

  const cardCount = $derived(props.cards.length);
  const atLimit = $derived(props.column.limit ? cardCount >= props.column.limit : false);
</script>

<div
  class="kanban-column"
  class:drop-target={props.isDropTarget}
  class:collapsed={props.isCollapsed}
  class:at-limit={atLimit}
  ondragover={handleDragOver}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role="region"
  aria-label="Column: {props.column.title}"
>
  <div class="column-header">
    <div 
      class="column-color" 
      style="background: {props.column.color || 'var(--color-accent, #b87333)'}"
    ></div>
    <button 
      class="column-title-btn"
      onclick={() => props.onToggleCollapse?.(props.column.id)}
      aria-expanded={!props.isCollapsed}
    >
      <span class="column-title">{props.column.title}</span>
      <span class="card-count" class:limit-near={atLimit}>
        {cardCount}{props.column.limit ? `/${props.column.limit}` : ''}
      </span>
    </button>
    <button 
      class="menu-btn"
      onclick={() => props.onMenuClick?.(props.column.id)}
      aria-label="Column menu"
    >
      <MoreHorizontal size={16} />
    </button>
  </div>

  {#if !props.isCollapsed}
    <div class="column-content" role="list">
      {#each props.cards as card (card.id)}
        {#await import('./KanbanCard.svelte') then { default: KanbanCard }}
          <KanbanCard
            {card}
            onClick={props.onCardClick}
            onDragStart={(c) => handleCardDragStart(c, event as unknown as DragEvent)}
            onDragEnd={props.onCardDragEnd}
          />
        {/await}
      {/each}
    </div>

    <button 
      class="add-card-btn"
      onclick={() => props.onAddCard?.(props.column.id)}
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
    border-color: var(--color-accent, #b87333);
    box-shadow: 0 0 0 2px rgba(184, 115, 51, 0.2);
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
    gap: 8px;
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
    gap: 8px;
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
    gap: 8px;
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
    gap: 6px;
    transition: border-color 0.15s, color 0.15s;
  }

  .add-card-btn:hover:not(:disabled) {
    border-color: var(--color-accent, #b87333);
    color: var(--color-accent, #b87333);
  }

  .add-card-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
