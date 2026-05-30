<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    class?: string;
    'aria-label'?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    iconLeading?: Snippet;
    iconTrailing?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    loading = false,
    class: className = '',
    'aria-label': ariaLabel,
    onclick,
    children,
    iconLeading,
    iconTrailing
  }: Props = $props();

  let isPressed = $state(false);

  function handlePointerDown() {
    if (!disabled && !loading) isPressed = true;
  }
  function handlePointerUp() { isPressed = false; }
  function handlePointerLeave() { isPressed = false; }
</script>

<button
  {type}
  class="ds-button variant-{variant} size-{size} {className}"
  class:is-loading={loading}
  class:is-pressed={isPressed}
  disabled={disabled || loading}
  aria-label={ariaLabel}
  onclick={onclick}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerLeave}
>
  {#if loading}
    <span class="ds-button-spinner"></span>
  {/if}

  <span class="ds-button-content" class:opacity-0={loading}>
    {#if iconLeading}
      <span class="ds-button-icon leading">
        {@render iconLeading()}
      </span>
    {/if}

    {#if children}
      <span class="ds-button-text">
        {@render children()}
      </span>
    {/if}

    {#if iconTrailing}
      <span class="ds-button-icon trailing">
        {@render iconTrailing()}
      </span>
    {/if}
  </span>
</button>

<style>
  .ds-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-sans);
    font-weight: 500;
    border: 1px solid var(--border-default);
    cursor: pointer;
    overflow: hidden;
    user-select: none;
    text-decoration: none;
    transition: border-color var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast);
    background: transparent;
    color: var(--color-text-primary);
    padding: 0 var(--space-3);
    line-height: 1;
  }

  .ds-button:focus-visible {
    outline: 1px solid var(--color-accent);
    outline-offset: 1px;
  }

  .ds-button:disabled {
    cursor: not-allowed;
    opacity: 0.4;
    border-color: var(--border-subtle);
  }

  .ds-button-content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    position: relative;
    z-index: 1;
    transition: opacity var(--transition-fast);
    padding: 0 var(--space-1);
    height: 100%;
  }

  .opacity-0 { opacity: 0 !important; }

  .ds-button-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .ds-button-icon :global(svg) {
    width: 1.25em;
    height: 1.25em;
  }

  .ds-button-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* --- Variants --- */

  .variant-primary {
    background: var(--color-accent);
    color: var(--color-bg-app);
    border-color: var(--color-accent);
  }

  .variant-primary:hover:not(:disabled) {
    background: var(--color-accent-hover);
    border-color: var(--color-accent-hover);
  }

  .variant-primary.is-pressed:not(:disabled) {
    background: var(--color-accent-active);
    border-color: var(--color-accent-active);
  }

  .variant-secondary {
    background: transparent;
    color: var(--color-text-primary);
    border-color: var(--border-default);
  }

  .variant-secondary:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  .variant-secondary.is-pressed:not(:disabled) {
    background: var(--color-bg-panel-elevated);
    border-color: var(--color-accent-active);
  }

  .variant-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    border-color: transparent;
  }

  .variant-ghost:hover:not(:disabled) {
    background: var(--color-bg-panel);
    color: var(--color-text-primary);
  }

  .variant-ghost.is-pressed:not(:disabled) {
    background: var(--color-bg-panel-elevated);
  }

  .variant-danger {
    background: transparent;
    color: var(--color-error);
    border-color: var(--color-error);
  }

  .variant-danger:hover:not(:disabled) {
    background: rgba(193, 74, 74, 0.1);
  }

  .variant-danger.is-pressed:not(:disabled) {
    background: rgba(193, 74, 74, 0.2);
  }

  /* --- Sizes --- */

  .size-sm { height: 2rem; font-size: var(--text-xs); }
  .size-md { height: 2.5rem; font-size: var(--text-sm); }
  .size-lg { height: 3rem; font-size: var(--text-base); }

  /* --- Loading Spinner --- */

  .ds-button-spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 1.2em;
    height: 1.2em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: var(--radius-full);
    animation: ds-button-spin 0.75s linear infinite;
    z-index: 2;
  }

  .variant-primary .ds-button-spinner {
    border-color: rgba(0, 0, 0, 0.2);
    border-right-color: var(--color-bg-app);
  }

  @keyframes ds-button-spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .ds-button { transition: none; }
    .is-pressed:not(:disabled) { }
    @keyframes ds-button-spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
  }
</style>
