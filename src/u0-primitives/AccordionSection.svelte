<script lang="ts" module>
  /**
   * AccordionSection — Collapsible section with chevron toggle
   * 
   * A generalized version of NNJAS CollapsibleSection for the LEAP design system.
   * Used for sidebar sections, filter groups, settings categories.
   * 
   * @example
   * <AccordionSection title="Filters" count={5}>
   *   <FilterOptions />
   * </AccordionSection>
   */
  export interface AccordionSectionProps {
    title: string;
    icon?: string;
    count?: number;
    defaultExpanded?: boolean;
    disabled?: boolean;
    class?: string;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props extends AccordionSectionProps {
    children: Snippet;
    expanded?: boolean;
  }

  let {
    title,
    icon,
    count,
    defaultExpanded = true,
    disabled = false,
    class: className = '',
    children,
    expanded = $bindable(defaultExpanded),
  }: Props = $props();

  function toggle() {
    if (!disabled) {
      expanded = !expanded;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }
</script>

<div class="accordion-section {className}" class:collapsed={!expanded} class:disabled>
  <button
    class="section-header"
    onclick={toggle}
    onkeydown={handleKeydown}
    aria-expanded={expanded}
    type="button"
    disabled={disabled}
  >
    <span class="section-chevron" aria-hidden="true">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
      </svg>
    </span>

    {#if icon}
      <span class="section-icon">
        {@html icon}
      </span>
    {/if}

    <span class="section-title">{title}</span>

    {#if count !== undefined}
      <span class="section-count">{count}</span>
    {/if}
  </button>

  {#if expanded}
    <div class="section-content">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .accordion-section {
    border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    width: 100%;
    padding: var(--space-3, 0.75rem);
    background: transparent;
    border: none;
    color: var(--color-text-secondary, #888);
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs, 0.75rem);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }

  .section-header:hover:not(:disabled) {
    background: var(--color-bg-hover, rgba(255, 255, 255, 0.03));
    color: var(--color-text-primary, #e8e8e8);
  }

  .section-header:focus-visible {
    outline: 2px solid var(--color-accent, #b87333);
    outline-offset: -2px;
  }

  .section-header:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .section-chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    transition: transform 0.15s ease;
  }

  .section-chevron svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  .collapsed .section-chevron {
    transform: rotate(-90deg);
  }

  .section-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--color-text-muted, #666);
  }

  .section-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .section-title {
    flex: 1;
  }

  .section-count {
    padding: 0 var(--space-2, 0.5rem);
    background: var(--color-accent-subtle, rgba(184, 115, 51, 0.15));
    color: var(--color-accent, #b87333);
    font-size: var(--text-2xs, 0.625rem);
    border-radius: var(--radius-full, 9999px);
    min-width: 20px;
    text-align: center;
  }

  .section-content {
    padding: 0 var(--space-3, 0.75rem) var(--space-3, 0.75rem);
  }

  .collapsed .section-content {
    display: none;
  }
</style>
