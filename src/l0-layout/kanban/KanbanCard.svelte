<script lang="ts">
  import { GripVertical, X } from '@lucide/svelte';
  import Card from '../../u0-primitives/card/Card.svelte';
  import Badge from '../../u0-primitives/badge/Badge.svelte';
  import Avatar from '../../u0-primitives/avatar/Avatar.svelte';
  import type { Snippet } from 'svelte';

  export interface KanbanCardData {
    id: string;
    title: string;
    content?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assignee?: {
      name: string;
      src?: string;
    };
    badges?: Array<{
      label: string;
      color?: 'accent' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
    }>;
  }

  interface Props {
    item: KanbanCardData;
    isDragging?: boolean;
    class?: string;
    ondragstart?: (e: DragEvent) => void;
    onclick?: () => void;
    ondelete?: () => void;
    actions?: Snippet; // Additional actions for hover state
  }

  let {
    item,
    isDragging = false,
    class: className = '',
    ondragstart,
    onclick,
    ondelete,
    actions
  }: Props = $props();

  function handleGripDragStart(e: DragEvent) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'move';
      // Use the full card wrapper as the drag ghost — dragging just the grip icon looks broken.
      const wrapper = (e.currentTarget as HTMLElement).closest<HTMLElement>('.ds-kanban-card-wrapper');
      if (wrapper) {
        e.dataTransfer.setDragImage(wrapper, wrapper.offsetWidth / 2, 20);
      }
    }
    ondragstart?.(e);
  }

  function getPriorityColor(p: KanbanCardData['priority']) {
    switch (p) {
      case 'low': return 'var(--color-info)';
      case 'medium': return 'var(--color-warning)';
      case 'high': return 'var(--color-accent)';
      case 'urgent': return 'var(--color-error)';
      default: return 'transparent';
    }
  }
</script>

<!-- Drag is scoped to the grip handle — the wrapper is NOT draggable.
     Making the whole wrapper draggable suppresses click events on WebKit (Tauri/Safari). -->
<div
  class="ds-kanban-card-wrapper {className}"
  class:is-dragging={isDragging}
  aria-grabbed={isDragging}
>
  <Card 
    variant="interactive" 
    onclick={onclick}
    class="ds-kanban-card-inner"
  >
    <!-- Priority Bar -->
    {#if item.priority}
      <div 
        class="ds-kanban-priority-bar" 
        style="background-color: {getPriorityColor(item.priority)};"
        title="Priority: {item.priority}"
      ></div>
    {/if}

    <div class="ds-kanban-header">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="ds-kanban-drag-handle"
        title="Drag to reorder"
        draggable="true"
        ondragstart={handleGripDragStart}
      >
        <GripVertical size={14} />
      </div>
      
      <h4 class="ds-kanban-title">{item.title}</h4>

      <div class="ds-kanban-actions">
        {#if actions}
          {@render actions()}
        {/if}
        {#if ondelete}
          <button 
            class="ds-kanban-delete" 
            onclick={(e) => { e.stopPropagation(); ondelete(); }}
            title="Delete task"
            aria-label="Delete task"
          >
            <X size={14} />
          </button>
        {/if}
      </div>
    </div>

    {#if item.content}
      <p class="ds-kanban-preview">{item.content}</p>
    {/if}

    <div class="ds-kanban-footer">
      <div class="ds-kanban-badges">
        {#if item.badges}
          {#each item.badges as badge}
            <Badge variant="status" color={badge.color || 'neutral'} size="sm">
              {badge.label}
            </Badge>
          {/each}
        {/if}
      </div>

      {#if item.assignee}
        <div class="ds-kanban-assignee">
          <Avatar 
            name={item.assignee.name} 
            src={item.assignee.src} 
            size="sm" 
            class="ds-kanban-avatar"
          />
        </div>
      {/if}
    </div>
  </Card>
</div>

<style>
  .ds-kanban-card-wrapper {
    position: relative;
    width: 100%;
    transition: transform var(--transition-fast), opacity var(--transition-fast);
  }

  .ds-kanban-card-wrapper.is-dragging {
    opacity: 0.5;
    transform: scale(0.98);
  }

  /* Target the inner card to override default padding */
  :global(.ds-kanban-card-inner.ds-card) {
    padding: 0;
    overflow: hidden; /* For priority bar */
  }

  .ds-kanban-priority-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    z-index: 2;
  }

  .ds-kanban-header {
    display: flex;
    align-items: flex-start;
    padding: var(--space-3) var(--space-4) var(--space-2) var(--space-2);
    gap: var(--space-2);
  }

  .ds-kanban-drag-handle {
    color: var(--color-text-muted);
    cursor: grab;
    margin-top: 2px;
    padding: 2px;
    border-radius: var(--radius-sm);
    touch-action: none;
    opacity: 0.4;
    transition: opacity var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  }

  .ds-kanban-card-wrapper:hover .ds-kanban-drag-handle {
    opacity: 1;
  }

  .ds-kanban-drag-handle:active {
    cursor: grabbing;
  }

  .ds-kanban-drag-handle:hover {
    color: var(--color-text-secondary);
    background: var(--color-bg-panel);
  }

  .ds-kanban-title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-primary);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ds-kanban-actions {
    display: flex;
    align-items: center;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .ds-kanban-card-wrapper:hover .ds-kanban-actions {
    opacity: 1;
  }

  .ds-kanban-delete {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    padding: 4px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .ds-kanban-delete:hover {
    color: var(--color-error);
    background: rgba(166, 94, 94, 0.15);
  }

  .ds-kanban-preview {
    margin: 0 0 var(--space-3) var(--space-8);
    padding-right: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }

  .ds-kanban-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4) var(--space-3) var(--space-8);
    gap: var(--space-3);
  }

  .ds-kanban-badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .ds-kanban-assignee {
    flex-shrink: 0;
  }
</style>
