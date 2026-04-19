<script lang="ts">
  import type { AssaySignalView } from '../../epistemic/types.js';

  interface Props {
    signal: AssaySignalView;
    class?: string;
  }

  let { signal, class: className = '' }: Props = $props();

  const resultColor = $derived(
    signal.result === 'Pass' ? 'var(--epistemic-cleared)' :
    signal.result === 'Fail' ? 'var(--epistemic-blocked)' :
    'var(--epistemic-degraded)'
  );

  const confidenceStr = $derived(
    signal.confidence !== null ? `${Math.round(signal.confidence * 100)}%` : '—'
  );
</script>

<div class="signal-bar {className}" class:hard-gate={signal.isHardGate}>
  <span class="signal-indicator" style="color: {resultColor}">
    {signal.isHardGate ? '■' : '□'}
  </span>
  <span class="signal-id">{signal.id}</span>
  <span class="signal-result" style="color: {resultColor}">
    {signal.result === 'Unavailable' ? 'unavail' : signal.result}
  </span>
  <span class="signal-confidence">{confidenceStr}</span>
  {#if signal.result === 'Fail' && signal.reason}
    <span class="signal-reason">{signal.reason}</span>
  {/if}
</div>

<style>
  .signal-bar {
    display: grid;
    grid-template-columns: 1.2rem 1fr auto auto;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) 0;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .signal-bar:not(:last-child) {
    border-bottom: 1px solid var(--border-subtle);
  }

  .signal-indicator {
    font-size: var(--text-sm);
    flex-shrink: 0;
  }

  .signal-id {
    color: var(--color-text-primary);
    font-size: var(--text-xs);
  }

  .signal-result {
    font-weight: 600;
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .signal-confidence {
    color: var(--color-text-tertiary);
    font-size: var(--text-xs);
    min-width: 3rem;
    text-align: right;
  }

  .signal-reason {
    grid-column: 2 / -1;
    color: var(--epistemic-blocked);
    font-size: var(--text-xs);
    font-style: italic;
    padding-top: var(--space-1);
  }
</style>
