<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Transform } from './types';

  interface NodeCanvasProps {
    transform?: Transform;
    ontransform?: (t: Transform) => void;
    gridVisible?: boolean;
    children: Snippet;
  }

  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 3.0;
  const ZOOM_SENSITIVITY = 0.001;

  let {
    transform: initialTransform,
    ontransform,
    gridVisible = true,
    children,
  }: NodeCanvasProps = $props();

  // svelte-ignore state_referenced_locally -- intentional: transform is initialized from prop then managed locally
  let transform: Transform = $state(
    initialTransform ?? { x: 0, y: 0, scale: 1 }
  );

  let isPanning = $state(false);
  let panOrigin = $state({ x: 0, y: 0 });
  let transformAtPanStart = $state({ x: 0, y: 0 });

  let svgEl: SVGSVGElement | undefined = $state(undefined);

  // Grid size from token (matches --n0-canvas-grid-size default)
  const GRID_SIZE = 20;
  let scaledGridSize = $derived(GRID_SIZE * transform.scale);

  function notifyTransform() {
    ontransform?.(transform);
  }

  function onPointerDown(e: PointerEvent) {
    // Only pan on primary button, only when clicking the SVG background
    if (e.button !== 0) return;
    const target = e.target as Element;
    if (target !== svgEl && target.id !== 'n0-canvas-bg') return;

    isPanning = true;
    panOrigin = { x: e.clientX, y: e.clientY };
    transformAtPanStart = { x: transform.x, y: transform.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: PointerEvent) {
    if (!isPanning) return;
    const dx = e.clientX - panOrigin.x;
    const dy = e.clientY - panOrigin.y;
    transform = {
      ...transform,
      x: transformAtPanStart.x + dx,
      y: transformAtPanStart.y + dy,
    };
    notifyTransform();
  }

  function onPointerUp(e: PointerEvent) {
    if (!isPanning) return;
    isPanning = false;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    if (!svgEl) return;

    const rect = svgEl.getBoundingClientRect();
    // Cursor position relative to the SVG element
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const newScale = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, transform.scale * (1 + delta))
    );
    const scaleRatio = newScale / transform.scale;

    // Zoom centered on cursor: adjust translation so the point under the
    // cursor stays fixed after scaling.
    const newX = cursorX - scaleRatio * (cursorX - transform.x);
    const newY = cursorY - scaleRatio * (cursorY - transform.y);

    transform = { x: newX, y: newY, scale: newScale };
    notifyTransform();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
  bind:this={svgEl}
  class="n0-canvas"
  class:is-panning={isPanning}
  role="application"
  aria-label="Graph canvas"
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onwheel={onWheel}
>
  <defs>
    {#if gridVisible}
      <pattern
        id="n0-grid-pattern"
        width={scaledGridSize}
        height={scaledGridSize}
        patternUnits="userSpaceOnUse"
        x={transform.x % scaledGridSize}
        y={transform.y % scaledGridSize}
      >
        <line
          x1={scaledGridSize}
          y1="0"
          x2={scaledGridSize}
          y2={scaledGridSize}
          class="n0-grid-line"
        />
        <line
          x1="0"
          y1={scaledGridSize}
          x2={scaledGridSize}
          y2={scaledGridSize}
          class="n0-grid-line"
        />
      </pattern>
    {/if}
  </defs>

  <!-- Background fill -->
  <rect
    id="n0-canvas-bg"
    width="100%"
    height="100%"
    class="n0-canvas-background"
  />

  <!-- Grid overlay -->
  {#if gridVisible}
    <rect
      width="100%"
      height="100%"
      fill="url(#n0-grid-pattern)"
      pointer-events="none"
    />
  {/if}

  <!-- Transformed content layer -->
  <g transform="translate({transform.x},{transform.y}) scale({transform.scale})">
    {@render children()}
  </g>
</svg>

<style>
  .n0-canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .n0-canvas.is-panning {
    cursor: grabbing;
  }

  .n0-canvas-background {
    fill: var(--n0-canvas-bg);
  }

  .n0-grid-line {
    stroke: var(--n0-canvas-grid);
    stroke-width: 1;
  }
</style>
