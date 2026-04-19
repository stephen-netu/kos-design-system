<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'elevated' | 'flat' | 'interactive' | 'glass';
    selected?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    onkeydown?: (e: KeyboardEvent) => void;
    children?: Snippet;
    header?: Snippet;
    footer?: Snippet;
  }

  let {
    variant = 'elevated',
    selected = false,
    class: className = '',
    onclick,
    onkeydown,
    children,
    header,
    footer
  }: Props = $props();

  let isInteractive = $derived(variant === 'interactive' || !!onclick);

  function handleKeydown(e: KeyboardEvent) {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onclick?.(new MouseEvent('click'));
    }
    onkeydown?.(e);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div 
  class="ds-card variant-{variant} {className}"
  class:is-interactive={isInteractive}
  class:is-selected={selected}
  role={isInteractive ? "button" : "region"}
  tabindex={isInteractive ? 0 : undefined}
  onclick={isInteractive ? onclick : undefined}
  onkeydown={isInteractive ? handleKeydown : undefined}
  aria-pressed={isInteractive ? selected : undefined}
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

  <!-- Interactive Glow Effect -->
  {#if isInteractive || selected}
    <div class="ds-card-ring"></div>
  {/if}
</div>

<style>
  .ds-card {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-lg);
    background: var(--color-card-bg);
    color: var(--color-card-text-primary);
    overflow: hidden;
    transition: all var(--transition-normal);
    font-family: var(--font-sans);
  }

  /* Structural Elements */
  .ds-card-header {
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--border-subtle);
    font-weight: 600;
  }

  .ds-card-content {
    padding: var(--space-5);
    flex: 1;
  }

  .ds-card-footer {
    padding: var(--space-4) var(--space-5);
    border-top: 1px solid var(--border-subtle);
    background: rgba(0,0,0,0.02);
  }

  /* --- Variants --- */
  
  /* Elevated (Default) */
  .variant-elevated {
    box-shadow: var(--shadow-card);
    border: 1px solid var(--border-default);
  }

  /* Flat */
  .variant-flat {
    background: var(--color-bg-panel);
    color: var(--color-text-primary);
    border: 1px solid var(--border-subtle);
    box-shadow: none;
  }

  /* Glassmorphic */
  .variant-glass {
    background: rgba(42, 42, 42, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-lg);
  }

  /* Interactive (Hoverable) */
  .is-interactive {
    cursor: pointer;
    background: var(--color-card-bg-warm);
    border: 1px solid var(--border-default);
    box-shadow: var(--shadow-card);
  }

  .is-interactive:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-card-hover);
    border-color: var(--border-hover);
  }

  .is-interactive:active {
    transform: translateY(0);
    box-shadow: var(--shadow-card);
  }

  .is-interactive:focus-visible {
    outline: none;
  }

  /* Selection Ring */
  .ds-card-ring {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    border: 2px solid transparent;
    transition: all var(--transition-fast);
  }

  .is-interactive:focus-visible .ds-card-ring,
  .is-selected .ds-card-ring {
    border-color: var(--color-accent);
  }

  .is-selected {
    box-shadow: var(--shadow-glow), var(--shadow-card-hover);
    transform: translateY(-1px);
    background: var(--color-bg-panel-elevated);
    color: var(--color-text-primary);
  }

  @media (prefers-reduced-motion: reduce) {
    .ds-card { transition: none; }
    .is-interactive:hover { transform: none; }
    .is-interactive:active { transform: none; }
    .is-selected { transform: none; }
    .ds-card-ring { transition: none; }
  }
</style>
