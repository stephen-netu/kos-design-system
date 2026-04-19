<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet; // The KanbanColumns go here
  }

  let {
    class: className = '',
    children
  }: Props = $props();
</script>

<div class="ds-kanban-board {className}">
  <!-- Drag-scrollable container -->
  <div class="ds-kanban-board-scroll">
    <div class="ds-kanban-board-track">
      {#if children}
        {@render children()}
      {/if}
    </div>
  </div>
</div>

<style>
  .ds-kanban-board {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--color-bg-canvas); /* Dark desk look */
    /* subtle dot grid for the board background */
    background-image: radial-gradient(var(--grid-dot) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  .ds-kanban-board-scroll {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    /* Smooth scrolling on touch pads */
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  .ds-kanban-board-track {
    display: flex;
    height: 100%;
    padding: var(--space-6);
    gap: var(--space-6);
    /* Ensure track expands to fit content, but at least fills the screen */
    min-width: min-content;
  }

  /* Custom horizontal scrollbar */
  .ds-kanban-board-scroll::-webkit-scrollbar {
    height: 12px;
  }
  .ds-kanban-board-scroll::-webkit-scrollbar-thumb {
    background: rgba(184, 115, 51, 0.2); /* Brass tinted scrollbar */
    border-radius: var(--radius-full);
    border: 3px solid var(--color-bg-canvas);
  }
  .ds-kanban-board-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(184, 115, 51, 0.4);
  }
  .ds-kanban-board-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
</style>
