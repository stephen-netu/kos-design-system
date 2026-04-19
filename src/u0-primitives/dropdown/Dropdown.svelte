<script lang="ts">
  import type { Snippet } from 'svelte';
  
  export interface DropdownItem {
    id: string;
    label: string;
    icon?: Snippet;
    shortcut?: string;
    disabled?: boolean;
    danger?: boolean;
  }

  interface Props {
    items: DropdownItem[];
    trigger: Snippet;
    align?: 'left' | 'right' | 'center';
    width?: string;
    class?: string;
    onselect?: (item: DropdownItem) => void;
  }

  let {
    items = [],
    trigger,
    align = 'left',
    width = '240px',
    class: className = '',
    onselect
  }: Props = $props();

  let isOpen = $state(false);
  let menuNode = $state<HTMLElement | null>(null);
  let triggerNode = $state<HTMLElement | null>(null);
  let focusedIndex = $state(-1);

  function toggleMenu() {
    isOpen = !isOpen;
    if (isOpen) {
      focusedIndex = -1; // Reset focus when opening
    }
  }

  function closeMenu() {
    isOpen = false;
    focusedIndex = -1;
  }

  function handleSelect(item: DropdownItem) {
    if (item.disabled) return;
    onselect?.(item);
    closeMenu();
    // Return focus to trigger
    triggerNode?.querySelector('button')?.focus();
  }

  // Handle clicks outside
  function handleWindowClick(e: MouseEvent) {
    if (isOpen && menuNode && triggerNode && !menuNode.contains(e.target as Node) && !triggerNode.contains(e.target as Node)) {
      closeMenu();
    }
  }

  // Keyboard navigation
  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
        // Target next tick logic essentially
        setTimeout(() => {
          focusedIndex = items.findIndex(i => !i.disabled);
          focusItem(focusedIndex);
        }, 0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeMenu();
        triggerNode?.querySelector('button')?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusedIndex = findNextFocusable(focusedIndex, 1);
        focusItem(focusedIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusedIndex = findNextFocusable(focusedIndex, -1);
        focusItem(focusedIndex);
        break;
      case 'Home':
        e.preventDefault();
        focusedIndex = findNextFocusable(-1, 1);
        focusItem(focusedIndex);
        break;
      case 'End':
        e.preventDefault();
        focusedIndex = findNextFocusable(items.length, -1);
        focusItem(focusedIndex);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && !items[focusedIndex].disabled) {
          handleSelect(items[focusedIndex]);
        }
        break;
    }
  }

  function findNextFocusable(startIndex: number, direction: 1 | -1): number {
    // Guard: if no items are focusable, bail early
    if (items.every(i => i.disabled)) return startIndex;
    let nextIndex = startIndex + direction;
    while (nextIndex >= 0 && nextIndex < items.length) {
      if (!items[nextIndex].disabled) {
        return nextIndex;
      }
      nextIndex += direction;
    }
    // Wrap around
    if (nextIndex < 0) return findNextFocusable(items.length, -1);
    if (nextIndex >= items.length) return findNextFocusable(-1, 1);
    return startIndex;
  }

  function focusItem(index: number) {
    if (menuNode && index >= 0) {
      const items = menuNode.querySelectorAll('[role="menuitem"]');
      (items[index] as HTMLElement)?.focus();
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="ds-dropdown-wrapper {className}">
  <!-- trigger slot wrapper needs the ref and keyboard events -->
  <div 
    bind:this={triggerNode} 
    onkeydown={handleKeydown}
    role="button"
    tabindex="0"
    class="ds-dropdown-trigger"
    aria-expanded={isOpen}
    aria-haspopup="menu"
    onclick={toggleMenu}
  >
    {@render trigger()}
  </div>

  {#if isOpen}
    <div 
      bind:this={menuNode}
      class="ds-dropdown-menu align-{align}"
      style="width: {width};"
      role="menu"
      tabindex="-1"
      onkeydown={handleKeydown}
    >
      {#each items as item, i (item.id)}
        <button
          class="ds-dropdown-item"
          class:is-danger={item.danger}
          role="menuitem"
          tabindex={i === focusedIndex ? 0 : -1}
          disabled={item.disabled}
          aria-disabled={item.disabled}
          onclick={(e) => { e.stopPropagation(); handleSelect(item); }}
          onmouseenter={() => focusedIndex = i}
        >
          {#if item.icon}
            <span class="ds-dropdown-icon">
              {@render item.icon()}
            </span>
          {/if}
          
          <span class="ds-dropdown-label">{item.label}</span>
          
          {#if item.shortcut}
            <span class="ds-dropdown-shortcut">{item.shortcut}</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .ds-dropdown-wrapper {
    position: relative;
    display: inline-block;
  }

  .ds-dropdown-trigger {
    display: inline-block;
  }

  .ds-dropdown-menu {
    position: absolute;
    top: calc(100% + var(--space-2));
    background: var(--color-bg-panel-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg), 0 0 0 1px rgba(0,0,0,0.5);
    padding: var(--space-1);
    z-index: 1000;
    animation: ds-scale-in var(--transition-fast) transform-origin;
  }

  /* Alignments */
  .align-left { left: 0; transform-origin: top left; }
  .align-right { right: 0; transform-origin: top right; }
  .align-center { left: 50%; transform: translateX(-50%); transform-origin: top center; }

  .ds-dropdown-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .ds-dropdown-item:hover,
  .ds-dropdown-item:focus {
    background: var(--color-bg-panel);
    outline: none;
  }

  .ds-dropdown-item:focus-visible {
    background: rgba(184, 115, 51, 0.15); /* Suble brass focus */
  }

  .ds-dropdown-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Danger Item */
  .ds-dropdown-item.is-danger {
    color: var(--color-error);
  }

  .ds-dropdown-item.is-danger:hover,
  .ds-dropdown-item.is-danger:focus {
    background: rgba(166, 94, 94, 0.1);
  }

  .ds-dropdown-icon {
    display: flex;
    margin-right: var(--space-3);
    color: var(--color-text-secondary);
  }

  .ds-dropdown-item.is-danger .ds-dropdown-icon {
    color: var(--color-error);
  }

  .ds-dropdown-item:hover:not(.is-danger) .ds-dropdown-icon {
    color: var(--color-accent);
  }

  .ds-dropdown-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ds-dropdown-shortcut {
    margin-left: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    background: var(--color-bg-app);
    padding: 2px 6px;
    border-radius: var(--radius-sm, 4px);
    border: 1px solid var(--border-subtle);
  }

  @keyframes ds-scale-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .align-center {
    animation-name: ds-scale-in-center;
  }

  @keyframes ds-scale-in-center {
    from { opacity: 0; transform: translateX(-50%) scale(0.95); }
    to { opacity: 1; transform: translateX(-50%) scale(1); }
  }
</style>
