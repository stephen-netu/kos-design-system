<script lang="ts">
  interface Props {
    checked?: boolean;
    label?: string;
    disabled?: boolean;
    indeterminate?: boolean;
    class?: string;
    id?: string;
    name?: string;
    onchange?: (e: Event) => void;
  }

  let {
    checked = $bindable(false),
    label = '',
    disabled = false,
    indeterminate = false,
    class: className = '',
    id,
    name,
    onchange
  }: Props = $props();

  let inputRef = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (inputRef) {
      inputRef.indeterminate = indeterminate;
    }
  });


</script>

<label
  class="ds-checkbox {className}"
  class:is-disabled={disabled}
  class:is-checked={checked}
  class:is-indeterminate={indeterminate}
>
  <input
    bind:this={inputRef}
    bind:checked
    type="checkbox"
    {id}
    {name}
    {disabled}
    {onchange}
    class="ds-checkbox-native"
  />

  <div
    class="ds-checkbox-box"
    role="presentation"
  >
    {#if checked && !indeterminate}
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ds-checkbox-icon">
        <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
      </svg>
    {:else if indeterminate}
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="ds-checkbox-icon">
        <line x1="4" y1="8" x2="12" y2="8" />
      </svg>
    {/if}
  </div>

  {#if label}
    <span class="ds-checkbox-label">{label}</span>
  {/if}
</label>

<style>
  .ds-checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    user-select: none;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  .ds-checkbox.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ds-checkbox-native {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .ds-checkbox-box {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--border-default);
    border-radius: var(--radius-sm);
    background: var(--color-bg-panel);
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .ds-checkbox:hover:not(.is-disabled) .ds-checkbox-box {
    border-color: var(--border-hover);
    background: var(--color-bg-panel-elevated);
  }

  .ds-checkbox.is-checked .ds-checkbox-box,
  .ds-checkbox.is-indeterminate .ds-checkbox-box {
    background: var(--color-accent, #b87333);
    border-color: var(--color-accent, #b87333);
  }

  .ds-checkbox.is-checked:hover:not(.is-disabled) .ds-checkbox-box,
  .ds-checkbox.is-indeterminate:hover:not(.is-disabled) .ds-checkbox-box {
    background: var(--color-accent-hover, #c4813d);
    border-color: var(--color-accent-hover, #c4813d);
  }

  .ds-checkbox-native:focus-visible + .ds-checkbox-box {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .ds-checkbox-icon {
    width: 12px;
    height: 12px;
    color: var(--color-bg-app, #1a1a1a);
    animation: ds-check-in 150ms ease-out;
  }

  .ds-checkbox-label {
    line-height: 1.4;
  }

  @keyframes ds-check-in {
    from {
      transform: scale(0.5);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
