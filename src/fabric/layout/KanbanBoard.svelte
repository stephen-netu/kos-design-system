<script lang="ts">
  import KanbanBoard from '../../l0-layout/kanban/KanbanBoard.svelte';
  import type { Props } from '../../l0-layout/kanban/KanbanBoard.svelte';

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
</script>

<KanbanBoard
  {columns}
  {onCardMove}
  {onCardClick}
  {onAddCard}
  {onAddColumn}
  {onColumnMenuClick}
  {title}
  {header}
  class={className}
/>
