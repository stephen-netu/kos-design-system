<script lang="ts">
  // CheckpointPill.svelte — Collapsible checkpoint indicator
  // ADR: ui-timeline-checkpoint-bar-001 (Phase 1: Pill Component)
  // Svelte 5 runes pattern — collapsed by default, expands to full timeline

  import type { Checkpoint } from './checkpoint-types';
  import { getCheckpointColor } from './checkpoint-types';
  import CheckpointBar from './CheckpointBar.svelte';

  interface Props {
    checkpoints: Checkpoint[];
    currentSeqno: number;
    previewSeqno?: number | null;
    onCheckpointClick?: (checkpoint: Checkpoint) => void;
    onCheckpointDoubleClick?: (checkpoint: Checkpoint) => void;
    onExitPreview?: () => void;
    'aria-label'?: string;
  }

  let {
    checkpoints,
    currentSeqno,
    previewSeqno = null,
    onCheckpointClick,
    onCheckpointDoubleClick,
    onExitPreview,
    'aria-label': ariaLabel = 'Checkpoint navigation. Click to expand timeline.',
  }: Props = $props();

  // Collapsed state (default: true for minimal footprint)
  let isExpanded = $state(false);

  // Current checkpoint for display
  let currentCheckpoint = $derived(
    checkpoints.find((c) => c.seqno === currentSeqno) ?? checkpoints[checkpoints.length - 1]
  );

  // Display checkpoint (preview takes precedence)
  let displayCheckpoint = $derived(
    previewSeqno !== null
      ? (checkpoints.find((c) => c.seqno === previewSeqno) ?? currentCheckpoint)
      : currentCheckpoint
  );

  // Is in preview mode
  let isPreview = $derived(previewSeqno !== null);

  // Color for current component type
  let componentColor = $derived(
    displayCheckpoint ? getCheckpointColor(displayCheckpoint.componentType, true) : '#b87333'
  );

  // Toggle expanded state
  function toggleExpanded() {
    isExpanded = !isExpanded;
  }

  // Collapse when clicking outside (handled by parent or escape key)
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isExpanded) {
      event.preventDefault();
      isExpanded = false;
      // Also exit preview if active
      if (previewSeqno !== null) {
        onExitPreview?.();
      }
    }
  }

  // Handle checkpoint selection from expanded bar
  function handleCheckpointClick(checkpoint: Checkpoint) {
    onCheckpointClick?.(checkpoint);
    // Keep expanded after selection for better UX
  }

  // Handle checkpoint activation (double click/Shift+Enter)
  function handleCheckpointActivate(checkpoint: Checkpoint) {
    onCheckpointDoubleClick?.(checkpoint);
    // Collapse after activation
    isExpanded = false;
  }
</script>

<div
  class="checkpoint-pill"
  class:expanded={isExpanded}
  class:preview={isPreview}
  role="button"
  tabindex="0"
  aria-label={ariaLabel}
  aria-expanded={isExpanded}
  onclick={toggleExpanded}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpanded();
    } else {
      handleKeyDown(e);
    }
  }}
>
  {#if !isExpanded}
    <!-- Collapsed Pill -->
    <div class="pill-collapsed">
      <span class="pill-icon" style="color: {componentColor}">
        {#if isPreview}
          ◎
        {:else}
          ◉
        {/if}
      </span>
      <span class="pill-seqno">
        {displayCheckpoint?.seqno ?? currentSeqno}
      </span>
      <span class="pill-arrow">▼</span>
    </div>
  {:else}
    <!-- Expanded Bar -->
    <div class="pill-expanded">
      <div class="pill-header">
        <span class="pill-label">Checkpoint Timeline</span>
        <button
          class="pill-close"
          onclick={(e) => {
            e.stopPropagation();
            isExpanded = false;
          }}
          aria-label="Collapse timeline"
        >
          ▲
        </button>
      </div>
      <div class="pill-content" onclick={(e) => e.stopPropagation()}>
        <CheckpointBar
          {checkpoints}
          {currentSeqno}
          {previewSeqno}
          onCheckpointClick={handleCheckpointClick}
          onCheckpointDoubleClick={handleCheckpointActivate}
          {onExitPreview}
          aria-label="Checkpoint timeline navigation"
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .checkpoint-pill {
    display: inline-flex;
    align-items: center;
    background: rgba(26, 26, 26, 0.95);
    border: 1px solid rgba(184, 115, 51, 0.3);
    border-radius: 4px;
    cursor: pointer;
    transition: all 200ms ease;
    user-select: none;
    outline: none;
  }

  .checkpoint-pill:hover {
    border-color: rgba(184, 115, 51, 0.5);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .checkpoint-pill:focus-visible {
    outline: 2px solid var(--color-accent, #b87333);
    outline-offset: 2px;
  }

  .checkpoint-pill.preview {
    border-color: rgba(184, 115, 51, 0.6);
    animation: pulse-border 2s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(184, 115, 51, 0.2);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(184, 115, 51, 0.1);
    }
  }

  /* Collapsed State */
  .pill-collapsed {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    height: 28px;
  }

  .pill-icon {
    font-size: 12px;
    line-height: 1;
  }

  .pill-seqno {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-primary, #e8e0d0);
    font-family: var(--font-mono, monospace);
    min-width: 2ch;
    text-align: center;
  }

  .pill-arrow {
    font-size: 8px;
    color: var(--color-text-muted, #808080);
    transition: transform 200ms ease;
  }

  .checkpoint-pill:hover .pill-arrow {
    color: var(--color-accent, #b87333);
  }

  /* Expanded State */
  .checkpoint-pill.expanded {
    display: block;
    cursor: default;
    border-radius: 6px;
    min-width: 320px;
  }

  .pill-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid rgba(184, 115, 51, 0.2);
  }

  .pill-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--color-text-secondary, #a09880);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pill-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: transparent;
    border: none;
    color: var(--color-text-muted, #808080);
    font-size: 10px;
    cursor: pointer;
    border-radius: 3px;
    transition: all 150ms ease;
  }

  .pill-close:hover {
    background: rgba(184, 115, 51, 0.1);
    color: var(--color-accent, #b87333);
  }

  .pill-close:focus-visible {
    outline: 1px solid var(--color-accent, #b87333);
  }

  .pill-content {
    padding: 0.5rem;
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .checkpoint-pill,
    .pill-arrow,
    .pill-close {
      transition: none;
    }

    .checkpoint-pill.preview {
      animation: none;
    }
  }

  /* High Contrast */
  @media (prefers-contrast: high) {
    .checkpoint-pill {
      border-color: #fff;
    }

    .checkpoint-pill:hover {
      border-color: #fff;
    }

    .pill-seqno {
      color: #fff;
    }
  }
</style>
