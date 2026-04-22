<script lang="ts" module>
  /**
   * VerticalToolbar — Icon bar for collapsed sidebar peek mode
   * 
   * A generalized version of NNJAS IconStrip for the LEAP design system.
   * Provides VS Code-style vertical navigation with tooltips and badges.
   * 
   * @example
   * <VerticalToolbar 
   *   items={[
   *     { id: 'files', icon: folderIcon, label: 'Files', onClick: () => {} },
   *     { id: 'search', icon: searchIcon, label: 'Search', badge: 3 },
   *   ]}
   * />
   */
  export interface ToolbarItem {
    id: string;
    icon: string;
    label: string;
    active?: boolean;
    badge?: string | number;
    disabled?: boolean;
    onClick?: () => void;
  }
</script>

<script lang="ts">
  interface Props {
    items: ToolbarItem[];
    position?: 'left' | 'right';
    class?: string;
  }

  let { items, position = 'left', class: className = '' }: Props = $props();

  let hoveredId = $state<string | null>(null);

  function handleClick(item: ToolbarItem) {
    if (!item.disabled) {
      item.onClick?.();
    }
  }

  function handleKeydown(e: KeyboardEvent, item: ToolbarItem) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(item);
    }
  }
</script>

<nav class="vertical-toolbar vertical-toolbar--{position} {className}" aria-label="Toolbar">
  {#each items as item (item.id)}
    <button
      class="toolbar-item"
      class:active={item.active}
      class:disabled={item.disabled}
      onclick={() => handleClick(item)}
      onmouseenter={() => hoveredId = item.id}
      onmouseleave={() => hoveredId = null}
      onfocus={() => hoveredId = item.id}
      onblur={() => hoveredId = null}
      onkeydown={(e) => handleKeydown(e, item)}
      aria-label={item.label}
      type="button"
      disabled={item.disabled}
    >
      <span class="toolbar-icon">
        {@html item.icon}
      </span>

      {#if item.badge !== undefined && item.badge !== null && item.badge !== ''}
        <span class="toolbar-badge">{item.badge}</span>
      {/if}

      {#if hoveredId === item.id}
        <span 
          class="toolbar-tooltip"
          class:tooltip-right={position === 'left'}
          class:tooltip-left={position === 'right'}
        >
          {item.label}
        </span>
      {/if}
    </button>
  {/each}
</nav>

<style>
  .vertical-toolbar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1, 0.25rem);
    padding: var(--space-2, 0.5rem) 0;
    height: 100%;
    overflow-y: auto;
    background: var(--color-bg-canvas, #1a1a1a);
  }

  .vertical-toolbar--left {
    border-right: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .vertical-toolbar--right {
    border-left: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .toolbar-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md, 4px);
    color: var(--color-text-muted, #666);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toolbar-item:hover:not(:disabled) {
    background: var(--color-bg-hover, rgba(255, 255, 255, 0.05));
    color: var(--color-text-secondary, #888);
  }

  .toolbar-item:focus-visible {
    outline: 2px solid var(--color-accent, #b87333);
    outline-offset: -2px;
  }

  .toolbar-item.active {
    color: var(--color-accent, #b87333);
    background: var(--color-accent-subtle, rgba(184, 115, 51, 0.15));
    border-color: var(--color-accent-muted, rgba(184, 115, 51, 0.3));
  }

  .toolbar-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: var(--color-accent, #b87333);
    border-radius: 0 2px 2px 0;
  }

  .toolbar-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .toolbar-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  }

  .toolbar-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .toolbar-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 14px;
    height: 14px;
    padding: 0 4px;
    background: var(--color-accent, #b87333);
    color: var(--color-bg-app, #141414);
    font-size: 10px;
    font-weight: 600;
    border-radius: var(--radius-full, 9999px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toolbar-tooltip {
    position: absolute;
    padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
    background: var(--color-bg-panel-elevated, #2a2a2a);
    color: var(--color-text-primary, #f2efe9);
    font-size: var(--text-xs, 0.75rem);
    white-space: nowrap;
    border-radius: var(--radius-md, 4px);
    pointer-events: none;
    z-index: 1000;
    box-shadow: var(--shadow-md, 0 4px 6px rgba(0,0,0,0.3));
  }

  .toolbar-tooltip.tooltip-right {
    left: calc(100% + var(--space-2, 0.5rem));
  }

  .toolbar-tooltip.tooltip-left {
    right: calc(100% + var(--space-2, 0.5rem));
  }
</style>
