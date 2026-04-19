<script lang="ts">
  import type { AllayStageView } from '../../epistemic/types.js';
  import AllayGauge from '../../u0-primitives/allay-gauge/AllayGauge.svelte';

  interface Props {
    allay: AllayStageView;
    class?: string;
  }

  let { allay, class: className = '' }: Props = $props();

  const STAGE_DESCRIPTIONS = [
    'Knowledge has been proposed but not yet evaluated.',
    'Content has been parsed and structure verified.',
    'Authorized — passed capability and schema checks.',
    'Executed — reasoning chain verified by ASSAY signals.',
    'Traced — provenance logged on the sigchain.',
    'Replicated — independently witnessed by multiple parties.',
  ];

  const description = $derived(STAGE_DESCRIPTIONS[allay.stage] ?? '');
  const confidencePct = $derived(`${Math.round(allay.confidence * 100)}%`);
</script>

<div class="ds-allay-detail {className}">
  <div class="gauge-section">
    <AllayGauge stage={allay.stage} confidence={allay.confidence} size="lg" showLabel />
    <span class="confidence">{confidencePct}</span>
  </div>

  <div class="stage-info">
    <div class="stage-name">Stage {allay.stage}: {allay.stageName}</div>
    <div class="stage-desc">{description}</div>
  </div>

  <div class="scale-legend">
    {#each [0, 1, 2, 3, 4, 5] as s}
      <div class="scale-item" class:current={s === allay.stage}>
        <AllayGauge stage={s as 0|1|2|3|4|5} confidence={0.5} size="sm" />
        <span>{s}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .ds-allay-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--color-bg-panel);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    min-width: 280px;
    font-family: var(--font-sans);
  }

  .gauge-section {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .confidence {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .stage-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .stage-name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .stage-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .scale-legend {
    display: flex;
    gap: var(--space-2);
    padding-top: var(--space-2);
    border-top: 1px solid var(--border-subtle);
  }

  .scale-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    opacity: 0.5;
  }

  .scale-item.current {
    opacity: 1;
  }

  .scale-item span {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-text-tertiary);
  }
</style>
