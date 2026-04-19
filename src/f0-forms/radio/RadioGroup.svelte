<script lang="ts">
  interface RadioOption {
    value: string;
    label: string;
  }

  interface Props {
    options: RadioOption[];
    selected?: string;
    name: string;
    label?: string;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    class?: string;
    onchange?: (value: string) => void;
  }

  let {
    options,
    selected = $bindable(''),
    name,
    label,
    disabled = false,
    orientation = 'vertical',
    class: className = '',
    onchange
  }: Props = $props();

  function handleSelect(value: string) {
    if (disabled) return;
    selected = value;
    onchange?.(value);
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    const isVertical = orientation === 'vertical';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';

    let newIndex = index;
    if (e.key === nextKey) {
      e.preventDefault();
      newIndex = (index + 1) % options.length;
    } else if (e.key === prevKey) {
      e.preventDefault();
      newIndex = (index - 1 + options.length) % options.length;
    } else {
      return;
    }

    handleSelect(options[newIndex].value);
    // Focus the new radio button
    const group = (e.currentTarget as HTMLElement).closest('.ds-radio-group');
    const radios = group?.querySelectorAll<HTMLElement>('.ds-radio-input');
    radios?.[newIndex]?.focus();
  }
</script>

<div
  class="ds-radio-group {className}"
  class:is-horizontal={orientation === 'horizontal'}
  class:is-disabled={disabled}
  role="radiogroup"
  aria-label={label}
>
  {#each options as option, i}
    <label
      class="ds-radio-option"
      class:is-selected={selected === option.value}
    >
      <input
        type="radio"
        {name}
        value={option.value}
        checked={selected === option.value}
        {disabled}
        onchange={() => handleSelect(option.value)}
        onkeydown={(e) => handleKeydown(e, i)}
        class="ds-radio-input"
        tabindex={selected === option.value || (!selected && i === 0) ? 0 : -1}
      />

      <div class="ds-radio-dot" role="presentation">
        {#if selected === option.value}
          <div class="ds-radio-dot-inner"></div>
        {/if}
      </div>

      <span class="ds-radio-label">{option.label}</span>
    </label>
  {/each}
</div>

<style>
  .ds-radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-family: var(--font-sans);
  }

  .ds-radio-group.is-horizontal {
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .ds-radio-group.is-disabled {
    opacity: 0.5;
  }

  .ds-radio-option {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    user-select: none;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  .ds-radio-group.is-disabled .ds-radio-option {
    cursor: not-allowed;
  }

  .ds-radio-input {
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

  .ds-radio-dot {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--border-default);
    border-radius: 50%;
    background: var(--color-bg-panel);
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .ds-radio-option:hover:not(:has(:disabled)) .ds-radio-dot {
    border-color: var(--border-hover);
    background: var(--color-bg-panel-elevated);
  }

  .ds-radio-option.is-selected .ds-radio-dot {
    border-color: var(--color-accent, #b87333);
  }

  .ds-radio-option.is-selected:hover:not(:has(:disabled)) .ds-radio-dot {
    border-color: var(--color-accent-hover, #c4813d);
  }

  .ds-radio-input:focus-visible + .ds-radio-dot {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .ds-radio-dot-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-accent, #b87333);
    animation: ds-radio-in 150ms ease-out;
  }

  .ds-radio-label {
    line-height: 1.4;
  }

  @keyframes ds-radio-in {
    from {
      transform: scale(0);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
