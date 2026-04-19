<script lang="ts">
  interface Props {
    checked?: boolean;
    label?: string;
    disabled?: boolean;
    size?: 'sm' | 'md';
    class?: string;
    id?: string;
    name?: string;
    onchange?: (e: Event) => void;
  }

  let {
    checked = $bindable(false),
    label = '',
    disabled = false,
    size = 'md',
    class: className = '',
    id,
    name,
    onchange
  }: Props = $props();

  let trackWidth = $derived(size === 'sm' ? 32 : 40);
  let trackHeight = $derived(size === 'sm' ? 18 : 22);
  let thumbSize = $derived(size === 'sm' ? 14 : 18);
</script>

<label
  class="ds-form-toggle {className}"
  class:is-disabled={disabled}
  class:is-checked={checked}
  class:is-sm={size === 'sm'}
>
  <input
    type="checkbox"
    bind:checked
    {id}
    {name}
    {disabled}
    {onchange}
    class="ds-form-toggle-native"
    role="switch"
    aria-checked={checked}
  />

  <div
    class="ds-form-toggle-track"
    role="presentation"
    style:width="{trackWidth}px"
    style:height="{trackHeight}px"
  >
    <div
      class="ds-form-toggle-thumb"
      style:width="{thumbSize}px"
      style:height="{thumbSize}px"
    ></div>
  </div>

  {#if label}
    <span class="ds-form-toggle-label">{label}</span>
  {/if}
</label>

<style>
  .ds-form-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    user-select: none;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  .ds-form-toggle.is-sm {
    font-size: var(--text-xs);
  }

  .ds-form-toggle.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ds-form-toggle-native {
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

  .ds-form-toggle-track {
    position: relative;
    border-radius: var(--radius-full);
    background: var(--color-bg-panel);
    border: 1.5px solid var(--border-default);
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .ds-form-toggle:hover:not(.is-disabled) .ds-form-toggle-track {
    border-color: var(--border-hover);
    background: var(--color-bg-panel-elevated);
  }

  .ds-form-toggle.is-checked .ds-form-toggle-track {
    background: var(--color-accent, #b87333);
    border-color: var(--color-accent, #b87333);
  }

  .ds-form-toggle.is-checked:hover:not(.is-disabled) .ds-form-toggle-track {
    background: var(--color-accent-hover, #c4813d);
    border-color: var(--color-accent-hover, #c4813d);
  }

  .ds-form-toggle-native:focus-visible + .ds-form-toggle-track {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .ds-form-toggle-thumb {
    position: absolute;
    top: 50%;
    left: 2px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--color-text-muted);
    transition: all var(--transition-fast);
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .ds-form-toggle.is-checked .ds-form-toggle-thumb {
    left: calc(100% - 2px);
    transform: translate(-100%, -50%);
    background: var(--color-bg-app, #1a1a1a);
  }

  .ds-form-toggle-label {
    line-height: 1.4;
  }
</style>
