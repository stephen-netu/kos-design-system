<script lang="ts">
  // CheckpointBar.svelte — Bottom-mounted timeline navigation
  // ADR: ui-timeline-checkpoint-bar-001
  // Svelte 5 runes pattern — no stores, pure props/events

  import type {
    Checkpoint,
    CheckpointComponentType,
    CheckpointStatus,
  } from './checkpoint-types';
  import {
    CHECKPOINT_COLORS,
    CHECKPOINT_STATUS_SYMBOLS,
    CHECKPOINT_BAR_HEIGHT,
    CHECKPOINT_NODE_SIZE,
    CHECKPOINT_NODE_ACTIVE_SIZE,
    getCheckpointColor,
  } from './checkpoint-types';

  interface Props {
    checkpoints: Checkpoint[];
    currentSeqno: number;
    previewSeqno?: number | null;
    onCheckpointClick?: (checkpoint: Checkpoint) => void;
    onCheckpointDoubleClick?: (checkpoint: Checkpoint) => void;
    onNowHandleDrag?: (seqno: number) => void;
    onExitPreview?: () => void;
    'aria-label'?: string;
  }

  let {
    checkpoints,
    currentSeqno,
    previewSeqno = null,
    onCheckpointClick,
    onCheckpointDoubleClick,
    onNowHandleDrag,
    onExitPreview,
    'aria-label': ariaLabel = 'System checkpoint timeline. Use arrow keys to navigate, Enter to preview, Escape to exit preview.',
  }: Props = $props();

  // Derived state
  let focusedIndex = $state<number>(-1);

  let maxSeqno = $derived(
    checkpoints.length > 0
      ? Math.max(...checkpoints.map((c) => c.seqno))
      : 0
  );

  let minSeqno = $derived(
    checkpoints.length > 0
      ? Math.min(...checkpoints.map((c) => c.seqno))
      : 0
  );

  let displaySeqno = $derived(previewSeqno ?? currentSeqno);

  // Track scrolling for overflow indicators
  let trackRef: HTMLDivElement | null = $state(null);
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);

  function updateScrollIndicators() {
    if (!trackRef) return;
    canScrollLeft = trackRef.scrollLeft > 0;
    canScrollRight =
      trackRef.scrollLeft < trackRef.scrollWidth - trackRef.clientWidth;
  }

  function scrollToCheckpoint(seqno: number) {
    if (!trackRef) return;
    const index = checkpoints.findIndex((c) => c.seqno === seqno);
    if (index === -1) return;

    // Calculate approximate position
    const nodeWidth = 40; // Approximate width per checkpoint node
    const scrollPos = index * nodeWidth - trackRef.clientWidth / 2;
    trackRef.scrollTo({ left: scrollPos, behavior: 'smooth' });
  }

  function handleCheckpointClick(checkpoint: Checkpoint, index: number) {
    focusedIndex = index;
    onCheckpointClick?.(checkpoint);
  }

  function handleCheckpointDoubleClick(checkpoint: Checkpoint) {
    onCheckpointDoubleClick?.(checkpoint);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (checkpoints.length === 0) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        focusedIndex = Math.max(0, focusedIndex - 1);
        scrollToCheckpoint(checkpoints[focusedIndex].seqno);
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusedIndex = Math.min(checkpoints.length - 1, focusedIndex + 1);
        scrollToCheckpoint(checkpoints[focusedIndex].seqno);
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < checkpoints.length) {
          if (event.shiftKey) {
            onCheckpointDoubleClick?.(checkpoints[focusedIndex]);
          } else {
            onCheckpointClick?.(checkpoints[focusedIndex]);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        if (previewSeqno !== null) {
          onExitPreview?.();
        }
        break;
      case 'Home':
        event.preventDefault();
        focusedIndex = 0;
        scrollToCheckpoint(checkpoints[0].seqno);
        break;
      case 'End':
        event.preventDefault();
        focusedIndex = checkpoints.length - 1;
        scrollToCheckpoint(checkpoints[checkpoints.length - 1].seqno);
        break;
    }
  }

  // Detect dark mode for fallback colors
  let isDarkMode = $state(true);

  $effect(() => {
    if (typeof window !== 'undefined') {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  });

  function getNodeColor(type: CheckpointComponentType): string {
    // Return CSS var reference; browser will use themeStore-set value or default
    return CHECKPOINT_COLORS[type] ?? CHECKPOINT_COLORS['system-snapshot'];
  }

  function getNodeColorFallback(type: CheckpointComponentType): string {
    // SSR-safe fallback when CSS vars not yet applied
    return getCheckpointColor(type, isDarkMode);
  }

  function getNodeSymbol(status: CheckpointStatus): string {
    return CHECKPOINT_STATUS_SYMBOLS[status] ?? CHECKPOINT_STATUS_SYMBOLS.committed;
  }

  function isCheckpointActive(checkpoint: Checkpoint): boolean {
    return checkpoint.seqno === currentSeqno;
  }

  function isCheckpointPreview(checkpoint: Checkpoint): boolean {
    return previewSeqno !== null && checkpoint.seqno === previewSeqno;
  }

  // Scroll button handlers
  function scrollLeft() {
    if (!trackRef) return;
    trackRef.scrollBy({ left: -200, behavior: 'smooth' });
  }

  function scrollRight() {
    if (!trackRef) return;
    trackRef.scrollBy({ left: 200, behavior: 'smooth' });
  }

  // Initialize focused index to current checkpoint
  $effect(() => {
    if (focusedIndex === -1 && checkpoints.length > 0) {
      const currentIndex = checkpoints.findIndex((c) => c.seqno === currentSeqno);
      focusedIndex = currentIndex >= 0 ? currentIndex : 0;
    }
  });
</script>

<div
  class="checkpoint-bar"
  role="slider"
  aria-roledescription="checkpoint timeline"
  aria-label={ariaLabel}
  aria-valuemin={minSeqno}
  aria-valuemax={maxSeqno}
  aria-valuenow={displaySeqno}
  aria-orientation="horizontal"
  tabindex="0"
  onkeydown={handleKeyDown}
  style="--checkpoint-bar-height: {CHECKPOINT_BAR_HEIGHT}px;"
>
  <!-- Scroll Left Indicator -->
  <button
    class="scroll-indicator scroll-left"
    class:visible={canScrollLeft}
    onclick={scrollLeft}
    aria-label="View older checkpoints"
  >
    ◀
  </button>

  <!-- Timeline Track -->
  <div
    id="checkpoint-track"
    class="timeline-track"
    bind:this={trackRef}
    onscroll={updateScrollIndicators}
    role="list"
    aria-label="Checkpoints"
  >
    <!-- Connecting Line -->
    <div class="timeline-line"></div>

    <!-- Checkpoint Nodes -->
    {#each checkpoints as checkpoint, i (checkpoint.seqno)}
      {@const isActive = isCheckpointActive(checkpoint)}
      {@const isPreview = isCheckpointPreview(checkpoint)}
      {@const isFocused = focusedIndex === i}
      {@const colorVar = getNodeColor(checkpoint.componentType)}
      {@const colorFallback = getNodeColorFallback(checkpoint.componentType)}

      <button
        class="checkpoint-node"
        class:active={isActive}
        class:preview={isPreview}
        class:focused={isFocused}
        style="--node-color: {colorVar}; --node-fallback: {colorFallback}; --node-size: {isActive || isPreview
          ? CHECKPOINT_NODE_ACTIVE_SIZE
          : CHECKPOINT_NODE_SIZE}px;"
        onclick={() => handleCheckpointClick(checkpoint, i)}
        ondblclick={() => handleCheckpointDoubleClick(checkpoint)}
        aria-describedby="tooltip-{checkpoint.seqno}"
        aria-label="Checkpoint {checkpoint.seqno}: {checkpoint.component} {checkpoint.version
          ? `v${checkpoint.version.to}`
          : ''}, {checkpoint.description}"
        aria-current={isActive ? 'true' : undefined}
        tabindex={isFocused ? 0 : -1}
      >
        <span class="node-symbol" style="color: var(--node-color, var(--node-fallback))">
          {getNodeSymbol(checkpoint.status)}
        </span>

        <!-- Tooltip -->
        <div id="tooltip-{checkpoint.seqno}" class="checkpoint-tooltip" role="tooltip">
          <div class="tooltip-header">
            Checkpoint {checkpoint.seqno}
            {#if checkpoint.version}
              <span class="version">v{checkpoint.version.to}</span>
            {/if}
          </div>
          <div class="tooltip-component">{checkpoint.component}</div>
          <div class="tooltip-desc">{checkpoint.description}</div>
          {#if checkpoint.author}
            <div class="tooltip-meta">by {checkpoint.author}</div>
          {/if}
        </div>
      </button>
    {/each}

    <!-- Now Handle (drag-to-scrub: future enhancement) -->
    <div class="now-handle" aria-label="Current position">
      <span class="now-label">▶</span>
    </div>
  </div>

  <!-- Scroll Right Indicator -->
  <button
    class="scroll-indicator scroll-right"
    class:visible={canScrollRight}
    onclick={scrollRight}
    aria-label="View newer checkpoints"
  >
    ▶
  </button>

  <!-- Meta Display -->
  <div class="timeline-meta">
    {#if previewSeqno}
      <span class="preview-badge">Previewing checkpoint {previewSeqno}</span>
    {:else}
      <span class="current-badge">Checkpoint {currentSeqno}</span>
    {/if}
  </div>
</div>

<style>
  .checkpoint-bar {
    display: flex;
    align-items: center;
    height: var(--checkpoint-bar-height, 48px);
    background: rgba(26, 26, 26, 0.95);
    border-top: 1px solid rgba(184, 115, 51, 0.2);
    padding: 0 0.5rem;
    gap: 0.5rem;
    user-select: none;
    outline: none;
  }

  .checkpoint-bar:focus-visible {
    outline: 2px solid var(--color-accent, #b87333);
    outline-offset: -2px;
  }

  .scroll-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    color: rgba(160, 152, 128, 0.5);
    font-size: 10px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 150ms ease, color 150ms ease;
    flex-shrink: 0;
  }

  .scroll-indicator.visible {
    opacity: 1;
  }

  .scroll-indicator:hover {
    color: var(--color-accent, #b87333);
  }

  .timeline-track {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 0.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
    position: relative;
    padding: 0 0.5rem;
  }

  .timeline-track::-webkit-scrollbar {
    display: none;
  }

  .timeline-line {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 2px;
    background: rgba(184, 115, 51, 0.3);
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 0;
  }

  .checkpoint-node {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--node-size, 12px);
    height: var(--node-size, 12px);
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 1;
    flex-shrink: 0;
    padding: 4px;
    margin: -4px;
    border-radius: 50%;
    transition: transform 150ms ease;
  }

  .checkpoint-node:hover,
  .checkpoint-node.focused {
    transform: scale(1.3);
  }

  .checkpoint-node.active {
    transform: scale(1.5);
  }

  .checkpoint-node.active::after {
    content: '';
    position: absolute;
    inset: -4px;
    border: 2px solid var(--node-color, var(--node-fallback, #b87333));
    border-radius: 50%;
    opacity: 0.5;
  }

  .checkpoint-node.preview {
    transform: scale(1.5);
    box-shadow: 0 0 8px var(--node-color, var(--node-fallback, #b87333));
  }

  .node-symbol {
    font-size: var(--node-size, 12px);
    line-height: 1;
    pointer-events: none;
  }

  /* Tooltip */
  .checkpoint-tooltip {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%) scale(0.95);
    background: rgba(34, 34, 34, 0.98);
    border: 1px solid rgba(184, 115, 51, 0.3);
    border-radius: 6px;
    padding: 0.75rem 1rem;
    min-width: 200px;
    max-width: 280px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 150ms ease, transform 150ms ease, visibility 150ms ease;
    pointer-events: none;
    z-index: 100;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .checkpoint-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(184, 115, 51, 0.3);
  }

  .checkpoint-node:hover .checkpoint-tooltip,
  .checkpoint-node.focused .checkpoint-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) scale(1);
  }

  .tooltip-header {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-primary, #e8e0d0);
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .version {
    font-size: 0.65rem;
    color: var(--color-accent, #b87333);
    font-weight: 500;
  }

  .tooltip-component {
    font-size: 0.7rem;
    color: var(--color-text-secondary, #a09880);
    font-family: var(--font-mono, monospace);
    margin-bottom: 0.25rem;
  }

  .tooltip-desc {
    font-size: 0.75rem;
    color: var(--color-text-primary, #e8e0d0);
    line-height: 1.4;
  }

  .tooltip-meta {
    font-size: 0.65rem;
    color: var(--color-text-muted, #808080);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Now Handle */
  .now-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-left: 0.5rem;
    flex-shrink: 0;
    cursor: grab;
    color: var(--color-accent, #b87333);
  }

  .now-label {
    font-size: 12px;
  }

  /* Meta Display */
  .timeline-meta {
    display: flex;
    align-items: center;
    padding-left: 0.75rem;
    border-left: 1px solid rgba(184, 115, 51, 0.2);
    margin-left: 0.25rem;
    flex-shrink: 0;
  }

  .current-badge,
  .preview-badge {
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .current-badge {
    color: var(--color-text-secondary, #a09880);
  }

  .preview-badge {
    color: var(--color-accent, #b87333);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  /* High Contrast Mode */
  @media (prefers-contrast: high) {
    .checkpoint-bar {
      background: #000;
      border-top-color: #fff;
    }

    .node-symbol {
      color: #fff !important;
    }

    .checkpoint-node.active::after {
      border-color: #fff;
    }

    .timeline-line {
      background: #666;
    }
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .scroll-indicator,
    .checkpoint-node,
    .checkpoint-tooltip {
      transition: none;
    }

    .preview-badge {
      animation: none;
    }

    .timeline-track {
      scroll-behavior: auto;
    }
  }
</style>
