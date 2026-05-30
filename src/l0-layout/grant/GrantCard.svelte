<script lang="ts">
  import type { Snippet } from 'svelte';
  import GrantStatusBadge from '../../u0-primitives/grant-badge/GrantStatusBadge.svelte';

  interface Props {
    title: string;
    funder: string;
    category: string;
    status: string;
    amountMax?: number | null;
    deadline?: number | null;
    description?: string;
    selected?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    footer?: Snippet;
  }

  let {
    title,
    funder,
    category,
    status,
    amountMax,
    deadline,
    description,
    selected = false,
    class: className = '',
    onclick,
    footer,
  }: Props = $props();

  function formatAmount(amount: number | null | undefined): string {
    if (amount == null) return '';
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount}`;
  }

  function formatDeadline(ts: number | null | undefined): string {
    if (ts == null) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  let isInteractive = $derived(!!onclick);
  let cardClasses = $derived(
    `ds-grant-card ${className}${isInteractive ? ' is-interactive' : ''}${selected ? ' is-selected' : ''}`
  );
</script>

<div
  class={cardClasses}
  role={isInteractive ? 'button' : 'region'}
  tabindex={isInteractive ? 0 : undefined}
  onclick={onclick}
  onkeydown={isInteractive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onclick?.(new MouseEvent('click')); } } : undefined}
  aria-pressed={isInteractive ? selected : undefined}
>
  <div class="ds-grant-card-header">
    <h3 class="ds-grant-card-title" title={title}>{title}</h3>
    <GrantStatusBadge {status} size="sm" />
  </div>

  <div class="ds-grant-card-meta">
    <span class="ds-grant-card-funder">{funder}</span>
    <span class="ds-grant-card-category">{category}</span>
  </div>

  {#if description}
    <p class="ds-grant-card-description">{description}</p>
  {/if}

  <div class="ds-grant-card-footer">
    {#if amountMax}
      <span class="ds-grant-card-amount">{formatAmount(amountMax)}</span>
    {/if}
    {#if deadline}
      <span class="ds-grant-card-deadline">Due {formatDeadline(deadline)}</span>
    {/if}
    {#if footer}
      {@render footer()}
    {/if}
  </div>
</div>

<style>
  .ds-grant-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    padding-top: calc(var(--space-4) - 3px);
    border: 1px solid var(--border-default);
    border-left: 3px solid transparent;
    background: var(--color-bg-panel);
    color: var(--color-text-primary);
    transition: all var(--transition-fast);
    font-family: var(--font-sans);
  }

  .ds-grant-card:hover:not(.is-selected) {
    border-left-color: var(--color-accent);
    border-top-color: var(--color-accent-muted);
    border-right-color: var(--color-accent-muted);
    border-bottom-color: var(--color-accent-muted);
    background: var(--color-bg-panel-elevated);
  }

  .ds-grant-card.is-selected {
    border-color: var(--color-accent);
    border-left-width: 3px;
    background: var(--color-bg-panel-elevated);
    box-shadow: inset 0 0 0 1px var(--color-accent-subtle);
  }

  .ds-grant-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .ds-grant-card-title {
    font-size: var(--text-sm);
    font-weight: 600;
    margin: 0;
    line-height: 1.3;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ds-grant-card-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .ds-grant-card-funder {
    font-weight: 500;
  }

  .ds-grant-card-category {
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .ds-grant-card-description {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }

  .ds-grant-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--text-xs);
  }

  .ds-grant-card-amount {
    font-weight: 700;
    color: var(--color-accent);
  }

  .ds-grant-card-deadline {
    color: var(--color-text-muted);
  }
</style>
