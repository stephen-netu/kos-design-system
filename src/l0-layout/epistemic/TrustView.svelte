<script lang="ts">
  import type { KnowledgeEpistemicDetail } from '../../epistemic/types.js';
  import AssayBadge from '../../u0-primitives/assay-badge/AssayBadge.svelte';
  import AllayGauge from '../../u0-primitives/allay-gauge/AllayGauge.svelte';
  import ExpertBadge from '../../u0-primitives/expert-badge/ExpertBadge.svelte';

  interface Props {
    knowledge: KnowledgeEpistemicDetail[];
    onitemclick?: (item: KnowledgeEpistemicDetail) => void;
    class?: string;
  }

  let { knowledge, onitemclick, class: className = '' }: Props = $props();

  type GateGroup = 'Cleared' | 'Pending' | 'Blocked';
  let activeGroup: GateGroup = $state('Cleared');

  const groups: GateGroup[] = ['Cleared', 'Pending', 'Blocked'];

  const sorted = $derived(
    [...knowledge].sort((a, b) => b.allay.stage - a.allay.stage)
  );

  const cleared = $derived(sorted.filter(k => k.assay?.gate === 'Cleared'));
  const blocked = $derived(sorted.filter(k => k.assay?.gate === 'Blocked'));
  const pending = $derived(sorted.filter(k => !k.assay || (k.assay.gate !== 'Cleared' && k.assay.gate !== 'Blocked')));

  function getGroup(group: GateGroup): KnowledgeEpistemicDetail[] {
    switch (group) {
      case 'Cleared': return cleared;
      case 'Blocked': return blocked;
      case 'Pending': return pending;
    }
  }

  function groupCount(group: GateGroup): number {
    return getGroup(group).length;
  }
</script>

<div class="ds-trust-view {className}">
  <!-- Group tabs -->
  <div class="group-tabs" role="tablist">
    {#each groups as group}
      <button
        class="group-tab"
        class:active={activeGroup === group}
        class:cleared={group === 'Cleared'}
        class:blocked={group === 'Blocked'}
        class:pending={group === 'Pending'}
        role="tab"
        aria-selected={activeGroup === group}
        type="button"
        onclick={() => activeGroup = group}
      >
        {group}
        <span class="count">{groupCount(group)}</span>
      </button>
    {/each}
  </div>

  <!-- Knowledge list -->
  <div class="knowledge-list">
    {#each getGroup(activeGroup) as item}
      <button
        class="knowledge-item"
        type="button"
        onclick={() => onitemclick?.(item)}
      >
        <div class="item-gauges">
          <AllayGauge stage={item.allay.stage} confidence={item.allay.confidence} size="sm" />
          <AssayBadge clearance={item.assay ?? null} size="sm" />
        </div>
        <div class="item-info">
          <span class="item-title">{item.title}</span>
          <span class="item-source">{item.source}</span>
        </div>
        {#if item.expert}<ExpertBadge expert={item.expert} size="sm" showName={false} />{/if}
      </button>
    {/each}

    {#if getGroup(activeGroup).length === 0}
      <div class="empty">No {activeGroup.toLowerCase()} knowledge atoms</div>
    {/if}
  </div>
</div>

<style>
  .ds-trust-view {
    display: flex;
    flex-direction: column;
    font-family: var(--font-sans);
  }

  .group-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-default);
    margin-bottom: var(--space-3);
  }

  .group-tab {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-4);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: color 150ms, border-color 150ms;
  }

  .group-tab.active.cleared { color: var(--epistemic-cleared); border-bottom-color: var(--epistemic-cleared); }
  .group-tab.active.blocked { color: var(--epistemic-blocked); border-bottom-color: var(--epistemic-blocked); }
  .group-tab.active.pending { color: var(--epistemic-pending); border-bottom-color: var(--epistemic-pending); }

  .count {
    background: var(--color-bg-panel-elevated);
    border-radius: var(--radius-full);
    padding: 0 var(--space-1);
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
  }

  .knowledge-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .knowledge-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-panel-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: left;
    transition: background 150ms, border-color 150ms;
    width: 100%;
  }

  .knowledge-item:hover {
    background: var(--color-bg-panel);
    border-color: var(--border-hover);
  }

  .item-gauges {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .item-title {
    font-size: var(--text-xs);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-source {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
    padding: var(--space-4);
    text-align: center;
  }
</style>
