<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface Props {
    variant?: 'elevated' | 'flat' | 'interactive' | 'glass' | 'metal' | 'hazard';
    selected?: boolean;
    class?: string;
    style?: string;
    onclick?: (e: MouseEvent) => void;
    onmouseenter?: (e: MouseEvent) => void;
    onmouseleave?: (e: MouseEvent) => void;
    onkeydown?: (e: KeyboardEvent) => void;
    children?: Snippet;
    header?: Snippet;
    footer?: Snippet;
  }

  let {
    variant = 'elevated',
    selected = false,
    class: className = '',
    style = '',
    onclick,
    onmouseenter,
    onmouseleave,
    onkeydown,
    children,
    header,
    footer
  }: Props = $props();

  let isInteractive = $derived(variant === 'interactive' || !!onclick);
  let cardAttrs = $derived(isInteractive ? {
    role: 'button',
    tabindex: 0,
    onclick,
    onkeydown: handleKeydown,
    'aria-pressed': selected
  } : {});

  function handleKeydown(e: KeyboardEvent) {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      onkeydown?.(e);
      if (e.defaultPrevented) return;
      e.preventDefault();
      onclick?.(new MouseEvent('click'));
      return;
    }
    onkeydown?.(e);
  }
</script>

<div
  class="ds-card variant-{variant} {className}"
  style={style || undefined}
  class:is-interactive={isInteractive}
  class:is-selected={selected}
  {...cardAttrs}
  onmouseenter={onmouseenter}
  onmouseleave={onmouseleave}
>
  {#if header}
    <header class="ds-card-header">
      {@render header()}
    </header>
  {/if}

  {#if children}
    <div class="ds-card-content">
      {@render children()}
    </div>
  {/if}

  {#if footer}
    <footer class="ds-card-footer">
      {@render footer()}
    </footer>
  {/if}

  {#if isInteractive || selected}
    <div class="ds-card-ring"></div>
  {/if}
</div>

<style>
  .ds-card {
    position: relative;
    display: flex;
    flex-direction: column;
    border: var(--border-width-thin) solid var(--border-default);
    background: var(--color-card-bg);
    color: var(--color-card-text-primary);
    overflow: hidden;
    transition: border-color var(--transition-fast), background-color var(--transition-fast);
    font-family: var(--font-sans);
  }

  .ds-card-header {
    padding: var(--space-3) var(--space-4);
    border-bottom: var(--border-width-thin) solid var(--border-default);
    font-weight: 600;
    background: var(--color-bg-panel);
    font-size: var(--text-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ds-card-content {
    padding: var(--space-4);
    flex: 1;
  }

  .ds-card-footer {
    padding: var(--space-3) var(--space-4);
    border-top: var(--border-width-thin) solid var(--border-default);
    background: var(--color-accent-faint);
  }

  /* --- Variants --- */

  .variant-elevated {
    background: var(--color-card-bg);
    border-color: var(--border-default);
  }

  .variant-flat {
    background: var(--color-bg-panel);
    color: var(--color-text-primary);
    border-color: var(--border-subtle);
  }

  .variant-glass {
    background: rgba(24, 28, 32, 0.6);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    border: var(--border-width-thin) solid rgba(255, 255, 255, 0.08);
    color: var(--color-text-primary);
  }

  .variant-metal {
    background: linear-gradient(180deg, var(--color-bg-panel-elevated) 0%, var(--color-bg-canvas) 100%);
    border-color: var(--color-card-border);
    background-image: repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent var(--border-width-thin),
      rgba(255, 255, 255, 0.02) var(--border-width-thin),
      rgba(255, 255, 255, 0.02) var(--border-width-default)
    );
  }

  .variant-hazard {
    background: var(--color-accent-faint);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  /* --- Interactive --- */

  .is-interactive {
    cursor: pointer;
    border-color: var(--border-hover);
  }

  .is-interactive:hover {
    border-color: var(--color-accent);
    background: var(--color-card-bg-warm);
  }

  .is-interactive:active {
    background: var(--color-bg-inset);
  }

  /* --- Selection Ring --- */

  .ds-card-ring {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: var(--border-width-thin) solid transparent;
    transition: border-color var(--transition-fast);
  }

  .is-interactive:focus-visible .ds-card-ring,
  .is-selected .ds-card-ring {
    border-color: var(--color-accent);
    background: repeating-linear-gradient(
      45deg,
      transparent 0,
      transparent var(--border-width-default),
      var(--color-accent-muted) var(--border-width-default),
      var(--color-accent-muted) var(--blur-md)
    );
  }

  .is-selected {
    border-color: var(--color-accent);
    background: var(--color-bg-panel-elevated);
    color: var(--color-text-primary);
  }

  .is-selected.variant-hazard {
    border-color: var(--color-accent);
    background: var(--color-accent-subtle);
  }

  @media (prefers-reduced-motion: reduce) {
    .ds-card { transition: none; }
    .ds-card-ring { transition: none; }
  }
</style>
