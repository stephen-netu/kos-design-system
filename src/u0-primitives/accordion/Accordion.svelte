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

  interface Props {
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

  const props: Props = $props();

  // Default values
  const singleOpen = props.singleOpen ?? false;
  const defaultOpen = props.defaultOpen ?? [];

  // Internal state for uncontrolled mode
  const [internalOpenIds, setInternalOpenIds] = $state(defaultOpen);

  // Determine if we're using controlled or uncontrolled mode
  const isControlled = $derived(props.open !== undefined);
  const openIds = $derived(isControlled ? (props.open ?? []) : internalOpenIds);

  // Toggle panel open/closed state
  function togglePanel(id: string): void {
    if (isControlled) {
      // In controlled mode, notify parent to handle state change
      props.onOpenChange?.(openIds.includes(id) 
        ? openIds.filter(openId => openId !== id) 
        : [...openIds, id]);
    } else {
      // In uncontrolled mode, update internal state
      setInternalOpenIds(prev => {
        if (singleOpen) {
          return [id]; // Only allow one open at a time
        }
        if (prev.includes(id)) {
          return prev.filter(openId => openId !== id); // Close if already open
        }
        return [...prev, id]; // Open if closed
      });
    }
  }

  // Check if panel is open
  function isOpen(id: string): boolean {
    return openIds.includes(id);
  }

  // Check if panel is disabled
  function isDisabled(id: string): boolean {
    const panel = props.panels.find(p => p.id === id);
    return panel?.disabled ?? false;
  }
</script>

{#if props.panels.length > 0}
<div class="accordion">
  {#each props.panels as panel}
    <div class="accordion-item" 
         class:disabled={isDisabled(panel.id)}
         class:open={isOpen(panel.id)}>
      <div class="accordion-header"
           on:click={() => !isDisabled(panel.id) && togglePanel(panel.id)}
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
    border: 1px solid var(--color-border, #333);
    background: var(--color-bg-app, #141414);
  }

  .accordion-item {
    border-bottom: 1px solid var(--color-border, #333);
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
    background: var(--color-bg-secondary, #222);
  }

  .accordion-header:focus-visible {
    outline: 2px solid var(--color-accent, #b87333);
    outline-offset: 2px;
  }

  .accordion-title {
    font-weight: 600;
    flex: 1;
    min-width: 0;
  }

  .accordion-icon {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--duration-normal, 200ms) ease-in-out;
  }

  .accordion-icon[aria-expanded="true"] {
    transform: rotate(180deg);
  }

  .accordion-panel {
    overflow: hidden;
  }

  .accordion-content {
    padding: var(--space-4, 1rem);
    animation: slideDown var(--duration-normal, 200ms) ease-out;
  }

  @keyframes slideDown {
    from {
      height: 0;
      opacity: 0;
    }
    to {
      height: auto;
      opacity: 1;
    }
  }

  /* Focus styles for keyboard navigation */
  .accordion-header:focus-visible {
    box-shadow: 0 0 0 2px var(--color-accent, #b87333);
  }

  /* Disabled states */
  .accordion-item.disabled .accordion-header {
    cursor: not-allowed;
  }

  .accordion-item.disabled .accordion-header:hover {
    background: transparent;
  }
</style>