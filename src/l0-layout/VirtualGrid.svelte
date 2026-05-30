<script lang="ts" module>
  /**
   * VirtualGrid — Virtualized grid layout with item preloading
   * 
   * A generalized version of NNJAS VirtualNodeGrid for the LEAP design system.
   * Efficiently renders large grids by only mounting visible items.
   * 
   * @example
   * <VirtualGrid
   *   items={nodes}
   *   itemHeight={120}
   *   columns={5}
   *   gap={8}
   *   let:item
   *   let:index
   * >
   *   <Card title={item.title} />
   * </VirtualGrid>
   */
  export interface GridItem {
    id: string;
    [key: string]: unknown;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { createVirtualGrid, createPreloader } from '../s0-state/virtual.js';

  interface Props {
    items: GridItem[];
    columns?: number;
    itemHeight?: number;
    gap?: number;
    overscan?: number;
    containerHeight: number;
    containerWidth: number;
    preloadAhead?: number;
    /**
     * Snippet for rendering each item.
     * Receives the item and its index.
     */
    children: Snippet<[GridItem, number]>;
    /**
     * Optional snippet for rendering while loading
     */
    loadingSnippet?: Snippet;
    class?: string;
  }

  let {
    items,
    columns = 5,
    itemHeight = 120,
    gap = 8,
    overscan = 2,
    containerHeight,
    containerWidth,
    preloadAhead = 2,
    children,
    loadingSnippet,
    class: className = ''
  }: Props = $props();

  // Grid calculation
  let effectiveColumns = $derived(
    Math.max(1, Math.floor((containerWidth + gap) / (Math.floor((containerWidth - (columns - 1) * gap) / columns) + gap)))
  );

  // Virtual grid state
  let scrollTop = $state(0);
  let scrollContainer: HTMLDivElement | undefined = $state();

  let virtualGrid = $derived(
    createVirtualGrid({
      totalItems: items.length,
      columns: effectiveColumns,
      itemHeight,
      gap,
      overscan,
      containerHeight
    })
  );

  let visibleRows = $derived(virtualGrid.getVisibleRows(scrollTop));

  // Flatten visible rows to items with positions
  let visibleItems = $derived.by(() => {
    const result: Array<{ item: GridItem; index: number; style: string }> = [];

    for (const row of visibleRows) {
      const rowItems = virtualGrid.getItemsInRow(row.index);
      for (let col = 0; col < rowItems.length; col++) {
        const index = rowItems[col];
        if (index < items.length) {
          const x = col * (containerWidth / effectiveColumns);
          const y = row.offset;
          result.push({
            item: items[index],
            index,
            style: `position: absolute; left: ${x}px; top: ${y}px; width: ${containerWidth / effectiveColumns - gap}px; height: ${itemHeight}px;`
          });
        }
      }
    }

    return result;
  });

  // Preloader for content
  let preloader = $derived(
    createPreloader<string>({ preloadAhead, keepBehind: 1 })
  );

  // Track loaded content
  let loadedContent = $state<Set<string>>(new Set());
  let loadingContent = $state<Set<string>>(new Set());

  // Update preloader when visible items change
  $effect(() => {
    const visibleIds = visibleItems.map(v => v.item.id);
    const allIds = items.map(i => i.id);
    const state = preloader.update(visibleIds, allIds);

    // Mark for loading
    for (const id of state.toLoad) {
      if (!loadingContent.has(id) && !loadedContent.has(id)) {
        loadingContent.add(id);
        // Simulate async load - in real use, this would fetch content
        setTimeout(() => {
          loadedContent.add(id);
          loadingContent.delete(id);
        }, 50);
      }
    }

    // Mark for unloading (cleanup)
    for (const id of state.toUnload) {
      loadedContent.delete(id);
    }
  });

  function handleScroll(e: Event) {
    const target = e.target as HTMLDivElement;
    scrollTop = target.scrollTop;
  }
</script>

<div
  class="virtual-grid {className}"
  style="height: {containerHeight}px;"
>
  <div
    class="virtual-grid-scroll"
    bind:this={scrollContainer}
    onscroll={handleScroll}
    style="height: 100%; overflow-y: auto;"
  >
    <div
      class="virtual-grid-content"
      style="height: {virtualGrid.totalHeight}px; position: relative;"
    >
      {#each visibleItems as { item, index, style } (item.id)}
        <div class="virtual-grid-item" {style}>
          {#if loadedContent.has(item.id)}
            {@render children(item, index)}
          {:else if loadingSnippet}
            {@render loadingSnippet()}
          {:else}
            <div class="virtual-grid-placeholder" style="width: 100%; height: 100%;"></div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .virtual-grid {
    position: relative;
    width: 100%;
    background: var(--color-bg-canvas, #1a1a1a);
  }

  .virtual-grid-scroll {
    scrollbar-width: thin;
    scrollbar-color: var(--color-text-muted, #666) var(--color-bg-panel, #222);
  }

  .virtual-grid-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .virtual-grid-scroll::-webkit-scrollbar-track {
    background: var(--color-bg-panel, #222);
  }

  .virtual-grid-scroll::-webkit-scrollbar-thumb {
    background: var(--color-text-muted, #666);
    border-radius: 4px;
  }

  .virtual-grid-content {
    width: 100%;
  }

  .virtual-grid-item {
    box-sizing: border-box;
  }

  .virtual-grid-placeholder {
    background: var(--color-bg-panel, #222);
    border-radius: var(--radius-md, 4px);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
  }
</style>
