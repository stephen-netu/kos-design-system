<script lang="ts">
  import type { AssayClearanceView } from '../../epistemic/types.js';
  import AssayBadge from '../../u0-primitives/assay-badge/AssayBadge.svelte';
  import AssaySignalBar from '../../u0-primitives/assay-badge/AssaySignalBar.svelte';

  interface Props {
    clearance: AssayClearanceView;
    onViewWitness?: () => void;
    onViewHash?: () => void;
    class?: string;
  }

  let { clearance, onViewWitness, onViewHash, class: className = '' }: Props = $props();

  const hardGates = $derived(clearance.signals.filter(s => s.isHardGate));
  const weightedSignals = $derived(clearance.signals.filter(s => !s.isHardGate));
  const weightedSumPct = $derived((clearance.weightedSum * 100).toFixed(0));
</script>

<div class="ds-assay-detail {className}">
  <!-- Header -->
  <div class="header">
    <div class="header-row">
      <span class="label">Checkpoint:</span>
      <span class="value">{clearance.checkpoint}</span>
      <span class="label">Tick:</span>
      <span class="value mono">{clearance.computedAt}</span>
    </div>
    <div class="header-row">
      <span class="label">Gate:</span>
      <AssayBadge {clearance} size="md" />
      <span class="label">Weighted:</span>
      <span class="value mono">{weightedSumPct}%</span>
    </div>
  </div>

  <!-- Hard Gates section -->
  {#if hardGates.length > 0}
    <div class="section">
      <div class="section-title">Hard Gates</div>
      {#each hardGates as signal}
        <AssaySignalBar {signal} />
      {/each}
    </div>
  {/if}

  <!-- Weighted Signals section -->
  {#if weightedSignals.length > 0}
    <div class="section">
      <div class="section-title">Weighted Signals</div>
      {#each weightedSignals as signal}
        <AssaySignalBar {signal} />
      {/each}
    </div>
  {/if}

  {#if clearance.isDegraded}
    <div class="degraded-notice">
      Degraded — some soft signals were unavailable at evaluation time
    </div>
  {/if}

  <!-- Footer -->
  <div class="footer">
    <button class="link-btn" type="button" onclick={onViewWitness}>
      View sigchain witness
    </button>
    <button class="link-btn" type="button" onclick={onViewHash}>
      View clearance hash
    </button>
  </div>
</div>

<style>
  .ds-assay-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--color-bg-panel);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    min-width: 320px;
    font-family: var(--font-sans);
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-subtle);
  }

  .header-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .label {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    min-width: 6rem;
  }

  .value {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .mono {
    font-family: var(--font-mono);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .section-title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: var(--space-1) 0;
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: var(--space-1);
  }

  .degraded-notice {
    font-size: var(--text-xs);
    color: var(--epistemic-degraded);
    font-style: italic;
    padding: var(--space-2);
    background: rgba(107, 114, 128, 0.08);
    border-radius: var(--radius-sm);
  }

  .footer {
    display: flex;
    gap: var(--space-3);
    padding-top: var(--space-2);
    border-top: 1px solid var(--border-subtle);
  }

  .link-btn {
    background: none;
    border: none;
    padding: 0;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-accent);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .link-btn:hover {
    color: var(--color-accent-hover);
  }
</style>
