<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    id: string; // Required for a11y linking
    label: string | Snippet;
    error?: string;
    helper?: string;
    class?: string;
    children: Snippet; // The input component goes here
  }

  let {
    id,
    label,
    error,
    helper,
    class: className = '',
    children
  }: Props = $props();
</script>

<div class="ds-form-field {className}">
  <div class="ds-form-label-row">
    <label for={id} class="ds-form-label">
      {#if typeof label === 'string'}
        {label}
      {:else}
        {@render label()}
      {/if}
      
      {#if error}
        <span class="ds-form-error-text" role="alert">{error}</span>
      {/if}
    </label>
  </div>

  <div class="ds-form-input-container">
    {@render children()}
  </div>

  {#if helper && !error}
    <div class="ds-form-helper-text" id="{id}-helper">
      {helper}
    </div>
  {/if}
</div>

<style>
  .ds-form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
    font-family: var(--font-sans);
  }

  .ds-form-label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  .ds-form-label {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .ds-form-error-text {
    font-size: var(--text-xs);
    font-weight: 400;
    color: var(--color-error);
    animation: ds-slide-in-up var(--transition-fast) ease-out;
  }

  .ds-form-input-container {
    position: relative;
    width: 100%;
  }

  .ds-form-helper-text {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    line-height: 1.4;
  }
</style>
