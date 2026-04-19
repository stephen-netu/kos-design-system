<script lang="ts">
  /**
   * KanbanCard - Fabric Component
   * 
   * Draggable kanban card with metadata display.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @kos/design-system/fabric/layout
   * @adr 2026-04-12-leap-substrate-refactor-001
   */
  import { GripVertical, Clock, Tag } from '@lucide/svelte';

  export interface CardData {
    id: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    dueDate?: Date;
    assignee?: string;
    metadata?: Record<string, unknown>;
  }

  interface Props {
    card: CardData;
    isDragging?: boolean;
    isSelected?: boolean;
    disabled?: boolean;
    onClick?: (card: CardData) => void;
    onDragStart?: (card: CardData) => void;
    onDragEnd?: (card: CardData) => void;
  }

  const props: Props = $props();

  function priorityColor(p: string | undefined): string {
    switch (p) {
      case 'high': return 'var(--color-error, #c0392b)';
      case 'medium': return 'var(--color-warning, #f39c12)';
      case 'low': return 'var(--color-success, #27ae60)';
      default: return 'var(--color-text-tertiary, #706858)';
    }
  }

  function formatDate(date: Date | undefined): string {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
</script>

<div
  class="kanban-card"
  class:dragging={props.isDragging}
  class:selected={props.isSelected}
  class:disabled={props.disabled}
  role="button"
  tabindex="0"
  aria-grabbed={props.isDragging}
  onclick={() => props.onClick?.(props.card)}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') props.onClick?.(props.card); }}
  ondragstart={() => props.onDragStart?.(props.card)}
  ondragend={() => props.onDragEnd?.(props.card)}
  draggable={!props.disabled}
>
  <div class="card-header">
    {#if props.card.priority}
      <span 
        class="priority-indicator" 
        style="background: {priorityColor(props.card.priority)}"
        title="Priority: {props.card.priority}"
      ></span>
    {/if}
    <span class="card-title">{props.card.title}</span>
    <GripVertical size={14} class="drag-handle" />
  </div>

  {#if props.card.description}
    <p class="card-description">{props.card.description}</p>
  {/if}

  <div class="card-footer">
    {#if props.card.tags && props.card.tags.length > 0}
      <div class="tags">
        {#each props.card.tags.slice(0, 3) as tag}
          <span class="tag">
            <Tag size={10} />
            {tag}
          </span>
        {/each}
        {#if props.card.tags.length > 3}
          <span class="tag-more">+{props.card.tags.length - 3}</span>
        {/if}
      </div>
    {/if}

    {#if props.card.dueDate}
      <span class="due-date" class:overdue={props.card.dueDate < new Date()}>
        <Clock size={12} />
        {formatDate(props.card.dueDate)}
      </span>
    {/if}
  </div>
</div>

<style>
  .kanban-card {
    background: var(--color-bg-panel, #222222);
    border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    border-radius: var(--radius-md, 0.375rem);
    padding: 12px;
    cursor: grab;
    transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
    user-select: none;
  }

  .kanban-card:hover {
    border-color: var(--border-default, #333333);
    box-shadow: var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.2));
  }

  .kanban-card.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
    box-shadow: var(--shadow-lg, 0 4px 12px rgba(0,0,0,0.3));
  }

  .kanban-card.selected {
    border-color: var(--color-accent, #b87333);
    box-shadow: 0 0 0 2px rgba(184, 115, 51, 0.2);
  }

  .kanban-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .priority-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .card-title {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary, #f2efe9);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.drag-handle) {
    color: var(--color-text-tertiary, #706858);
    opacity: 0;
    transition: opacity 0.15s;
  }

  .kanban-card:hover :global(.drag-handle) {
    opacity: 1;
  }

  .card-description {
    font-size: 12px;
    color: var(--color-text-secondary, #a09880);
    line-height: 1.4;
    margin: 0 0 12px 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .tags {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    padding: 2px 6px;
    background: var(--color-bg-canvas, #1a1a1a);
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--color-text-tertiary, #706858);
  }

  .tag-more {
    font-size: 10px;
    color: var(--color-text-tertiary, #706858);
  }

  .due-date {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--color-text-tertiary, #706858);
  }

  .due-date.overdue {
    color: var(--color-error, #c0392b);
  }
</style>
