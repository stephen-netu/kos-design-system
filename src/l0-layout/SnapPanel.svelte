<script lang="ts" module>
  /**
   * SnapPanel — Collapsible sidebar with snap states and resize handle
   * 
   * A generalized version of NNJAS CollapsiblePanel for the LEAP design system.
   * Supports three snap states: closed, peek, full — with optional resizing.
   * 
   * @example
   * <SnapPanel position="left" bind:snap={panelState} resizable>
   *   {#snippet content()}
   *     <YourSidebarContent />
   *   {/snippet}
   * </SnapPanel>
   */
  export type PanelPosition = 'left' | 'right';
  export type PanelMode = 'overlay' | 'scoot';
  export type PanelSnap = 'closed' | 'peek' | 'full';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    position?: PanelPosition;
    mode?: PanelMode;
    snap?: PanelSnap;
    fullWidth?: number;
    peekWidth?: number;
    handleWidth?: number;
    resizable?: boolean;
    minWidth?: number;
    maxWidth?: number;
    content: Snippet;
    handleContent?: Snippet<[PanelSnap]>;
    onSnapChange?: (snap: PanelSnap) => void;
    onToggle?: () => void;
    onResize?: (width: number) => void;
    class?: string;
  }

  let {
    position = 'left',
    mode = 'overlay',
    snap = $bindable('closed'),
    fullWidth = 280,
    peekWidth = 48,
    handleWidth = 28,
    resizable = false,
    minWidth = 48,
    maxWidth = 600,
    content,
    handleContent,
    onSnapChange,
    onToggle,
    onResize,
    class: className = '',
  }: Props = $props();

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
  let isDragging = $state(false);
  let dragStartX = $state(0);
  let dragStartWidth = $state(0);

  function handleClick() {
    const next: Record<PanelSnap, PanelSnap> = { closed: 'peek', peek: 'full', full: 'closed' };
    snap = next[snap];
    onSnapChange?.(snap);
    onToggle?.();
  }

  function handleDblClick() {
    snap = snap === 'full' ? 'closed' : 'full';
    onSnapChange?.(snap);
    onToggle?.();
  }

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
    const delta = position === 'left' ? e.clientX - dragStartX : dragStartX - e.clientX;
    let newWidth = dragStartWidth + delta;
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    if (newWidth < minWidth + 20) snap = 'closed';
    else if (newWidth < (peekWidth + fullWidth) / 2) snap = 'peek';
    else snap = 'full';
    onResize?.(newWidth);
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function getHandleIcon(): string {
    if (position === 'left') {
      return snap === 'full' 
        ? 'M15 19l-7-7 7-7' // chevron left
        : 'M9 5l7 7-7 7';   // chevron right
    }
    return snap === 'full'
      ? 'M9 5l7 7-7 7'    // chevron right
      : 'M15 19l-7-7 7-7'; // chevron left
  }
</script>

<div
  class="snap-panel snap-panel--{position} snap-panel--{mode} snap-panel--{snap} {className}"
  class:resizable
  class:dragging={isDragging}
  style:width="{currentWidth}px"
  role="complementary"
  aria-hidden={!isVisible}
>
  {#if isVisible}
    <div class="snap-panel-content">
      {@render content()}
    </div>
  {/if}

  <!-- Resize handle / Toggle -->
  <div
    class="snap-panel-handle snap-panel-handle--{position}"
    style:width="{handleWidth}px"
    onclick={handleClick}
    ondblclick={handleDblClick}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    role="button"
    tabindex="0"
    aria-label={snap === 'closed' ? 'Expand panel' : snap === 'full' ? 'Collapse panel' : 'Expand panel fully'}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    }}
  >
    {#if handleContent}
      {@render handleContent(snap)}
    {:else}
      <div class="handle-visual">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d={getHandleIcon()} />
        </svg>
        {#if snap !== 'closed'}
          <div class="handle-bar"></div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .snap-panel {
    position: relative;
    display: flex;
    flex-direction: row;
    height: 100%;
    background: var(--color-bg-panel, #222);
    transition: width 0.15s ease;
    overflow: hidden;
  }

  .snap-panel--right {
    flex-direction: row-reverse;
  }

  .snap-panel--overlay {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 100;
  }

  .snap-panel--overlay.snap-panel--left {
    left: 0;
  }

  .snap-panel--overlay.snap-panel--right {
    right: 0;
  }

  .snap-panel--scoot {
    position: relative;
  }

  .snap-panel--closed {
    width: 0 !important;
  }

  .snap-panel-content {
    flex: 1;
    min-width: 0;
    overflow: auto;
    padding: var(--space-4, 1rem);
  }

  .snap-panel-handle {
    flex-shrink: 0;
    background: var(--color-bg-canvas, #1a1a1a);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    position: relative;
    transition: background 0.15s ease;
  }

  .snap-panel-handle:hover {
    background: var(--color-bg-panel-elevated, #2a2a2a);
  }

  .snap-panel--left .snap-panel-handle {
    border-left: 1px solid var(--color-border-subtle, rgba(255,255,255,0.06));
  }

  .snap-panel--right .snap-panel-handle {
    border-right: 1px solid var(--color-border-subtle, rgba(255,255,255,0.06));
  }

  .handle-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--space-2, 0.5rem) 0;
    gap: var(--space-2, 0.5rem);
  }

  .handle-visual svg {
    width: 16px;
    height: 16px;
    color: var(--color-text-muted, #666);
    flex-shrink: 0;
  }

  .handle-bar {
    width: 2px;
    height: 100%;
    margin: 0 auto;
    background: var(--color-text-muted, #555);
    border-radius: var(--radius-sm, 2px);
    transition: all 0.15s ease;
  }

  .snap-panel-handle:hover .handle-bar {
    background: var(--color-accent, #b87333);
  }

  .snap-panel.resizable .snap-panel-handle {
    cursor: col-resize;
  }

  .snap-panel.dragging {
    transition: none;
  }

  .snap-panel.dragging .handle-bar {
    background: var(--color-accent, #b87333);
    width: 3px;
  }
</style>
