<script lang="ts">
  import type { KnowledgeEpistemicDetail, ProvenanceChainNode } from '../../epistemic/types.js';
  import AssayBadge from '../../u0-primitives/assay-badge/AssayBadge.svelte';
  import AllayGauge from '../../u0-primitives/allay-gauge/AllayGauge.svelte';
  import ExpertBadge from '../../u0-primitives/expert-badge/ExpertBadge.svelte';
  import AssayDetailPanel from './AssayDetailPanel.svelte';
  import AllayDetailPanel from './AllayDetailPanel.svelte';
  import ProvenanceChain from './ProvenanceChain.svelte';
  import AvenueTrace from './AvenueTrace.svelte';

  interface Props {
    detail: KnowledgeEpistemicDetail;
    onnodeclick?: (node: ProvenanceChainNode) => void;
    class?: string;
  }

  let { detail, onnodeclick, class: className = '' }: Props = $props();

  type Tab = 'overview' | 'allay' | 'assay' | 'provenance' | 'trace';
  let activeTab: Tab = $state('overview');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'allay', label: 'Allay' },
    { id: 'assay', label: 'ASSAY' },
    { id: 'provenance', label: 'Provenance' },
    { id: 'trace', label: 'Ψ-Trace' },
  ];

  const hashPreview = $derived(
    detail.contentHash.length > 12 ? detail.contentHash.slice(0, 12) + '…' : detail.contentHash
  );


</script>

<div class="ds-knowledge-detail {className}">
  <!-- Tab bar -->
  <div class="tab-bar" role="tablist">
    {#each tabs as tab}
      <button
        class="tab"
        class:active={activeTab === tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        onclick={() => activeTab = tab.id}
        type="button"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab content -->
  <div class="tab-content">

    {#if activeTab === 'overview'}
      <div class="overview">
        <div class="field-row">
          <span class="field-label">Title</span>
          <span class="field-value">{detail.title}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Source</span>
          <span class="field-value mono">{detail.source}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Expert</span>
          {#if detail.expert && typeof detail.expert === 'object'}
            <ExpertBadge expert={detail.expert} size="md" />
          {:else}
            <span class="field-value">{detail.expert ?? '—'}</span>
          {/if}
        </div>
        <div class="field-row">
          <span class="field-label">Content hash</span>
          <span class="field-value mono" title={detail.contentHash}>{hashPreview}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Convergence</span>
          <span class="field-value">{detail.convergence} independent witness(es)</span>
        </div>
        <div class="field-row">
          <span class="field-label">Allay</span>
          <AllayGauge stage={detail.allay.stage} confidence={detail.allay.confidence} size="sm" showLabel />
        </div>
        <div class="field-row">
          <span class="field-label">ASSAY</span>
          {#if detail.assay}<AssayBadge clearance={detail.assay} size="md" />{/if}
        </div>
      </div>

    {:else if activeTab === 'allay'}
      <AllayDetailPanel allay={detail.allay} />

    {:else if activeTab === 'assay'}
      {#if detail.assay}
        <AssayDetailPanel clearance={detail.assay} />
      {:else}
        <div class="empty">ASSAY not yet evaluated for this atom.</div>
      {/if}

    {:else if activeTab === 'provenance'}
      <ProvenanceChain nodes={detail.provenance ?? []} {onnodeclick} />

    {:else if activeTab === 'trace'}
      {#if detail.avenue}
        <AvenueTrace trace={detail.avenue} expanded={true} />
      {:else}
        <div class="empty">No avenue trace available</div>
      {/if}
    {/if}

  </div>
</div>

<style>
  .ds-knowledge-detail {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-panel);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    min-width: 360px;
    max-width: 600px;
    font-family: var(--font-sans);
    overflow: hidden;
  }

  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--border-default);
    background: var(--color-bg-panel-elevated);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tab-bar::-webkit-scrollbar { display: none; }

  .tab {
    padding: var(--space-2) var(--space-4);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
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

  .tab-content {
    padding: var(--space-4);
    overflow-y: auto;
    max-height: 60vh;
  }

  .overview {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .field-row {
    display: grid;
    grid-template-columns: 7rem 1fr;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .field-label {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }

  .field-value {
    font-size: var(--text-xs);
    color: var(--color-text-primary);
  }

  .mono {
    font-family: var(--font-mono);
    word-break: break-all;
  }

  .empty {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
    padding: var(--space-4) 0;
    text-align: center;
  }
</style>
