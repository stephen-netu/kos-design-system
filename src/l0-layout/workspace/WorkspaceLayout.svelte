<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    sidebar?: Snippet;
    header?: Snippet;
    contextPanel?: Snippet;
    main?: Snippet;
    class?: string;
  }

  let {
    sidebar,
    header,
    contextPanel,
    main,
    class: className = ''
  }: Props = $props();
</script>

<div class="ds-workspace-layout {className}">
  {#if sidebar}
    <div class="ds-layout-sidebar">
      {@render sidebar()}
    </div>
  {/if}

  <div class="ds-layout-content-area">
    {#if header}
      <div class="ds-layout-header">
        {@render header()}
      </div>
    {/if}

    <main class="ds-layout-main">
      {#if main}
        {@render main()}
      {/if}

      <!-- Context Panel overlays or sits beside main content -->
      {#if contextPanel}
        <div class="ds-layout-context">
          {@render contextPanel()}
        </div>
      {/if}
    </main>
  </div>
</div>

<style>
  .ds-workspace-layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--color-bg-app);
    color: var(--color-text-primary);
  }

  .ds-layout-sidebar {
    height: 100%;
    /* Sidebar component itself handles its width and collapse state */
  }

  .ds-layout-content-area {
    flex: 1;
    min-width: 0; /* Important for deeply nested flex overflows */
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }

  .ds-layout-header {
    flex-shrink: 0;
    /* Header component manages its height */
  }

  .ds-layout-main {
    flex: 1;
    position: relative;
    overflow: hidden; /* Main child should scroll if needed */
    display: flex;
  }

  /* 
    The Context Panel is typically positioned absolute covering the right side 
    or flexed alongside. Our ContextPanel component is absolute by default.
  */
  .ds-layout-context {
    position: static; /* Let the ContextPanel's absolute positioning work relative to main */
  }
</style>
