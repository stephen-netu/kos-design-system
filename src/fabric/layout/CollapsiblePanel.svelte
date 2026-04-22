<script lang="ts" module>
  export type PanelPosition = 'left' | 'right';
  export type PanelMode = 'overlay' | 'scoot';
  export type PanelSnap = 'closed' | 'peek' | 'full';
</script>

<script lang="ts">
  /**
   * CollapsiblePanel — Reusable side panel with toggle handle
   *
   * Based on Ryu's BoardDrawer pattern (wt-XXX).
   * Provides a vertical handle bar that can toggle/resize the panel.
   *
   * Modes:
   *   - 'overlay': Panel slides over content (z-index above)
   *   - 'scoot': Panel pushes content (grid/flex layout shifts)
   *
   * Snap states:
   *   - 'closed': Panel hidden, handle visible at edge
   *   - 'peek': Panel partially visible (configurable width)
   *   - 'full': Panel fully expanded
   *
   * Features:
   *   - Click handle to cycle through states
   *   - Double-click handle to toggle full/closed
   *   - Drag handle to resize (optional)
   *   - Keyboard shortcut support via onToggle callback
   *
   * @example
   * ```svelte
   * <CollapsiblePanel
   *   position="left"
   *   mode="scoot"
   *   bind:snap
   *   fullWidth={280}
   *   peekWidth={60}
   * >
   *   {#snippet content()}
   *     <SidebarContent />
   *   {/snippet}
   * </CollapsiblePanel>
   * ```
   */
  import type { Snippet } from 'svelte';

  interface Props {
    /** Panel position - left or right side */
    position?: PanelPosition;
    /** Display mode - overlay (floats) or scoot (pushes content) */
    mode?: PanelMode;
    /** Current snap state */
    snap?: PanelSnap;
    /** Full expanded width in pixels */
    fullWidth?: number;
    /** Peek (partial) width in pixels */
    peekWidth?: number;
    /** Handle width in pixels (visible when closed) */
    handleWidth?: number;
    /** Enable drag-to-resize */
    resizable?: boolean;
    /** Minimum width when resizing */
    minWidth?: number;
    /** Maximum width when resizing */
    maxWidth?: number;
    /** Panel content */
    content: Snippet;
    /** Called when snap state changes */
    onSnapChange?: (snap: PanelSnap) => void;
    /** Called when panel is toggled (for keyboard shortcuts) */
    onToggle?: () => void;
    /** Called when width changes from resize */
    onResize?: (width: number) => void;
    /** Additional CSS class for the panel */
    class?: string;
  }

  let {
    position = 'left',
    mode = 'overlay',
    snap = $bindable('closed'),
    fullWidth = 280,
    peekWidth = 60,
    handleWidth = 16,
    resizable = false,
    minWidth = 60,
    maxWidth = 600,
    content,
    onSnapChange,
    onToggle,
    onResize,
    class: className = '',
  }: Props = $props();

  // ── Derived dimensions ───────────────────────────────────────────────────

  let currentWidth = $derived.by(() => {
    switch (snap) {
      case 'full': return fullWidth;
      case 'peek': return peekWidth;
      case 'closed': return 0;
      default: return 0;
    }
  });

  let isVisible = $derived(snap !== 'closed');
  let isFull = $derived(snap === 'full');

  // ── Drag resize state ─────────────────────────────────────────────────────

  let isDragging = $state(false);
  let dragStartX = $state(0);
  let dragStartWidth = $state(0);

  // ── Handle interactions ───────────────────────────────────────────────────

  function handleClick() {
    // Cycle: closed -> peek -> full -> closed
    const next: Record<PanelSnap, PanelSnap> = {
      closed: 'peek',
      peek: 'full',
      full: 'closed',
    };
    snap = next[snap];
    onSnapChange?.(snap);
    onToggle?.();
  }

  function handleDblClick() {
    // Toggle between full and closed (skip peek)
    snap = snap === 'full' ? 'closed' : 'full';
    onSnapChange?.(snap);
    onToggle?.();
  }

  // ── Drag resize handlers ─────────────────────────────────────────────────

  function handlePointerDown(e: PointerEvent) {
    if (!resizable || snap === 'closed') return;
    e.preventDefault();
    isDragging = true;
    dragStartX = e.clientX;
    dragStartWidth = currentWidth;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    e.preventDefault();

    const delta = position === 'left'
      ? e.clientX - dragStartX
      : dragStartX - e.clientX;

    let newWidth = dragStartWidth + delta;
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    // Auto-snap based on width thresholds
    if (newWidth < minWidth + 20) {
      snap = 'closed';
    } else if (newWidth < (peekWidth + fullWidth) / 2) {
      snap = 'peek';
    } else {
      snap = 'full';
    }

    onResize?.(newWidth);
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    onSnapChange?.(snap);
  }

  // ── Keyboard support ───────────────────────────────────────────────────────

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }
</script>

