<script lang="ts">
  import ValidityBadge from '../u0-primitives/badge/ValidityBadge.svelte';
  import { getValidityColor, getValidityLabel } from '../u0-primitives/badge/validity-utils';

  interface Props {
    score: number;
    total?: number;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    showProgress?: boolean;
    showLabel?: boolean;
    class?: string;
  }

  let {
    score,
    total = 1000,
    label,
    size = 'md',
    showProgress = false,
    showLabel = false,
    class: className = ''
  }: Props = $props();

  const validityColor = $derived(getValidityColor(score));
  const validityLabel = $derived(getValidityLabel(score));
  const percentage = $derived(total > 0 ? Math.round((score / total) * 100) : 0);
  const clampedPercentage = $derived(Math.max(0, Math.min(100, percentage)));

  function getValidityColorClass(score: number): string {
    if (score >= 900) return 'validity-high';
    if (score >= 700) return 'validity-medium';
    if (score >= 500) return 'validity-low';
    return 'validity-critical';
  }
</script>

<div class="ds-validity-score-display {getValidityColorClass(score)} {className}" role="region" aria-label={label || validityLabel}>
  {#if label}
    <div class="ds-validity-label-main">{label}</div>
  {/if}
  
  <div class="ds-validity-score-row">
    <ValidityBadge {score} {total} {size} {showLabel} />
    
    {#if showProgress}
      <div class="ds-validity-progress-container">
        <div 
          class="ds-validity-progress-bar" 
          style="width: {clampedPercentage}%"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Validity score: {score} of {total}"
        ></div>
      </div>
      <span class="ds-validity-percentage">{percentage}%</span>
    {/if}
  </div>
  
  {#if showLabel && !showProgress}
    <div class="ds-validity-sublabel">{validityLabel}</div>
  {/if}
</div>

<style>
  .ds-validity-score-display {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .ds-validity-label-main {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .ds-validity-score-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .ds-validity-progress-container {
    flex: 1;
    min-width: 80px;
    max-width: 200px;
    height: var(--validity-progress-height);
    background: var(--validity-progress-bg);
    border-radius: var(--validity-progress-border-radius);
    overflow: hidden;
  }

  .ds-validity-progress-bar {
    height: 100%;
    border-radius: var(--validity-progress-border-radius);
    transition: width var(--transition-normal);
  }

  .ds-validity-percentage {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    min-width: 2.5rem;
    text-align: right;
  }

  .ds-validity-sublabel {
    font-size: var(--text-xs);
    opacity: 0.7;
  }

  /* High Validity */
  .validity-high {
    border-left: 3px solid var(--validity-high);
  }
  .validity-high .ds-validity-progress-bar {
    background: var(--validity-high);
  }

  /* Medium Validity */
  .validity-medium {
    border-left: 3px solid var(--validity-medium);
  }
  .validity-medium .ds-validity-progress-bar {
    background: var(--validity-medium);
  }

  /* Low Validity */
  .validity-low {
    border-left: 3px solid var(--validity-low);
  }
  .validity-low .ds-validity-progress-bar {
    background: var(--validity-low);
  }

  /* Critical Validity */
  .validity-critical {
    border-left: 3px solid var(--validity-critical);
  }
  .validity-critical .ds-validity-progress-bar {
    background: var(--validity-critical);
  }

  /* Hover effect */
  .ds-validity-score-display:hover {
    background: var(--color-bg-panel-elevated);
  }
</style>
