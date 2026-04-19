<script lang="ts">
  import type { TrustState } from './grove-types';

  interface Props {
    name: string;
    trustState: TrustState;
    isCoordinator?: boolean;
    size?: 'sm' | 'md';
    class?: string;
  }

  let {
    name,
    trustState,
    isCoordinator = false,
    size = 'md',
    class: className = ''
  }: Props = $props();

  let dotColor = $derived(
    trustState === 'provisional' ? 'warning'
    : trustState === 'trusted' ? 'success'
    : trustState === 'vouched' ? 'accent'
    : 'error'
  );
</script>

<div
  class="ds-member-badge size-{size} {className}"
  title="{name} ({trustState}){isCoordinator ? ' — coordinator' : ''}"
  role="status"
>
  <span class="ds-member-dot dot-{dotColor}"></span>
  {#if isCoordinator}
    <span class="ds-member-coordinator" aria-label="Coordinator">&#9733;</span>
  {/if}
  <span class="ds-member-name">{name}</span>
</div>

<style>
  .ds-member-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  /* Sizes */
  .size-sm {
    font-size: var(--text-xs);
    gap: var(--space-1);
  }

  .size-md {
    font-size: var(--text-sm);
  }

  /* Trust state dot */
  .ds-member-dot {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  .size-sm .ds-member-dot {
    width: 0.375rem;
    height: 0.375rem;
  }

  .dot-warning { background: var(--color-warning); }
  .dot-success { background: var(--color-success); }
  .dot-accent  { background: var(--color-accent); }
  .dot-error   { background: var(--color-error); }

  /* Coordinator indicator */
  .ds-member-coordinator {
    font-size: 0.6rem;
    color: var(--color-accent);
    line-height: 1;
    flex-shrink: 0;
  }

  .size-sm .ds-member-coordinator {
    font-size: 0.5rem;
  }

  /* Name */
  .ds-member-name {
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
