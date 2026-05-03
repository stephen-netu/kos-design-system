<script lang="ts">
  import { Tabs, type Tab } from '../u0-primitives';
  import MermaidDiagram from './MermaidDiagram.svelte';
  import MarkmapDiagram from './MarkmapDiagram.svelte';
  import type { DiagramPanelItem, RenderOptions } from './types';

  let { items, layout = 'tabs', options = {} }: {
    items: DiagramPanelItem[];
    layout?: 'tabs' | 'grid';
    options?: RenderOptions;
  } = $props();

  function renderDiagram(item: DiagramPanelItem) {
    if (item.spec.type === 'mermaid') {
      return MermaidDiagram;
    } else if (item.spec.type === 'markmap') {
      return MarkmapDiagram;
    }
    return null;
  }

  let tabs: Tab[] = $derived(items.map(i => ({
    id: i.id,
    label: i.spec.title ?? i.id
  })));

  let activeTabId = $state('');
  let activeItem = $derived(items.find(i => i.id === activeTabId) ?? null);
  let ActiveComponent = $derived(activeItem ? renderDiagram(activeItem) : null);
</script>

{#if layout === 'tabs'}
  <div class="v0-diagram-tabs">
    <Tabs {tabs} bind:activeId={activeTabId} />
    <div class="v0-diagram-panel">
      {#if ActiveComponent && activeItem}
        <ActiveComponent spec={activeItem.spec} options={activeItem.options ?? options} />
      {/if}
    </div>
  </div>
{:else}
  <div class="v0-diagram-grid">
    {#each items as item (item.id)}
      {@const Component = renderDiagram(item)}
      {#if Component}
        <Component spec={item.spec} options={item.options ?? options} />
      {/if}
    {/each}
  </div>
{/if}

<style>
  .v0-diagram-tabs {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .v0-diagram-panel {
    min-height: 200px;
  }

  .v0-diagram-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--space-4);
  }
</style>
