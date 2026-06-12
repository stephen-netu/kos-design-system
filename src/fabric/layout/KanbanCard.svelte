<script lang="ts">
  import KanbanCard from '../../l0-layout/kanban/KanbanCard.svelte';
  import type { Props } from '../../l0-layout/kanban/KanbanCard.svelte';

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
</script>

<KanbanCard
  {card}
  {isDragging}
  {isSelected}
  {disabled}
  {onClick}
  {onDragStart}
  {onDragEnd}
  {onKeyDown}
  {moveMode}
  {children}
/>
