<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Tab } from './tabs-types';

  // Re-export for backward compatibility
  export type { Tab } from './tabs-types';

  interface Props {
    tabs: Tab[];
    activeId?: string;
    class?: string;
    fullWidth?: boolean;
    onchange?: (id: string) => void;
  }

  let {
    tabs = [],
    activeId = $bindable(''),
    class: className = '',
    fullWidth = false,
    onchange
  }: Props = $props();
  // Handle uncontrolled init reactively
  $effect(() => {
    if (!activeId && tabs.length > 0) {
      activeId = tabs[0].id;
    }
  });
  let activeIndex = $derived(tabs.findIndex(t => t.id === activeId));
  let isClient = $state(false); // Used to delay indicator rendering until mounted

  $effect(() => {
    isClient = true;
  });

  function selectTab(id: string) {
    const tab = tabs.find(t => t.id === id);
    if (!tab || tab.disabled) return;
    
    activeId = id;
    onchange?.(id);
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    let nextIndex = index;

    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
      while (tabs[nextIndex].disabled && nextIndex !== index) {
        nextIndex = (nextIndex + 1) % tabs.length;
      }
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
      while (tabs[nextIndex].disabled && nextIndex !== index) {
        nextIndex = (nextIndex - 1 + tabs.length) % tabs.length;
      }
    } else if (e.key === 'Home') {
      nextIndex = 0;
      while (tabs[nextIndex].disabled && nextIndex < tabs.length - 1) nextIndex++;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
      while (tabs[nextIndex].disabled && nextIndex > 0) nextIndex--;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectTab(tabs[index].id);
      return;
    } else {
      return; // Do nothing
    }

    if (nextIndex !== index) {
      e.preventDefault();
      const newId = tabs[nextIndex].id;
      selectTab(newId);
      // Focus the new tab
      const newTabEl = document.getElementById(`tab-${newId}`);
      newTabEl?.focus();
    }
  }
</script>

<div class="ds-tabs-container {className}" class:full-width={fullWidth}>
  <div class="ds-tabs-list" role="tablist">
    {#each tabs as tab, i (tab.id)}
      {@const isActive = activeId === tab.id}
      <button
        id="tab-{tab.id}"
        class="ds-tab"
        class:is-active={isActive}
        class:is-disabled={tab.disabled}
        role="tab"
        aria-selected={isActive}
        aria-controls="panel-{tab.id}"
        tabindex={isActive ? 0 : -1}
        disabled={tab.disabled}
        onclick={() => selectTab(tab.id)}
        onkeydown={(e) => handleKeydown(e, i)}
      >
        {#if tab.icon}
          <span class="ds-tab-icon">
            {@render tab.icon()}
          </span>
        {/if}
        
        <span class="ds-tab-label">
          {#if typeof tab.label === 'string'}
            {tab.label}
          {:else}
            {@render tab.label()}
          {/if}
        </span>
      </button>
    {/each}

    <!-- Animated Indicator -->
    {#if isClient && activeIndex >= 0}
      <div 
        class="ds-tab-indicator"
        style="
          width: {fullWidth ? `calc(100% / ${tabs.length})` : `max-content`};
          left: calc({fullWidth ? `(100% / ${tabs.length}) * ${activeIndex}` : '0px'});
        "
      >
      </div>
    {/if}
  </div>
</div>

<style>
  .ds-tabs-container {
    width: 100%;
    border-bottom: 1px solid var(--border-default);
  }

  .ds-tabs-list {
    display: flex;
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .ds-tabs-list::-webkit-scrollbar {
    display: none;
  }

  .ds-tab {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast);
    white-space: nowrap;
    z-index: 1;
  }

  .full-width .ds-tab {
    flex: 1;
  }

  .ds-tab:hover:not(.is-disabled) {
    color: var(--color-text-primary);
    background: var(--color-bg-panel-elevated);
  }

  .ds-tab:focus-visible {
    outline: none;
    background: rgba(184, 115, 51, 0.1);
  }

  .ds-tab.is-active {
    color: var(--color-accent);
  }

  .ds-tab.is-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ds-tab-icon {
    display: flex;
    align-items: center;
  }

  .ds-tab-icon :global(svg) {
    width: 1.1em;
    height: 1.1em;
  }

  .ds-tab::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-accent);
    transform: scaleX(0);
    transition: transform var(--transition-bounce);
    transform-origin: center;
    box-shadow: 0 -1px 4px var(--color-accent-glow);
  }

  .ds-tab.is-active::after {
    transform: scaleX(1);
  }

  .ds-tab:focus-visible::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: var(--radius-sm);
    border: 2px solid var(--color-accent-subtle);
  }
</style>
