<script lang="ts">
  import type { AllayStageView } from '../../epistemic/types.js';

  interface Props {
    stage: 0 | 1 | 2 | 3 | 4 | 5;
    confidence: number;           // 0.0–1.0, shown as % on hover
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  let {
    stage,
    confidence,
    showLabel = false,
    size = 'md',
    class: className = '',
  }: Props = $props();

  // Stage metadata
  const STAGE_NAMES = ['Propose', 'Parse', 'Authorize', 'Execute', 'Trace', 'Replicate'];
  const STAGE_VARS = [
    'var(--epistemic-stage-0)',
    'var(--epistemic-stage-1)',
    'var(--epistemic-stage-2)',
    'var(--epistemic-stage-3)',
    'var(--epistemic-stage-4)',
    'var(--epistemic-stage-5)',
  ];

  const stageName = $derived(STAGE_NAMES[stage] ?? 'Unknown');
  const stageColor = $derived(stage > 0 ? STAGE_VARS[stage] : STAGE_VARS[0]);
  const confidencePct = $derived(`${Math.round(confidence * 100)}%`);
  const tooltipText = $derived(`${stageName} (${confidencePct})`);

  // 5 segments, indices 0-4; segment i is filled when stage > i
  const segments = [0, 1, 2, 3, 4];
</script>

<div
  class="ds-allay-gauge size-{size} {className}"
  title={tooltipText}
  aria-label="Allay verification: {stageName}, {confidencePct}"
  role="img"
>
  <div class="segments">
    {#each segments as i}
      <div
        class="segment"
        class:filled={stage > i}
        style={stage > i ? `background-color: ${stageColor};` + (stage === 5 ? ` box-shadow: 0 0 3px var(--epistemic-stage-5-glow);` : '') : ''}
      ></div>
    {/each}
  </div>
  {#if showLabel}
    <span class="stage-label">{stageName}</span>
  {/if}
</div>

<style>
  .ds-allay-gauge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: default;
  }

  .segments {
    display: flex;
    gap: 2px;
  }

  .segment {
    border-radius: var(--radius-xs, 2px);
    background-color: var(--color-bg-panel-elevated, #2a2a2a);
    border: 1px solid var(--border-subtle);
    transition: background-color 200ms;
  }

  /* Size variants */
  .size-sm .segment { width: 6px; height: 10px; }
  .size-md .segment { width: 8px; height: 14px; }
  .size-lg .segment { width: 12px; height: 20px; }

  .stage-label {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }
</style>
