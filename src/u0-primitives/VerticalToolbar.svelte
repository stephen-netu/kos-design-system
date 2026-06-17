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
    background: var(--color-bg-canvas);
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
    height: var(--ui-control-h, 36px);
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0;
    color: var(--color-text-muted, #6b6558);
    cursor: pointer;
    transition: color var(--transition-fast) linear, background var(--transition-fast) linear;
  }

  .toolbar-item:hover:not(:disabled) {
    background: var(--color-bg-hover, rgba(255, 255, 255, 0.05));
    color: var(--color-text-secondary, #a8a08c);
  }

  .toolbar-item:focus-visible {
    outline: 2px solid var(--color-accent, var(--color-accent));
    outline-offset: -2px;
  }

  .toolbar-item.active {
    color: var(--color-accent, var(--color-accent));
    background: var(--color-accent-subtle, var(--color-accent-muted));
    border-color: var(--color-accent-muted, var(--color-accent-muted));
  }

  /* Active live-edge on the left — accent as functional state indicator */
  .toolbar-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-accent);
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

  /* Badge fill justified: count is a functional readout (unread count), not decoration */
  .toolbar-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    background: var(--color-accent);
    color: var(--color-bg-app, #0a0b0c);
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-variant-numeric: tabular-nums;
  }

  .toolbar-tooltip {
    position: absolute;
    padding: 3px 7px;
    background: var(--color-bg-panel-elevated);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: var(--ui-label, 10px);
    letter-spacing: 0.05em;
    white-space: nowrap;
    border: 1px solid var(--border-default);
    pointer-events: none;
    z-index: 1000;
  }

  .toolbar-tooltip.tooltip-right {
    left: calc(100% + var(--space-2, 0.5rem));
  }

  .toolbar-tooltip.tooltip-left {
    right: calc(100% + var(--space-2, 0.5rem));
  }
</style>
