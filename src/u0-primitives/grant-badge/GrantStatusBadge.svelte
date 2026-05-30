<script lang="ts">
  interface Props {
    status: string;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  let { status, size = 'sm', class: className = '' }: Props = $props();

  let dotColor = $derived(
    status === 'open' ? 'var(--color-success)'
    : status === 'closed' ? 'var(--color-error)'
    : status === 'forecast' ? 'var(--color-warning)'
    : status === 'awarded' ? 'var(--color-accent)'
    : status === 'drafting' ? 'var(--color-accent)'
    : status === 'submitted' ? 'var(--color-accent)'
    : status === 'internal_review' ? 'var(--color-warning)'
    : status === 'revision' ? 'var(--color-warning)'
    : status === 'final_review' ? 'var(--color-accent)'
    : status === 'declined' ? 'var(--color-error)'
    : 'var(--color-text-tertiary)'
  );

  let label = $derived(
    status === 'internal_review' ? 'Review'
    : status === 'final_review' ? 'Final'
    : status.charAt(0).toUpperCase() + status.slice(1)
  );

  let variantClass = $derived(
    size === 'sm' ? 'size-sm'
    : size === 'lg' ? 'size-lg'
    : 'size-md'
  );
</script>

<span class="ds-grant-status {variantClass} {className}" aria-label={status} role="status">
  <span class="ds-grant-status-dot" style="background: {dotColor}"></span>
  <span class="ds-grant-status-label">{label}</span>
</span>

<style>
  .ds-grant-status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-sans);
    font-weight: 600;
    white-space: nowrap;
    border-radius: var(--radius-full);
  }

  .ds-grant-status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .ds-grant-status-label {
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .size-sm {
    padding: 1px 6px;
    font-size: var(--text-xs);
  }

  .size-md {
    padding: 2px 8px;
    font-size: var(--text-sm);
  }

  .size-lg {
    padding: 3px 10px;
    font-size: var(--text-base);
  }
</style>
