<script lang="ts">
  /**
   * KanbanCard — Merged canonical component.
   *
   * Combines fabric's CardData pattern with l0's Card composition,
   * grip-handle-only drag for WebKit compatibility,
   * and keyboard DnD support (F-16).
   *
   * @package @kos/design-system/fabric/layout
   */
  import Card from '../../u0-primitives/card/Card.svelte';

  export interface CardData {
    id: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
    dueDate?: Date;
    assignee?: string;
    metadata?: Record<string, unknown>;
  }

  export interface Props {
    card: CardData;
    isDragging?: boolean;
    isSelected?: boolean;
    disabled?: boolean;
    onClick?: (card: CardData) => void;
    onDragStart?: (card: CardData) => void;
    onDragEnd?: (card: CardData) => void;
    onKeyDown?: (e: KeyboardEvent) => void;
    moveMode?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    card,
    isDragging = false,
    isSelected = false,
    disabled = false,
    onClick,
    onDragStart,
    onDragEnd,
    onKeyDown,
    moveMode = false,
    children,
  }: Props = $props();

  function getPriorityColor(p: CardData['priority']): string {
    switch (p) {
      case 'urgent': return 'var(--color-error)';
      case 'high': return 'var(--color-error)';
      case 'medium': return 'var(--color-warning)';
      case 'low': return 'var(--color-success)';
      default: return 'transparent';
    }
  }

  function formatDate(date: Date | undefined): string {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function handleGripDragStart(e: DragEvent) {
    if (disabled) return;
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', card.id);
      e.dataTransfer.effectAllowed = 'move';
      const wrapper = (e.currentTarget as HTMLElement).closest<HTMLElement>('.ds-kanban-card');
      if (wrapper) {
        e.dataTransfer.setDragImage(wrapper, wrapper.offsetWidth / 2, 20);
      }
    }
    onDragStart?.(card);
  }

  function handleCardClick() {
    if (!disabled) onClick?.(card);
  }

  function handleCardKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onKeyDown?.(e);
      if (!e.defaultPrevented) onClick?.(card);
      return;
    }
    onKeyDown?.(e);
  }
</script>

<div
  class="ds-kanban-card"
  class:is-dragging={isDragging}
  class:is-selected={isSelected}
  class:is-move-source={moveMode && isSelected}
  class:is-disabled={disabled}
  role="listitem"
  aria-grabbed={isDragging || (moveMode && isSelected) ? 'true' : 'false'}
  aria-label={card.title}
>
  <Card variant="interactive" onclick={handleCardClick} onkeydown={handleCardKeyDown}>
    {#if card.priority}
      <div
        class="ds-kanban-priority-bar"
        style="background-color: {getPriorityColor(card.priority)}"
        title="Priority: {card.priority}"
      ></div>
    {/if}

    <div class="ds-kanban-card-header">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="ds-kanban-drag-handle"
        title="Drag to reorder (or press Space to move)"
        draggable="true"
        ondragstart={handleGripDragStart}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="5" cy="4" r="1.5" fill="currentColor"/>
          <circle cx="11" cy="4" r="1.5" fill="currentColor"/>
          <circle cx="5" cy="8" r="1.5" fill="currentColor"/>
          <circle cx="11" cy="8" r="1.5" fill="currentColor"/>
          <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="11" cy="12" r="1.5" fill="currentColor"/>
        </svg>
      </div>

      <span class="ds-kanban-card-title">{card.title}</span>
    </div>

    {#if card.description}
      <p class="ds-kanban-card-description">{card.description}</p>
    {/if}

    {#if children}
      {@render children()}
    {/if}

    <div class="ds-kanban-card-footer">
      {#if card.tags && card.tags.length > 0}
        <div class="ds-kanban-card-tags">
          {#each card.tags.slice(0, 3) as tag}
            <span class="ds-kanban-card-tag">{tag}</span>
          {/each}
          {#if card.tags.length > 3}
            <span class="ds-kanban-card-tag-more">+{card.tags.length - 3}</span>
          {/if}
        </div>
      {/if}

      {#if card.dueDate}
        <span class="ds-kanban-card-due" class:overdue={card.dueDate < new Date()}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 4v4l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {formatDate(card.dueDate)}
        </span>
      {/if}
    </div>
  </Card>
</div>

<style>
  .ds-kanban-card {
    position: relative;
    width: 100%;
    transition: transform var(--transition-fast, 0.15s), opacity var(--transition-fast, 0.15s);
    cursor: pointer;
  }

  .ds-kanban-card.is-dragging {
    opacity: 0.5;
    transform: scale(0.98);
  }

  .ds-kanban-card.is-selected {
    box-shadow: 0 0 0 var(--border-width-default) var(--color-accent);
    border-radius: var(--radius-md, 0.375rem);
  }

  .ds-kanban-card.is-move-source {
    box-shadow: 0 0 0 var(--border-width-default) var(--color-accent), 0 0 var(--blur-lg) var(--color-accent-glow);
    border-radius: var(--radius-md, 0.375rem);
  }

  .ds-kanban-card.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .ds-kanban-card :global(.ds-card) {
    padding: 0;
    overflow: hidden;
    position: relative;
  }

  .ds-kanban-priority-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--space-1);
    height: 100%;
    z-index: 2;
  }

  .ds-kanban-card-header {
    display: flex;
    align-items: flex-start;
    padding: var(--space-3) var(--space-4) var(--space-2) var(--space-2);
    gap: var(--space-2);
  }

  .ds-kanban-drag-handle {
    color: var(--color-text-muted);
    cursor: grab;
  }

  .ds-kanban-card:hover .ds-kanban-drag-handle {
    opacity: 1;
  }

  .ds-kanban-drag-handle:active {
    cursor: grabbing;
  }

  .ds-kanban-drag-handle:hover {
    color: var(--color-text-secondary);
    background: var(--color-bg-panel, rgba(255,255,255,0.05));
  }

  .ds-kanban-card-title {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-primary);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ds-kanban-card-description {
    margin: 0 0 var(--space-3) var(--space-5);
    padding-right: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
  }

  .ds-kanban-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4) var(--space-3) var(--space-5);
    gap: var(--space-2);
  }

  .ds-kanban-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .ds-kanban-card-tag {
    display: inline-flex;
    align-items: center;
    font-size: 0.625rem;
    padding: var(--space-05) 0.375rem;
    background: var(--color-bg-canvas);
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--color-text-tertiary);
  }

  .ds-kanban-card-tag-more {
    font-size: 0.625rem;
    color: var(--color-text-tertiary);
  }

  .ds-kanban-card-due {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.6875rem;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  .ds-kanban-card-due.overdue {
    color: var(--color-error);
  }
</style>
