<script lang="ts">
  import KanbanColumn from '../../l0-layout/kanban/KanbanColumn.svelte';
  import type { Props } from '../../l0-layout/kanban/KanbanColumn.svelte';

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
</script>

<KanbanColumn
  {column}
  {isDropTarget}
  {isCollapsed}
  {isMoveTarget}
  {onCardClick}
  {onCardDragStart}
  {onCardDragEnd}
  {onDrop}
  {onDragOver}
  {onDragLeave}
  {onAddCard}
  {onMenuClick}
  {onCardKeyDown}
  {moveMode}
  {children}
  {actions}
  class={className}
/>