<div
  class="collapsible-panel"
  class:collapsible-panel--left={position === 'left'}
  class:collapsible-panel--right={position === 'right'}
  class:collapsible-panel--overlay={mode === 'overlay'}
  class:collapsible-panel--scoot={mode === 'scoot'}
  class:collapsible-panel--visible={isVisible}
  class:collapsible-panel--full={isFull}
  class:collapsible-panel--dragging={isDragging}
  style:--panel-width="{currentWidth}px"
  style:--full-width="{fullWidth}px"
  style:--peek-width="{peekWidth}px"
  style:--handle-width="{handleWidth}px"
>
  <!-- Panel content area -->
  <div
    class="panel-content"
    class:panel-content--visible={isVisible}
    style:width="{isVisible ? currentWidth : 0}px"
  >
    {#if isVisible}
      {@render content()}
    {/if}
  </div>

  <!-- Toggle/resize handle -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="panel-handle"
    class:panel-handle--left={position === 'left'}
    class:panel-handle--right={position === 'right'}
    class:panel-handle--resizable={resizable && isVisible}
    class:panel-handle--expanded={isVisible}
    onclick={handleClick}
    ondblclick={handleDblClick}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
    onkeydown={handleKeydown}
    role="button"
    tabindex="0"
    aria-label="{position} panel {isVisible ? 'collapse' : 'expand'}"
    aria-pressed={isVisible}
  >
    <div class="panel-handle__bar"></div>
  </div>
</div>

<style>
  .collapsible-panel {
    --panel-bg: var(--color-bg-panel, #1a1a1a);
    --panel-border: var(--border-subtle, 1px solid rgba(255, 255, 255, 0.06));
    --handle-bg: var(--color-bg-inset, #0f0f0f);
    --handle-hover-bg: var(--color-bg-canvas, #141414);
    --accent-color: var(--color-accent, #00ff41);
    --transition-duration: 300ms;

    display: flex;
    align-items: stretch;
    height: 100%;
    position: relative;
  }

  /* Position variants */
  .collapsible-panel--left {
    flex-direction: row;
  }

  .collapsible-panel--right {
    flex-direction: row-reverse;
  }

  /* Overlay mode: panel floats above content */
  .collapsible-panel--overlay {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 100;
  }

  .collapsible-panel--overlay.collapsible-panel--left {
    left: 0;
  }

  .collapsible-panel--overlay.collapsible-panel--right {
    right: 0;
  }

  /* Scoot mode: panel is in-flow */
  .collapsible-panel--scoot {
    position: relative;
    flex-shrink: 0;
    min-width: 0;
    width: auto;
  }

  .collapsible-panel--scoot:not(.collapsible-panel--visible) {
    width: var(--handle-width);
  }

  /* Panel content container */
  .panel-content {
    background: var(--panel-bg);
    border-right: var(--panel-border);
    border-left: var(--panel-border);
    overflow: hidden;
    transition: width var(--transition-duration) cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
  }

  .collapsible-panel--right .panel-content {
    border-right: none;
    border-left: var(--panel-border);
  }

  .panel-content--visible {
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Handle */
  .panel-handle {
    width: var(--handle-width);
    min-width: var(--handle-width);
    background: var(--handle-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    position: relative;
    transition: background 0.15s ease;
    min-height: 100%;
  }

  .panel-handle:hover {
    background: var(--handle-hover-bg);
  }

  .panel-handle--resizable {
    cursor: ew-resize;
  }

  .panel-handle--left {
    border-right: var(--panel-border);
  }

  .panel-handle--right {
    border-left: var(--panel-border);
  }

  /* Simple vertical bar handle - full height visual */
  .panel-handle__bar {
    width: 2px;
    height: 64px;
    background: var(--color-text-muted, #555);
    border-radius: var(--shape-border-radius, 1px);
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .panel-handle:hover .panel-handle__bar {
    background: var(--color-text-primary, #ccc);
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
  }

  .panel-handle--expanded .panel-handle__bar {
    background: var(--accent-color);
    box-shadow: 0 0 6px var(--accent-color);
    opacity: 0.6;
  }

  .collapsible-panel--dragging .panel-handle__bar {
    background: var(--accent-color);
    box-shadow: 0 0 8px var(--accent-color);
    opacity: 1;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .panel-content {
      transition: none;
    }
  }

  /* Focus visible for accessibility */
  .panel-handle:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: -2px;
  }
</style>
