<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getValidityColor, getValidityLabel } from './validity-utils';

  interface Props {
    score?: number;
    total?: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    score = 0,
    total = 1000,
    size = 'md',
    showLabel = false,
    class: className = '',
    children
  }: Props = $props();

  const validityColor = $derived(getValidityColor(score));
  const validityLabel = $derived(getValidityLabel(score));
  const percentage = $derived(total > 0 ? Math.round((score / total) * 100) : 0);
</script>

<div
  class="ds-validity-badge size-{size} validity-color-{validityColor} {className}"
  role="status"
  aria-label={validityLabel}
  title={`${validityLabel}: ${score}/${total} (${percentage}%)`}
>
  {#if children}
    <span class="ds-validity-content">
      {@render children()}
    </span>
  {:else}
    <span class="ds-validity-score">{score}</span>
    <span class="ds-validity-divider">/</span>
    <span class="ds-validity-total">{total}</span>
    {#if showLabel}
      <span class="ds-validity-label">{validityLabel}</span>
    {/if}
  {/if}
</div>

<style>
  .ds-validity-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-weight: 700;
    white-space: nowrap;
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
    gap: 0.125rem;
  }

  /* High Validity (900-1000) */
  .validity-color-high {
    background: var(--validity-high-bg);
    color: var(--validity-high);
    border: 1px solid var(--validity-high-border);
  }

  /* Medium Validity (700-899) */
  .validity-color-medium {
    background: var(--validity-medium-bg);
    color: var(--validity-medium);
    border: 1px solid var(--validity-medium-border);
  }

  /* Low Validity (500-699) */
  .validity-color-low {
    background: var(--validity-low-bg);
    color: var(--validity-low);
    border: 1px solid var(--validity-low-border);
  }

  /* Critical Validity (0-499) */
  .validity-color-critical {
    background: var(--validity-critical-bg);
    color: var(--validity-critical);
    border: 1px solid var(--validity-critical-border);
  }

  /* Sizes */
  .size-sm {
    padding: 0.1rem 0.35rem;
    font-size: 0.65rem;
    line-height: 1;
  }

  .size-md {
    padding: 0.15rem 0.5rem;
    font-size: var(--text-xs);
    line-height: 1.2;
  }

  .size-lg {
    padding: 0.25rem 0.75rem;
    font-size: var(--text-sm);
    line-height: 1.4;
  }

  .ds-validity-score {
    font-weight: 700;
  }

  .ds-validity-divider {
    opacity: 0.5;
    font-weight: 400;
  }

  .ds-validity-total {
    font-weight: 400;
    opacity: 0.7;
  }

  .ds-validity-label {
    font-weight: 400;
    opacity: 0.8;
    margin-left: 0.25rem;
  }

  /* Hover effect */
  .ds-validity-badge:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .validity-color-high:hover {
    background: var(--validity-high);
    color: #fff;
  }

  .validity-color-medium:hover {
    background: var(--validity-medium);
    color: #fff;
  }

  .validity-color-low:hover {
    background: var(--validity-low);
    color: #fff;
  }

  .validity-color-critical:hover {
    background: var(--validity-critical);
    color: #fff;
  }
</style>
