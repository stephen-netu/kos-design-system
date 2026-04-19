<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    value?: string;
    type?: 'text' | 'search' | 'password' | 'email' | 'url';
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    class?: string;
    id?: string;
    name?: string;
    iconLeading?: Snippet;
    iconTrailing?: Snippet;
  }

  let {
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    disabled = false,
    error = false,
    class: className = '',
    id,
    name,
    iconLeading,
    iconTrailing
  }: Props = $props();

  let isFocused = $state(false);
  let showPassword = $state(false);

  let currentType = $derived(type === 'password' && showPassword ? 'text' : type);

  function handleFocus() {
    isFocused = true;
  }

  function handleBlur() {
    isFocused = false;
  }

  function togglePassword() {
    showPassword = !showPassword;
  }
</script>

<div 
  class="ds-input-wrapper {className}"
  class:is-focused={isFocused}
  class:is-disabled={disabled}
  class:has-error={error}
  class:has-leading={!!iconLeading}
  class:has-trailing={!!iconTrailing || type === 'password'}
>
  {#if iconLeading}
    <div class="ds-input-icon leading">
      {@render iconLeading()}
    </div>
  {/if}

  <input
    {id}
    {name}
    type={currentType}
    bind:value
    {placeholder}
    {disabled}
    onfocus={handleFocus}
    onblur={handleBlur}
    class="ds-input-element"
  />

  {#if type === 'password'}
    <button 
      type="button" 
      class="ds-input-action trailing"
      onclick={togglePassword}
      aria-label={showPassword ? "Hide password" : "Show password"}
      tabindex="-1"
    >
      {#if showPassword}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      {/if}
    </button>
  {:else if iconTrailing}
    <div class="ds-input-icon trailing">
      {@render iconTrailing()}
    </div>
  {/if}
  
  <!-- Animated bottom border glow -->
  <div class="ds-input-glow"></div>
</div>

<style>
  .ds-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    background: var(--color-bg-panel);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    overflow: hidden;
  }

  .ds-input-wrapper:hover:not(.is-disabled) {
    border-color: var(--border-hover);
    background: var(--color-bg-panel-elevated);
  }

  .ds-input-wrapper.is-focused {
    border-color: var(--color-accent);
    background: var(--color-bg-app); /* Darker inside when focused */
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
  }

  .ds-input-wrapper.has-error {
    border-color: var(--color-error);
  }

  .ds-input-wrapper.is-disabled {
    opacity: 0.5;
    background: rgba(0,0,0,0.2);
    cursor: not-allowed;
  }

  .ds-input-element {
    flex: 1;
    width: 100%;
    height: 2.25rem;
    padding: 0 var(--space-3);
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
  }

  .ds-input-wrapper.has-leading .ds-input-element {
    padding-left: var(--space-8);
  }

  .ds-input-wrapper.has-trailing .ds-input-element {
    padding-right: var(--space-8);
  }

  .ds-input-element::placeholder {
    color: var(--color-text-muted);
  }

  .ds-input-element:disabled {
    cursor: not-allowed;
  }

  /* Icons */
  .ds-input-icon, .ds-input-action {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    width: var(--space-8);
    height: 100%;
    transition: color var(--transition-fast);
  }

  .ds-input-icon :global(svg), .ds-input-action svg {
    width: 1em;
    height: 1em;
  }

  .ds-input-wrapper.is-focused .ds-input-icon.leading {
    color: var(--color-accent);
  }

  .leading { left: 0; }
  .trailing { right: 0; }

  /* Actions (like password toggle) */
  .ds-input-action {
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-sm);
  }

  .ds-input-action:hover {
    color: var(--color-text-primary);
  }

  .ds-input-action:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  /* Animated Bottom Glow Line */
  .ds-input-glow {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: var(--color-accent);
    transform: scaleX(0);
    transform-origin: center;
    transition: transform var(--transition-normal);
    box-shadow: 0 -1px 4px var(--color-accent-glow);
  }

  .ds-input-wrapper.is-focused .ds-input-glow {
    transform: scaleX(1);
  }

  .ds-input-wrapper.has-error .ds-input-glow {
    background: var(--color-error);
    box-shadow: 0 -1px 4px rgba(166, 94, 94, 0.4);
  }

  @media (prefers-reduced-motion: reduce) {
    .ds-input-wrapper { transition: none; }
    .ds-input-glow { transition: none; }
  }
</style>
