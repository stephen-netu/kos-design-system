<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    label?: string;
    rows?: number;
    maxLength?: number;
    disabled?: boolean;
    error?: boolean;
    class?: string;
    id?: string;
    name?: string;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
  }

  let {
    value = $bindable(''),
    placeholder = '',
    label,
    rows = 4,
    maxLength,
    disabled = false,
    error = false,
    class: className = '',
    id,
    name,
    oninput,
    onchange
  }: Props = $props();

  let isFocused = $state(false);
  let charCount = $derived(value.length);
  let isNearLimit = $derived(maxLength ? charCount > maxLength * 0.9 : false);
  let isOverLimit = $derived(maxLength ? charCount > maxLength : false);
</script>

<div
  class="ds-textarea-wrapper {className}"
  class:is-focused={isFocused}
  class:is-disabled={disabled}
  class:has-error={error || isOverLimit}
>
  <textarea
    {id}
    {name}
    bind:value
    {placeholder}
    {rows}
    {disabled}
    maxlength={maxLength}
    onfocus={() => isFocused = true}
    onblur={() => isFocused = false}
    {oninput}
    {onchange}
    class="ds-textarea-element"
    aria-label={label}
    aria-invalid={error || isOverLimit}
  ></textarea>

  {#if maxLength}
    <div
      class="ds-textarea-counter"
      class:is-near={isNearLimit}
      class:is-over={isOverLimit}
      aria-live="polite"
    >
      {charCount}/{maxLength}
    </div>
  {/if}

  <div class="ds-textarea-glow"></div>
</div>

<style>
  .ds-textarea-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    background: var(--color-bg-panel);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    overflow: hidden;
  }

  .ds-textarea-wrapper:hover:not(.is-disabled) {
    border-color: var(--border-hover);
    background: var(--color-bg-panel-elevated);
  }

  .ds-textarea-wrapper.is-focused {
    border-color: var(--color-accent);
    background: var(--color-bg-app);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
  }

  .ds-textarea-wrapper.has-error {
    border-color: var(--color-error);
  }

  .ds-textarea-wrapper.is-disabled {
    opacity: 0.5;
    background: rgba(0,0,0,0.2);
    cursor: not-allowed;
  }

  .ds-textarea-element {
    width: 100%;
    padding: var(--space-3);
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    line-height: 1.5;
    resize: vertical;
    min-height: 2.5rem;
  }

  .ds-textarea-element::placeholder {
    color: var(--color-text-muted);
  }

  .ds-textarea-element:disabled {
    cursor: not-allowed;
    resize: none;
  }

  .ds-textarea-counter {
    align-self: flex-end;
    padding: var(--space-1) var(--space-3) var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    transition: color var(--transition-fast);
  }

  .ds-textarea-counter.is-near {
    color: var(--color-accent, #b87333);
  }

  .ds-textarea-counter.is-over {
    color: var(--color-error);
  }

  .ds-textarea-glow {
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

  .ds-textarea-wrapper.is-focused .ds-textarea-glow {
    transform: scaleX(1);
  }

  .ds-textarea-wrapper.has-error .ds-textarea-glow {
    background: var(--color-error);
    box-shadow: 0 -1px 4px rgba(166, 94, 94, 0.4);
  }
</style>
