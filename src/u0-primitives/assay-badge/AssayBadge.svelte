<script lang="ts">
  import type { AssayClearanceView } from '../../epistemic/types.js';

  interface Props {
    clearance: AssayClearanceView | null;
    size?: 'sm' | 'md';
    interactive?: boolean;
    onclick?: () => void;
    class?: string;
  }

  let {
    clearance,
    size = 'md',
    interactive = false,
    onclick,
    class: className = '',
  }: Props = $props();

  // Derive display state from clearance
  const state = $derived(
    clearance === null ? 'pending' :
    clearance.isDegraded ? 'degraded' :
    clearance.gate === 'Cleared' ? 'cleared' : 'blocked'
  );

  const dotColor = $derived(
    state === 'cleared'  ? 'var(--epistemic-cleared)' :
    state === 'blocked'  ? 'var(--epistemic-blocked)' :
    state === 'degraded' ? 'var(--epistemic-degraded)' :
    /* pending */          'var(--epistemic-pending)'
  );

  const label = $derived(
    state === 'cleared'  ? 'Cleared' :
    state === 'blocked'  ? 'Blocked' :
    state === 'degraded' ? 'Degraded' :
    'Pending'
  );

  const title = $derived(
    clearance === null ? 'ASSAY: Not yet evaluated' :
    `ASSAY ${label} at ${clearance.checkpoint} — weighted: ${clearance.weightedSum.toFixed(2)}`
  );

  function handleClick() {
    if (interactive && onclick) onclick();
  }
</script>

<button
  class="ds-assay-badge size-{size} state-{state} {className}"
  class:interactive
  {title}
  onclick={handleClick}
  type="button"
  aria-label="ASSAY clearance: {label}"
  tabindex={interactive ? 0 : -1}
>
  <span class="dot" style="background-color: {dotColor}; box-shadow: 0 0 4px {dotColor};"></span>
  {#if size === 'md'}
    <span class="label">{label}</span>
  {/if}
</button>

<style>
  .ds-assay-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-full);
    border: 1px solid var(--border-subtle);
    background: transparent;
    cursor: default;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--color-text-secondary);
    white-space: nowrap;
    transition: background var(--transition-fast, 120ms), border-color var(--transition-fast, 120ms);
  }

  .ds-assay-badge.interactive {
    cursor: pointer;
  }

  .ds-assay-badge.interactive:hover {
    background: var(--color-bg-panel-elevated);
    border-color: var(--border-hover);
  }

  .ds-assay-badge.size-sm {
    padding: 2px;
    border: none;
    background: transparent;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .size-sm .dot {
    width: 6px;
    height: 6px;
  }

  .label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  /* State-specific label colors */
  .state-cleared .label { color: var(--epistemic-cleared); }
  .state-blocked .label  { color: var(--epistemic-blocked); }
  .state-pending .label  { color: var(--epistemic-pending); }
  .state-degraded .label { color: var(--epistemic-degraded); }
</style>
