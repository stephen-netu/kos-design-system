<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    onchange?: (checked: boolean) => void;
    label?: Snippet;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    size = 'md',
    class: className = '',
    onchange,
    label
  }: Props = $props();

  function toggle() {
    if (!disabled) {
      checked = !checked;
      onchange?.(checked);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<label class="ds-toggle-wrapper size-{size} {className}" class:is-disabled={disabled}>
  <div 
    class="ds-toggle-track"
    class:is-checked={checked}
    role="switch"
    aria-checked={checked}
    tabindex={disabled ? -1 : 0}
    onkeydown={handleKeydown}
    onclick={(e) => { e.preventDefault(); toggle(); }}
  >
    <div class="ds-toggle-thumb"></div>
  </div>

  {#if label}
    <span class="ds-toggle-label">
      {@render label()}
    </span>
  {/if}
</label>

<style>
  .ds-toggle-wrapper {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    cursor: pointer;
    user-select: none;
  }

  .ds-toggle-wrapper.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .ds-toggle-track {
    position: relative;
    background: var(--color-bg-panel-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    transition: all var(--transition-normal);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
  }

  /* Track Focus */
  .ds-toggle-track:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .ds-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    background: var(--color-text-secondary);
    border-radius: var(--radius-full);
    transition: all var(--transition-bounce);
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  /* Checked State */
  .ds-toggle-track.is-checked {
    background: var(--color-accent);
    border-color: var(--color-accent-hover);
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.3), 0 0 8px var(--color-accent-subtle);
  }

  .ds-toggle-track.is-checked .ds-toggle-thumb {
    background: #fff;
  }

  /* Label */
  .ds-toggle-label {
    font-family: var(--font-sans);
    color: var(--color-text-primary);
  }

  /* --- Sizes --- */
  
  .size-sm .ds-toggle-track {
    width: 2rem;
    height: 1.125rem;
  }
  .size-sm .ds-toggle-thumb {
    width: 0.875rem;
    height: 0.875rem;
  }
  .size-sm .ds-toggle-track.is-checked .ds-toggle-thumb {
    transform: translateX(0.875rem);
  }
  .size-sm .ds-toggle-label {
    font-size: var(--text-xs);
  }

  .size-md .ds-toggle-track {
    width: 2.75rem;
    height: 1.5rem;
  }
  .size-md .ds-toggle-thumb {
    width: 1.25rem;
    height: 1.25rem;
  }
  .size-md .ds-toggle-track.is-checked .ds-toggle-thumb {
    transform: translateX(1.25rem);
  }
  .size-md .ds-toggle-label {
    font-size: var(--text-sm);
  }

  .size-lg .ds-toggle-track {
    width: 3.5rem;
    height: 2rem;
  }
  .size-lg .ds-toggle-thumb {
    width: 1.75rem;
    height: 1.75rem;
  }
  .size-lg .ds-toggle-track.is-checked .ds-toggle-thumb {
    transform: translateX(1.5rem);
  }
  .size-lg .ds-toggle-label {
    font-size: var(--text-base);
  }
</style>
