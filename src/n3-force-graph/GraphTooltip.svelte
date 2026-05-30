<script lang="ts">
  // N3 GraphTooltip — Floating tooltip positioned by graph hover events
  // wt-800: Slot-based content, positioned near hovered node
  // Zero domain knowledge — any content can be rendered inside
  //
  // S-05: visibility toggled by prop, no timers

  import type { Snippet } from 'svelte';

  interface Props {
    /** Whether the tooltip is visible */
    visible?: boolean;
    /** Screen X position (from graph coordinate transform) */
    x?: number;
    /** Screen Y position */
    y?: number;
    /** Offset from anchor point. Default 12. */
    offset?: number;
    /** Max width in px. Default 280. */
    maxWidth?: number;
    /** Content slot */
    children?: Snippet;
  }

  let {
    visible = false,
    x = 0,
    y = 0,
    offset = 12,
    maxWidth = 280,
    children,
  }: Props = $props();

  // Keep tooltip within viewport
  let tooltipEl: HTMLDivElement | undefined = $state();

  const style = $derived.by(() => {
    // Position below and to the right of the anchor by default
    let left = x + offset;
    let top = y + offset;

    // Viewport clamping (approximate — exact requires measuring after render)
    if (typeof window !== 'undefined') {
      if (left + maxWidth > window.innerWidth - 16) {
        left = x - maxWidth - offset;
      }
      if (top + 120 > window.innerHeight - 16) {
        top = y - 120 - offset;
      }
    }

    return `left: ${left}px; top: ${top}px; max-width: ${maxWidth}px;`;
  });
</script>

{#if visible && children}
  <div
    bind:this={tooltipEl}
    class="n3-graph-tooltip"
    style={style}
    role="tooltip"
  >
    {@render children()}
  </div>
{/if}

<style>
  .n3-graph-tooltip {
    position: fixed;
    z-index: 1000;
    pointer-events: none;

    background: var(--bg-elevated, #2a2a2a);
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    border-radius: var(--radius-sm, 6px);
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);

    color: var(--text-primary, #f2efe9);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.75rem;
    line-height: 1.4;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

    /* Fade in */
    animation: n3-tooltip-fade 120ms ease-out;
  }

  @keyframes n3-tooltip-fade {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
