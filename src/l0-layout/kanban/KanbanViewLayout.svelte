<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    header?: Snippet; // e.g. view switchers, filters, new task button
    board: Snippet;   // e.g. KanbanBoard organism
    class?: string;
  }

  let { header, board, class: className = '' }: Props = $props();
</script>

<div class="ds-kanban-layout {className}">
  {#if header}
    <div class="ds-kanban-layout-header">
      {@render header()}
    </div>
  {/if}

  <div class="ds-kanban-layout-body">
    <main class="ds-kanban-layout-main">
      {@render board()}
    </main>
  </div>
</div>

<style>
  .ds-kanban-layout {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .ds-kanban-layout-header {
    flex-shrink: 0;
    display: flex;
    align-items: stretch;
    flex-direction: column;
    padding: 0;
    background: var(--color-bg-panel);
    border-bottom: 1px solid var(--border-subtle);
  }

  .ds-kanban-layout-body {
    flex: 1 1 0; /* flex-basis:0 makes height definite for % children */
    min-height: 0;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  .ds-kanban-layout-main {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

</style>
