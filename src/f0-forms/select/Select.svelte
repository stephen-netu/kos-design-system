<script lang="ts">
  interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    options: SelectOption[];
    selected?: string;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    error?: boolean;
    class?: string;
    id?: string;
    name?: string;
    onchange?: (value: string) => void;
  }

  let {
    options,
    selected = $bindable(''),
    placeholder = 'Select...',
    label,
    disabled = false,
    error = false,
    class: className = '',
    id,
    name,
    onchange
  }: Props = $props();

  let isFocused = $state(false);

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    selected = target.value;
    onchange?.(selected);
  }
</script>

<div
  class="ds-select-wrapper {className}"
  class:is-focused={isFocused}
  class:is-disabled={disabled}
  class:has-error={error}
  class:has-placeholder={!selected}
>
  <select
    {id}
    {name}
    {disabled}
    value={selected}
    onchange={handleChange}
    onfocus={() => isFocused = true}
    onblur={() => isFocused = false}
    class="ds-select-element"
    aria-label={label}
    aria-invalid={error}
  >
    {#if placeholder}
      <option value="" disabled hidden>{placeholder}</option>
    {/if}
    {#each options as option}
      <option
        value={option.value}
        disabled={option.disabled}
        selected={option.value === selected}
      >
        {option.label}
      </option>
    {/each}
  </select>

  <div class="ds-select-chevron" role="presentation">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="4 6 8 10 12 6" />
    </svg>
  </div>

  <div class="ds-select-glow"></div>
</div>

<style>
  .ds-select-wrapper {
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

  .ds-select-wrapper:hover:not(.is-disabled) {
    border-color: var(--border-hover);
    background: var(--color-bg-panel-elevated);
  }

  .ds-select-wrapper.is-focused {
    border-color: var(--color-accent);
    background: var(--color-bg-app);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
  }

  .ds-select-wrapper.has-error {
    border-color: var(--color-error);
  }

  .ds-select-wrapper.is-disabled {
    opacity: 0.5;
    background: rgba(0,0,0,0.2);
    cursor: not-allowed;
  }

  .ds-select-element {
    flex: 1;
    width: 100%;
    height: 2.25rem;
    padding: 0 var(--space-8) 0 var(--space-3);
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .ds-select-wrapper.has-placeholder .ds-select-element {
    color: var(--color-text-muted);
  }

  .ds-select-element:disabled {
    cursor: not-allowed;
  }

  /* Style the option elements for dark backgrounds */
  .ds-select-element option {
    background: var(--color-bg-panel, #222);
    color: var(--color-text-primary, #e8e0d0);
  }

  .ds-select-element option:disabled {
    color: var(--color-text-muted, #a09880);
  }

  .ds-select-chevron {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--space-8);
    height: 100%;
    color: var(--color-text-muted);
    pointer-events: none;
    transition: color var(--transition-fast);
  }

  .ds-select-chevron svg {
    width: 14px;
    height: 14px;
  }

  .ds-select-wrapper.is-focused .ds-select-chevron {
    color: var(--color-accent);
  }

  .ds-select-glow {
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

  .ds-select-wrapper.is-focused .ds-select-glow {
    transform: scaleX(1);
  }

  .ds-select-wrapper.has-error .ds-select-glow {
    background: var(--color-error);
    box-shadow: 0 -1px 4px rgba(166, 94, 94, 0.4);
  }
</style>
