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
    'aria-expanded'?: boolean;
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
    'aria-expanded': ariaExpanded,
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
  aria-expanded={ariaExpanded}
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
    padding: 0 var(--ui-pad-x);
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

  /* Primary = inverted neutral (high-contrast), NOT an accent fill.
     Locked rule: accent = live edge, never a fill. Accent shows on
     :focus-visible. Reads as primary under any theme and any user accent. */
  .variant-primary {
    background: var(--color-text-primary);
    color: var(--color-bg-app);
    border-color: var(--color-text-primary);
  }

  .variant-primary:hover:not(:disabled) {
    background: var(--color-text-secondary);
    border-color: var(--color-text-secondary);
  }

  .variant-primary.is-pressed:not(:disabled) {
    background: var(--color-text-secondary);
    border-color: var(--color-text-secondary);
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
    background: color-mix(in srgb, var(--color-error) 12%, transparent);
  }

  .variant-danger.is-pressed:not(:disabled) {
    background: color-mix(in srgb, var(--color-error) 22%, transparent);
  }

  /* --- Sizes --- */

  .size-sm { height: calc(var(--ui-control-h) - 4px); font-size: var(--ui-font-sm); }
  .size-md { height: var(--ui-control-h); font-size: var(--ui-font); }
  .size-lg { height: calc(var(--ui-control-h) + 6px); font-size: var(--ui-font); }

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
    @keyframes ds-button-spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
  }
</style>
