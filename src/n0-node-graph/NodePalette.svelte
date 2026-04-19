<script lang="ts">
  import type { NodeDefinition } from './types';

  interface NodePaletteProps {
    definitions: NodeDefinition[];
    onselect?: (kind: string) => void;
  }

  let { definitions, onselect }: NodePaletteProps = $props();

  let searchQuery = $state('');

  // Filter definitions by search query
  let filtered = $derived(
    searchQuery.trim() === ''
      ? definitions
      : definitions.filter(def => {
          const q = searchQuery.toLowerCase();
          return (
            def.kind.toLowerCase().includes(q) ||
            def.label.toLowerCase().includes(q) ||
            def.description.toLowerCase().includes(q)
          );
        })
  );

  // Extract scope from a definition: use first port's type prefix (e.g., "app:ryu")
  // ScopedPortType = `${PortScope}:${string}:${string}` — we take first two segments
  function getScope(def: NodeDefinition): string {
    if (def.ports.length === 0) return 'General';
    const parts = def.ports[0].type.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return 'General';
  }

  // Group filtered definitions by scope
  let groups = $derived.by(() => {
    const map = new Map<string, NodeDefinition[]>();
    for (const def of filtered) {
      const scope = getScope(def);
      const list = map.get(scope);
      if (list) {
        list.push(def);
      } else {
        map.set(scope, [def]);
      }
    }
    return map;
  });

  // Track collapsed group state
  let collapsedGroups = $state<Set<string>>(new Set());

  function toggleGroup(scope: string) {
    const next = new Set(collapsedGroups);
    if (next.has(scope)) {
      next.delete(scope);
    } else {
      next.add(scope);
    }
    collapsedGroups = next;
  }

  function handleDragStart(e: DragEvent, def: NodeDefinition) {
    if (!e.dataTransfer) return;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ kind: def.kind, defaultSize: { width: 180, height: 120 } })
    );
  }

  function handleClick(kind: string) {
    onselect?.(kind);
  }

  function countPorts(def: NodeDefinition, direction: 'input' | 'output'): number {
    return def.ports.filter(p => p.direction === direction).length;
  }
</script>

<div class="n0-palette" role="complementary" aria-label="Node palette">
  <div class="n0-palette-search">
    <input
      type="text"
      placeholder="Filter nodes..."
      bind:value={searchQuery}
      aria-label="Filter node definitions"
    />
  </div>

  <div class="n0-palette-list">
    {#each [...groups] as [scope, defs] (scope)}
      <div class="n0-palette-group">
        <button
          class="n0-palette-group-header"
          onclick={() => toggleGroup(scope)}
          aria-expanded={!collapsedGroups.has(scope)}
        >
          <span class="n0-palette-chevron" class:collapsed={collapsedGroups.has(scope)}>
            &#9662;
          </span>
          <span class="n0-palette-group-label">{scope}</span>
          <span class="n0-palette-group-count">{defs.length}</span>
        </button>

        {#if !collapsedGroups.has(scope)}
          <div class="n0-palette-group-items">
            {#each defs as def (def.kind)}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="n0-palette-card"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, def)}
                onclick={() => handleClick(def.kind)}
                role="button"
                tabindex="0"
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(def.kind); }}
                aria-label="Add {def.label} node"
              >
                <div class="n0-palette-card-header">
                  <span class="n0-palette-card-label">{def.label}</span>
                  <span class="n0-palette-card-kind">{def.kind}</span>
                </div>
                {#if def.description}
                  <div class="n0-palette-card-desc">{def.description}</div>
                {/if}
                <div class="n0-palette-card-ports">
                  <span class="n0-palette-port-in" title="Inputs">
                    &#9654; {countPorts(def, 'input')} in
                  </span>
                  <span class="n0-palette-port-out" title="Outputs">
                    {countPorts(def, 'output')} out &#9654;
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    {#if filtered.length === 0}
      <div class="n0-palette-empty">No matching nodes</div>
    {/if}
  </div>
</div>

<style>
  .n0-palette {
    display: flex;
    flex-direction: column;
    width: 240px;
    height: 100%;
    background: var(--n0-node-bg);
    border-right: 1px solid var(--n0-node-border);
    overflow: hidden;
    font-family: var(--font-mono, monospace);
    color: var(--color-text, #e8e0d0);
  }

  .n0-palette-search {
    padding: 8px;
    border-bottom: 1px solid var(--n0-node-border);
    flex-shrink: 0;
  }

  .n0-palette-search input {
    width: 100%;
    box-sizing: border-box;
    padding: 6px 8px;
    background: var(--n0-canvas-bg);
    border: 1px solid var(--n0-node-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text, #e8e0d0);
    font-family: inherit;
    font-size: 0.8rem;
    outline: none;
  }

  .n0-palette-search input:focus {
    border-color: var(--n0-node-border-selected);
  }

  .n0-palette-search input::placeholder {
    color: var(--color-text-muted, #a09880);
  }

  .n0-palette-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .n0-palette-group-header {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 8px;
    background: var(--n0-node-header-bg);
    border: none;
    border-bottom: 1px solid var(--n0-node-border);
    color: var(--color-accent, #b87333);
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    text-align: left;
  }

  .n0-palette-group-header:hover {
    background: rgba(184, 115, 51, 0.15);
  }

  .n0-palette-chevron {
    display: inline-block;
    font-size: 0.65rem;
    transition: transform 150ms ease;
  }

  .n0-palette-chevron.collapsed {
    transform: rotate(-90deg);
  }

  .n0-palette-group-label {
    flex: 1;
  }

  .n0-palette-group-count {
    font-size: 0.65rem;
    opacity: 0.6;
  }

  .n0-palette-group-items {
    padding: 4px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .n0-palette-card {
    padding: 8px;
    background: var(--n0-canvas-bg);
    border: 1px solid var(--n0-node-border);
    border-radius: var(--n0-node-radius);
    cursor: grab;
    user-select: none;
    transition: border-color 150ms ease;
  }

  .n0-palette-card:hover {
    border-color: var(--n0-node-border-selected);
  }

  .n0-palette-card:active {
    cursor: grabbing;
  }

  .n0-palette-card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 2px;
  }

  .n0-palette-card-label {
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .n0-palette-card-kind {
    font-size: 0.6rem;
    color: var(--color-text-muted, #a09880);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .n0-palette-card-desc {
    font-size: 0.7rem;
    color: var(--color-text-muted, #a09880);
    line-height: 1.3;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .n0-palette-card-ports {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    opacity: 0.7;
  }

  .n0-palette-port-in {
    color: var(--n0-port-color-input);
  }

  .n0-palette-port-out {
    color: var(--n0-port-color-output);
  }

  .n0-palette-empty {
    padding: 16px;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-muted, #a09880);
  }
</style>
