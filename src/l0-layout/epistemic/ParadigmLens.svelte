<script lang="ts">
  import type { ParadigmDefinition } from '../../epistemic/types.js';

  type ParadigmId = 'spatial' | 'temporal' | 'hierarchical' | 'graph' | 'trust';

  interface Props {
    activeParadigm?: ParadigmId;
    onParadigmChange?: (id: ParadigmId) => void;
    class?: string;
  }

  let { activeParadigm = 'spatial', onParadigmChange, class: className = '' }: Props = $props();

  const PARADIGMS: ParadigmDefinition[] = [
    {
      id: 'spatial',
      label: 'Spatial',
      description: 'Knowledge arranged by position. Good for: spatial reasoning, clustering, free association.',
      conceals: 'Temporal ordering, verification state, provenance chains.',
      icon: '⊞',
    },
    {
      id: 'temporal',
      label: 'Temporal',
      description: 'Knowledge ordered by creation tick. Good for: understanding sequence, causation, when knowledge arrived.',
      conceals: 'Spatial relationships, clustering.',
      icon: '⊟',
    },
    {
      id: 'hierarchical',
      label: 'Hierarchical',
      description: 'Knowledge organized by source path and tags. Good for: file structure, categorical grouping.',
      conceals: 'Cross-cutting relationships, temporal dynamics.',
      icon: '⊠',
    },
    {
      id: 'graph',
      label: 'Graph',
      description: 'Knowledge atoms as nodes, connections as edges. Good for: network structure, indirect connections.',
      conceals: 'Spatial intuition, temporal sequence.',
      icon: '⊡',
    },
    {
      id: 'trust',
      label: 'Trust',
      description: 'Knowledge sorted by Allay stage. Good for: seeing what\'s trusted, contested, or unverified.',
      conceals: 'Spatial, temporal, and structural organization.',
      icon: '⊕',
    },
  ];

  let hoveredParadigm: ParadigmDefinition | null = $state(null);

  function select(id: ParadigmId) {
    onParadigmChange?.(id);
  }
</script>

<div class="ds-paradigm-lens {className}">
  <div class="tab-bar" role="tablist">
    {#each PARADIGMS as p}
      <button
        class="tab"
        class:active={activeParadigm === p.id}
        role="tab"
        aria-selected={activeParadigm === p.id}
        type="button"
        onmouseenter={() => hoveredParadigm = p}
        onmouseleave={() => hoveredParadigm = null}
        onclick={() => select(p.id as ParadigmId)}
      >
        <span class="tab-icon">{p.icon}</span>
        <span class="tab-label">{p.label}</span>
      </button>
    {/each}
  </div>

  {#if hoveredParadigm}
    <div class="paradigm-tooltip">
      <strong>{hoveredParadigm.label}</strong>
      <p>{hoveredParadigm.description}</p>
      <p class="conceals">Conceals: {hoveredParadigm.conceals}</p>
    </div>
  {:else}
    {@const current = PARADIGMS.find(p => p.id === activeParadigm)}
    {#if current}
      <div class="paradigm-tooltip muted">
        <strong>{current.label}</strong>
        <p>{current.description}</p>
        <p class="conceals">Conceals: {current.conceals}</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .ds-paradigm-lens {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-family: var(--font-sans);
  }

  .tab-bar {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid var(--border-default);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tab-bar::-webkit-scrollbar { display: none; }

  .tab {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--color-text-tertiary);
    cursor: pointer;
    white-space: nowrap;
    transition: color 150ms, border-color 150ms;
  }

  .tab:hover { color: var(--color-text-secondary); }

  .tab.active {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
  }

  .tab-icon { font-size: var(--text-sm); }
  .tab-label { font-size: var(--text-xs); }

  .paradigm-tooltip {
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-panel-elevated);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-subtle);
    font-size: var(--text-xs);
  }

  .paradigm-tooltip.muted { opacity: 0.7; }

  .paradigm-tooltip strong {
    color: var(--color-text-primary);
    font-weight: 600;
    display: block;
    margin-bottom: var(--space-1);
  }

  .paradigm-tooltip p {
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .paradigm-tooltip .conceals {
    color: var(--color-text-muted);
    margin-top: var(--space-1);
    font-style: italic;
  }
</style>
