<script lang="ts">
  import type { EdgeDefinition } from './types';

  interface NodeEdgeProps {
    edge?: EdgeDefinition;
    sourcePosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
    selected?: boolean;
    creating?: boolean;
    onselect?: (edgeId: string) => void;
    ondelete?: (edgeId: string) => void;
  }

  let {
    edge,
    sourcePosition,
    targetPosition,
    selected = false,
    creating = false,
    onselect,
    ondelete,
  }: NodeEdgeProps = $props();

  let hovered = $state(false);

  let d = $derived.by(() => {
    const dx = Math.abs(targetPosition.x - sourcePosition.x);
    const offset = Math.min(dx * 0.5, 150);
    return `M ${sourcePosition.x} ${sourcePosition.y} C ${sourcePosition.x + offset} ${sourcePosition.y}, ${targetPosition.x - offset} ${targetPosition.y}, ${targetPosition.x} ${targetPosition.y}`;
  });

  let midpoint = $derived({
    x: (sourcePosition.x + targetPosition.x) / 2,
    y: (sourcePosition.y + targetPosition.y) / 2,
  });

  let showDelete = $derived(hovered && !creating && edge !== undefined);

  function handlePathClick(e: MouseEvent) {
    e.stopPropagation();
    if (edge && onselect) {
      onselect(edge.id);
    }
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (edge && ondelete) {
      ondelete(edge.id);
    }
  }
</script>

<g
  class="n0-edge"
  class:is-selected={selected}
  class:is-creating={creating}
  class:is-hovered={hovered}
  role="graphics-symbol"
>
  <!-- Invisible wide hit-area path for hover/click detection -->
  <path
    d={d}
    class="n0-edge-hitarea"
    onpointerenter={() => hovered = true}
    onpointerleave={() => hovered = false}
    onclick={handlePathClick}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePathClick(e as unknown as MouseEvent); }}
    role="button"
    tabindex="-1"
    aria-label="Select edge"
  />

  <!-- Visible bezier path -->
  <path
    d={d}
    class="n0-edge-line"
    pointer-events="none"
  />

  <!-- Delete button at midpoint (shown on hover) -->
  {#if showDelete}
    <g
      class="n0-edge-delete"
      transform="translate({midpoint.x},{midpoint.y})"
      onclick={handleDelete}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDelete(e as unknown as MouseEvent); }}
      role="button"
      tabindex="-1"
    >
      <circle r="8" class="n0-edge-delete-bg" />
      <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" class="n0-edge-delete-x" />
      <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" class="n0-edge-delete-x" />
    </g>
  {/if}
</g>

<style>
  .n0-edge-hitarea {
    fill: none;
    stroke: transparent;
    stroke-width: 12px;
    cursor: pointer;
  }

  .n0-edge-line {
    fill: none;
    stroke: var(--n0-edge-color);
    stroke-width: var(--n0-edge-width, 2px);
    transition: stroke 0.15s ease, stroke-width 0.15s ease;
  }

  .n0-edge.is-hovered .n0-edge-line {
    stroke: var(--n0-edge-color-hover);
    stroke-width: 3px;
  }

  .n0-edge.is-selected .n0-edge-line {
    stroke: var(--n0-edge-color-hover);
    stroke-width: 3px;
  }

  .n0-edge.is-creating .n0-edge-line {
    stroke: var(--n0-edge-color-creating);
    stroke-dasharray: 8 4;
  }

  .n0-edge-delete {
    cursor: pointer;
  }

  .n0-edge-delete-bg {
    fill: var(--n0-node-bg, #222);
    stroke: var(--n0-edge-color-hover);
    stroke-width: 1.5px;
  }

  .n0-edge-delete-x {
    stroke: var(--n0-edge-color-hover);
    stroke-width: 1.5px;
    stroke-linecap: round;
  }

  .n0-edge-delete:hover .n0-edge-delete-bg {
    fill: #c0392b;
    stroke: #c0392b;
  }

  .n0-edge-delete:hover .n0-edge-delete-x {
    stroke: #fff;
  }
</style>
