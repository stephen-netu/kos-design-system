<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'status' | 'count' | 'dot' | 'outline';
    color?: 'accent' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    children?: Snippet;
  }

  let {
    variant = 'status',
    color = 'accent',
    size = 'md',
    class: className = '',
    children
  }: Props = $props();
</script>

<div 
  class="ds-badge variant-{variant} color-{color} size-{size} {className}"
  role="status"
>
  {#if variant === 'dot'}
    <!-- Empty dot badge -->
  {:else if children}
    <span class="ds-badge-content">
      {@render children()}
    </span>
  {/if}
</div>

<style>
  .ds-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-sans);
    font-weight: 600;
    white-space: nowrap;
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
  }

  /* --- Variants --- */
  
  /* Status (Subtle background, colored text) */
  .variant-status {
    border: 1px solid transparent;
  }
  
  .variant-status.color-accent {
    background: var(--color-accent-subtle);
    color: var(--color-accent-hover);
    border-color: rgba(184, 115, 51, 0.2);
  }

  .variant-status.color-success {
    background: color-mix(in srgb, var(--color-success) 15%, transparent);
    color: color-mix(in srgb, var(--color-success) 70%, var(--color-text-primary));
    border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
  }

  .variant-status.color-warning {
    background: color-mix(in srgb, var(--color-warning) 15%, transparent);
    color: color-mix(in srgb, var(--color-warning) 70%, var(--color-text-primary));
    border-color: color-mix(in srgb, var(--color-warning) 30%, transparent);
  }

  .variant-status.color-error {
    background: color-mix(in srgb, var(--color-error) 15%, transparent);
    color: color-mix(in srgb, var(--color-error) 70%, var(--color-text-primary));
    border-color: color-mix(in srgb, var(--color-error) 30%, transparent);
  }

  .variant-status.color-info {
    background: color-mix(in srgb, var(--color-info) 15%, transparent);
    color: color-mix(in srgb, var(--color-info) 70%, var(--color-text-primary));
    border-color: color-mix(in srgb, var(--color-info) 30%, transparent);
  }

  .variant-status.color-neutral {
    background: var(--color-bg-panel-elevated);
    color: var(--color-text-secondary);
    border-color: var(--border-default);
  }

  /* Count (Solid background, white/dark text) */
  .variant-count {
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }

  .variant-count.color-accent { background: var(--color-accent); color: #111; }
  .variant-count.color-success { background: var(--color-success); color: #fff; }
  .variant-count.color-warning { background: var(--color-warning); color: #111; }
  .variant-count.color-error { background: var(--color-error); color: #fff; }
  .variant-count.color-info { background: var(--color-info); color: #fff; }
  .variant-count.color-neutral { background: var(--color-text-tertiary); color: #fff; }

  /* Outline */
  .variant-outline {
    background: transparent;
    border: 1px solid currentColor;
  }

  .variant-outline.color-accent { color: var(--color-accent-hover); }
  .variant-outline.color-success { color: var(--color-success); }
  .variant-outline.color-warning { color: var(--color-warning); }
  .variant-outline.color-error { color: var(--color-error); }
  .variant-outline.color-info { color: var(--color-info); }
  .variant-outline.color-neutral { color: var(--color-text-secondary); }

  /* Dot (Small pulsing indicator) */
  .variant-dot {
    width: 0.5rem;
    height: 0.5rem;
    padding: 0;
    border-radius: var(--radius-full);
    box-shadow: 0 0 0 2px var(--color-bg-app);
  }

  .variant-dot.color-accent { background: var(--color-accent); }
  .variant-dot.color-success { background: var(--color-success); }
  .variant-dot.color-warning { background: var(--color-warning); }
  .variant-dot.color-error { background: var(--color-error); }
  .variant-dot.color-info { background: var(--color-info); }
  .variant-dot.color-neutral { background: var(--color-text-tertiary); }

  /* --- Sizes --- */
  
  .size-sm:not(.variant-dot) {
    padding: 0.1rem 0.35rem;
    font-size: 0.65rem;
    line-height: 1;
  }

  .size-md:not(.variant-dot) {
    padding: 0.15rem 0.5rem;
    font-size: var(--text-xs);
    line-height: 1.2;
  }

  .size-lg:not(.variant-dot) {
    padding: 0.25rem 0.75rem;
    font-size: var(--text-sm);
    line-height: 1.4;
  }
</style>
