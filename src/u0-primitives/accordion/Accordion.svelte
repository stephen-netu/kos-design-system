<script lang="ts">
  /**
   * Accordion Component
   * 
   * A vertically stacked set of interactive headings that each reveal a panel of associated content.
   * 
   * @package @kos/design-system/u0-primitives
   */
  import type { Snippet } from 'svelte';

  interface Panel {
    /** Unique identifier for the panel */
    id: string;
    /** Heading/title of the panel */
    title: string;
    /** Content of the panel */
    content: Snippet;
    /** Whether the panel is disabled */
    disabled?: boolean;
  }

  export interface Props {
    /** Array of panels to display */
    panels: Panel[];
    /** Whether only one panel can be open at a time */
    singleOpen?: boolean;
    /** Default open panel IDs (for uncontrolled mode) */
    defaultOpen?: string[];
    /** Currently open panel IDs (for controlled mode) */
    open?: string[];
    /** Callback when open state changes */
    onOpenChange?: (openIds: string[]) => void;
  }

  let {
    panels,
    singleOpen = false,
    defaultOpen = [],
    open: controlledOpen,
    onOpenChange,
  }: Props = $props();

  let internalOpenIds = $state<string[]>([...defaultOpen]);

  function setInternalOpenIds(fn: (prev: string[]) => string[]) {
    internalOpenIds = fn(internalOpenIds);
  }

  const isControlled = $derived(controlledOpen !== undefined);
  const openIds = $derived(isControlled ? (controlledOpen ?? []) : internalOpenIds);

  function togglePanel(id: string): void {
    if (isControlled) {
      const current = controlledOpen ?? [];
      onOpenChange?.(current.includes(id)
        ? current.filter((openId: string) => openId !== id)
        : [...current, id]);
    } else {
      setInternalOpenIds((prev: string[]) => {
        if (singleOpen) {
          return [id];
        }
        if (prev.includes(id)) {
          return prev.filter((openId: string) => openId !== id);
        }
        return [...prev, id];
      });
    }
  }

  function isOpen(id: string): boolean {
    return openIds.includes(id);
  }

  function isDisabled(id: string): boolean {
    const panel = panels.find(p => p.id === id);
    return panel?.disabled ?? false;
  }
</script>

{#if panels.length > 0}
<div class="accordion">
  {#each panels as panel}
    <div class="accordion-item"
         class:disabled={isDisabled(panel.id)}
         class:open={isOpen(panel.id)}>
      <div class="accordion-header"
           id={`accordion-header-${panel.id}`}
           onclick={() => !isDisabled(panel.id) && togglePanel(panel.id)}
           onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!isDisabled(panel.id)) togglePanel(panel.id); } }}
           aria-expanded={isOpen(panel.id)}
           aria-controls={`accordion-panel-${panel.id}`}
           role="button"
           tabindex={isDisabled(panel.id) ? -1 : 0}>
        <div class="accordion-title">
          {panel.title}
        </div>
        <div class="accordion-icon">
          {#if isOpen(panel.id)}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 15 12 9 18 15"></polyline>
            </svg>
          {/if}
        </div>
      </div>

      {#if isOpen(panel.id)}
        <div class="accordion-panel" 
             id={`accordion-panel-${panel.id}`}
             role="region"
             aria-labelledby={`accordion-header-${panel.id}`}>
          <div class="accordion-content">
            {@render panel.content()}
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>
{/if}

<style>
  .accordion {
    border-radius: var(--radius-md, 0.25rem);
    overflow: hidden;
    border: 1px solid var(--color-border, var(--border-default, #3a3630));
    background: var(--color-bg-app, #0b0d0f);
  }

  .accordion-item {
    border-bottom: 1px solid var(--color-border, var(--border-default, #3a3630));
  }

  .accordion-item:last-child {
    border-bottom: none;
  }

  .accordion-item.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4, 1rem);
    cursor: pointer;
    user-select: none;
    transition: background-color var(--duration-normal, 200ms) ease-in-out;
  }

  .accordion-header:hover:not(.disabled) {
    background: var(--color-bg-secondary, var(--color-bg-canvas, #121518));
  }

  /* Removed duplicate focus-visible — the box-shadow variant below supersedes. */

  /* Focus styles for keyboard navigation */
  .accordion-header:focus-visible {
    box-shadow: 0 0 0 2px var(--color-accent, var(--color-accent));
  }

  /* Disabled states */
  .accordion-item.disabled .accordion-header {
    cursor: not-allowed;
  }

  .accordion-item.disabled .accordion-header:hover {
    background: transparent;
  }

  .accordion-panel {
    display: block;
  }

  .accordion-content {
    padding: var(--space-4, 1rem);
    padding-top: 0;
  }
</style>