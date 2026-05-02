<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
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
    if (!disabled && !loading) {
      isPressed = true;
    }
  }

  function handlePointerUp() {
    isPressed = false;
  }

  function handlePointerLeave() {
    isPressed = false;
  }
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
  data-variant={variant}
  data-size={size}
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
  
  <span class="ds-button-shimmer"></span>
</button>

<style>
  .ds-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-sans);
    font-weight: 500;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    overflow: hidden;
    user-select: none;
    text-decoration: none;
    transition: all var(--transition-fast);
    transform: translateZ(0); /* Force GPU acceleration for smooth shimmer */
  }

  /* Focus */
  .ds-button:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* Disabled State */
  .ds-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .ds-button:disabled::after {
    display: none;
  }

  /* Content Wrapper */
  .ds-button-content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    position: relative;
    z-index: 1;
    transition: opacity var(--transition-fast);
  }

  .opacity-0 {
    opacity: 0 !important;
  }

  /* Icons */
  .ds-button-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .ds-button-icon :global(svg) {
    width: 1.25em;
    height: 1.25em;
  }

  /* Text */
  .ds-button-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Shimmer Effect (Subtle highlight that crosses the button) */
  .ds-button-shimmer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      90deg, 
      transparent, 
      rgba(255, 255, 255, 0.1), 
      transparent
    );
    transform: translateX(-100%);
    z-index: 0;
  }

  .ds-button:hover:not(:disabled):not(.is-loading) .ds-button-shimmer {
    transform: translateX(100%);
    transition: transform var(--transition-slow) ease-in-out;
  }

  /* --- Variants --- */
  
  /* Primary - Solid Brass/Copper */
  .variant-primary {
    background: var(--color-accent);
    color: #111;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.2);
  }

  .variant-primary:hover:not(:disabled) {
    background: var(--color-accent-hover);
    box-shadow: var(--shadow-glow), inset 0 1px 1px rgba(255,255,255,0.3);
  }

  .variant-primary.is-pressed:not(:disabled) {
    background: var(--color-accent-active);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    transform: translateY(1px);
  }

  /* Secondary - Outline */
  .variant-secondary {
    background: transparent;
    color: var(--color-text-primary);
    border: 1px solid var(--border-default);
  }

  .variant-secondary:hover:not(:disabled) {
    background: var(--color-bg-panel-elevated);
    border-color: var(--color-accent-subtle);
    color: var(--color-accent-hover);
  }

  .variant-secondary.is-pressed:not(:disabled) {
    background: rgba(0,0,0,0.2);
    border-color: var(--color-accent-active);
    transform: translateY(1px);
  }

  /* Ghost - Transparent until hover */
  .variant-ghost {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .variant-ghost:hover:not(:disabled) {
    background: var(--color-bg-panel);
    color: var(--color-text-primary);
  }

  .variant-ghost.is-pressed:not(:disabled) {
    background: rgba(0,0,0,0.2);
    transform: translateY(1px);
  }

  /* Danger */
  .variant-danger {
    background: rgba(166, 94, 94, 0.1);
    color: var(--color-error);
    border: 1px solid rgba(166, 94, 94, 0.3);
  }

  .variant-danger:hover:not(:disabled) {
    background: rgba(166, 94, 94, 0.2);
    border-color: var(--color-error);
    box-shadow: 0 0 12px rgba(166, 94, 94, 0.3);
  }

  .variant-danger.is-pressed:not(:disabled) {
    background: rgba(166, 94, 94, 0.3);
    transform: translateY(1px);
  }

  /* --- Sizes --- */
  
  .size-sm {
    height: 1.75rem;
    padding: 0 var(--space-3);
    font-size: var(--text-xs);
    border-radius: var(--radius-sm);
  }

  .size-md {
    height: 2.25rem;
    padding: 0 var(--space-4);
    font-size: var(--text-sm);
  }

  .size-lg {
    height: 2.75rem;
    padding: 0 var(--space-6);
    font-size: var(--text-base);
    border-radius: var(--radius-lg);
  }

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
    border-radius: 50%;
    animation: ds-button-spin 0.75s linear infinite;
    z-index: 2;
  }

  .variant-primary .ds-button-spinner {
    border-color: rgba(0,0,0,0.2);
    border-right-color: #111;
  }

  @keyframes ds-button-spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .ds-button-shimmer { display: none; }
    .ds-button { transition: none; }
    .is-pressed:not(:disabled) { transform: none; }
    @keyframes ds-button-spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
  }
</style>
