<script lang="ts">
  interface Props {
    stage: 0 | 1 | 2 | 3 | 4 | 5;
    confidence: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
  }

  let { stage, confidence, size = 'md', showLabel = false }: Props = $props();

  const STAGE_NAMES = ['Propose', 'Parse', 'Authorize', 'Execute', 'Trace', 'Replicate'];
  const stageName = $derived(STAGE_NAMES[stage] ?? 'Unknown');
  const pct = $derived(`${Math.round(confidence * 100)}%`);
</script>

<div class="allay-gauge size-{size}">
  <div class="gauge-ring" style="--stage: {stage}; --confidence: {confidence}">
    <span class="gauge-stage">{stage}</span>
  </div>
  {#if showLabel}
    <span class="gauge-label">{stageName} · {pct}</span>
  {/if}
</div>

<style>
  .allay-gauge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .gauge-ring {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 2px solid var(--color-accent);
    background: conic-gradient(
      var(--color-accent) calc(var(--confidence) * 360deg),
      var(--border-subtle) calc(var(--confidence) * 360deg)
    );
  }
  .size-sm .gauge-ring { width: 24px; height: 24px; }
  .size-md .gauge-ring { width: 32px; height: 32px; }
  .size-lg .gauge-ring { width: 48px; height: 48px; }
  .gauge-stage {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-text-primary);
  }
  .size-sm .gauge-stage { font-size: 10px; }
  .size-md .gauge-stage { font-size: var(--text-xs); }
  .size-lg .gauge-stage { font-size: var(--text-sm); }
  .gauge-label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-family: var(--font-sans);
  }
</style>
