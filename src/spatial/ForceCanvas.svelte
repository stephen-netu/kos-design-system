<script lang="ts">
  // ForceCanvas — d3-force lifecycle runner
  // Drives ForceSimulation (implements Lifecycle) via requestAnimationFrame.
  // Renders via CanvasRenderContext (2D canvas backend).
  //
  // NOTE: Heavy stateful component (canvas + RAF loop). Use {#if} to fully
  // mount/unmount — visibility:hidden would keep the rAF loop running.
  //
  // S-02: deterministic sim init by node index.
  // S-05: simulation bounded by alphaDecay; RAF cancelled on destroy.

  import { onMount, onDestroy, untrack } from 'svelte';
  import type { ForceCell, ForceCanvasConfig, CellPosition } from './force-canvas-types.js';
  import { ForceSimulation } from './ForceSimulation.svelte.js';
  import { CanvasRenderContext } from '../s0-lifecycle/CanvasRenderContext.js';
  import type { ConstraintContext } from '../s0-lifecycle/ConstraintContext.js';
  import type { LayoutContext } from '../s0-lifecycle/LayoutContext.js';

  interface Props {
    cells: ForceCell[];
    width: number;
    height: number;
    config?: ForceCanvasConfig;
    active?: boolean;
    onPositionsUpdate?: (positions: CellPosition[]) => void;
    onCellClick?: (cell: ForceCell) => void;
    tick?: number;
  }

  export type ForceCanvasProps = Props;

  let {
    cells,
    width,
    height,
    config,
    active = true,
    onPositionsUpdate,
    onCellClick,
    tick = 0,
  }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let sim: ForceSimulation | null = $state(null);
  let renderCtx: CanvasRenderContext | null = null;
  let rafId: number | null = null;

  // ── Initialize + sync cells/config changes → simulation ──────────────────
  $effect(() => {
    cells; config;
    untrack(() => {
      sim?.stop();
      sim = new ForceSimulation(cells, config);
      if (canvas) runLayout();
    });
  });

  // ── Re-layout on dimension changes ──────────────────────────────────────

  $effect(() => {
    if (canvas) runLayout();
  });

  // ── Notify LodRenderer of position changes (backward compat) ────────────

  $effect(() => {
      if (sim && sim.positions.length > 0) {
      onPositionsUpdate?.(sim.positions);
    }
  });

  // ── Lifecycle phases ─────────────────────────────────────────────────────

  function runLayout() {
    if (!canvas || !active || !sim) return;

    // Phase 1: constrain (advisory only — canvas is given explicit width/height)
    const constraintCtx: ConstraintContext = {
      available: {
        width: { min: width, preferred: width, max: width },
        height: { min: height, preferred: height, max: height }
      },
      scale: window.devicePixelRatio ?? 1,
      constrain: (w: number, h: number) => ({
        width: { min: w, preferred: w, max: w },
        height: { min: h, preferred: h, max: h }
      }),
      childConstraint: (_key: string) => undefined
    };
    sim.constrain(constraintCtx);

    // Phase 2: layout — tell sim its bounds
    const layoutCtx: LayoutContext = {
      bounds: { x: 0, y: 0, width, height },
      requestRepaint: () => {},
      requestRepaintAt: (_delayMs: number) => {},
      childBounds: (_key: string) => undefined,
      viewportSize: { width, height }
    };
    sim.layout(layoutCtx);

    // (Re-)create render context with current canvas dimensions
    renderCtx = new CanvasRenderContext(canvas);
    startRaf();
  }

  function startRaf() {
    if (rafId !== null) return;
    function frame() {
      if (!renderCtx || !sim) return;
      sim?.render(renderCtx);
      renderCtx.flush();
      rafId = requestAnimationFrame(frame);
    }
    const reduceMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      if (renderCtx && sim) {
        sim.render(renderCtx);
        renderCtx.flush();
      }
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  // ── Click → interact phase ───────────────────────────────────────────────

  function handleClick(e: MouseEvent) {
    if (!sim) return;
    for (const pos of sim.positions) {
      const r = pos.radius + 4;
      const dx = e.offsetX - pos.x;
      const dy = e.offsetY - pos.y;
      if (dx * dx + dy * dy <= r * r) {
        onCellClick?.(pos.cell);
        return;
      }
    }
  }

  onMount(() => { if (active) runLayout(); });
  onDestroy(() => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    sim?.stop();
  });
</script>

<canvas
  bind:this={canvas}
  {width}
  {height}
  style:display={active ? 'block' : 'none'}
  onclick={handleClick}
  aria-label="Force simulation canvas"
></canvas>
