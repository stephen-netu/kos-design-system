<script lang="ts">
  export interface Swatch {
    hex: string;
    label: string;
  }

  export interface Props {
    swatches: Swatch[];
    value?: string;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    'aria-label'?: string;
    onSelect?: (hex: string) => void;
  }

  let {
    swatches,
    value = $bindable(''),
    size = 'md',
    class: className = '',
    'aria-label': ariaLabel = 'Accent color',
    onSelect
  }: Props = $props();

  function select(hex: string) {
    value = hex;
    onSelect?.(hex);
  }

  function handleKeydown(e: KeyboardEvent, hex: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(hex);
    }
  }
</script>

<div class="ds-theme-swatch-group size-{size} {className}" role="radiogroup" aria-label={ariaLabel}>
  {#each swatches as swatch (swatch.hex)}
    <button
      type="button"
      class="ds-theme-swatch"
      class:is-active={value === swatch.hex}
      style="--swatch-hex: {swatch.hex}; --swatch-hex-2: color-mix(in oklab, {swatch.hex}, #fff 26%);"
      role="radio"
      aria-checked={value === swatch.hex}
      aria-label={swatch.label}
      title={swatch.label}
      onclick={() => select(swatch.hex)}
      onkeydown={(e) => handleKeydown(e, swatch.hex)}
    ></button>
  {/each}
</div>

<style>
  .ds-theme-swatch-group {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border: var(--border-width-thin) solid var(--border-default);
    border-radius: var(--radius-full);
  }

  .ds-theme-swatch {
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--swatch-hex) 0%, var(--swatch-hex-2) 100%);
    cursor: pointer;
    transition: transform var(--transition-fast), border-color var(--transition-fast);
  }

  .size-sm .ds-theme-swatch { width: 0.875rem; height: 0.875rem; }
  .size-md .ds-theme-swatch { width: 1.125rem; height: 1.125rem; }
  .size-lg .ds-theme-swatch { width: 1.375rem; height: 1.375rem; }

  .ds-theme-swatch:hover {
    transform: scale(1.12);
  }

  .ds-theme-swatch.is-active {
    border-color: var(--color-text-primary);
  }

  .ds-theme-swatch:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .ds-theme-swatch { transition: none; }
  }
</style>
