<script lang="ts">
  // BspTilingCanvas — Amethyst/i3-style tiling with Lifecycle-driven rendering
  // Canvas draws zone fills behind, DOM divs render content on top
  //
  // Lifecycle phases:
  //   constrain + layout → BspTilingSimulation
  //   interact → hit-testing via InteractionContext
  //   render → CanvasRenderContext (zone backgrounds)

  import { onMount } from 'svelte';
  import { untrack } from 'svelte';
  import { BspTilingSimulation } from './BspTilingSimulation.svelte.js';
  import { CanvasRenderContext } from '../s0-lifecycle/CanvasRenderContext.js';
  import type { ConstraintContext } from '../s0-lifecycle/ConstraintContext.js';
  import type { LayoutContext } from '../s0-lifecycle/LayoutContext.js';
  import type { InteractionContext } from '../s0-lifecycle/InteractionContext.js';
  import type { TilingCardInput } from './BspTilingSimulation.svelte.js';

  interface Props {
    cards: TilingCardInput[];
    containerWidth: number;
    containerHeight: number;
    children: import('svelte').Snippet;
  }

  export type BspTilingCanvasProps = Props;

  let {
    cards,
    containerWidth,
    containerHeight,
    children,
  }: Props = $props();

  // ── Simulation (reactive) ────────────────────────────────────────────────

  let sim: BspTilingSimulation | null = $state(null);

  $effect(() => {
    const c = cards;
    const w = containerWidth;
    const h = containerHeight;
    untrack(() => {
      sim = new BspTilingSimulation(c, w, h);
      runLayout();
      paintCanvas();
    });
  });

  // ── Canvas + Lifecycle contexts ───────────────────────────────────────────

  let canvasEl: HTMLCanvasElement | undefined = $state();
  let canvasCtx: CanvasRenderContext | null = null;

  function makeConstraintContext(): ConstraintContext {
    return {
      available: {
        width: { min: 0, preferred: containerWidth, max: containerWidth },
        height: { min: 0, preferred: containerHeight, max: containerHeight },
      },
      scale: 1,
      constrain(w: number, h: number) {
        return {
          width: { min: w, preferred: w, max: w },
          height: { min: h, preferred: h, max: h },
        };
      },
      childConstraint(): undefined { return undefined; },
    };
  }

  function makeLayoutContext(): LayoutContext {
    return {
      bounds: { x: 0, y: 0, width: containerWidth, height: containerHeight },
      requestRepaint() { paintCanvas(); },
      requestRepaintAt() { paintCanvas(); },
      childBounds(): undefined { return undefined; },
      viewportSize: { width: containerWidth, height: containerHeight },
    };
  }

  function runLayout(): void {
    if (!sim) return;
    const cc = makeConstraintContext();
    const lc = makeLayoutContext();
    sim.constrain(cc);
    sim.layout(lc);
  }

  function makeInteractionContext(e: PointerEvent, target: HTMLElement): InteractionContext {
    const rect = target.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    let wasConsumed = false;
    return {
      event: {
        type: e.type,
        nativeEvent: e,
        consumed: wasConsumed,
        position: pos,
        modifiers: {
          shift: e.shiftKey,
          ctrl: e.ctrlKey,
          alt: e.altKey,
          meta: e.metaKey,
        },
      },
      consume() { wasConsumed = true; },
      requestFocus() {},
      releaseFocus() {},
      requestSoftKeyboard() {},
    };
  }

  function paintCanvas(): void {
    if (!canvasCtx || !sim) return;
    sim.render(canvasCtx);
    canvasCtx.flush();
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  function handlePointerDown(e: PointerEvent): void {
    if (!sim) return;
    const target = e.currentTarget as HTMLElement;
    const ctx = makeInteractionContext(e, target);
    sim.interact(ctx);
  }

  onMount(() => {
    if (!canvasEl) return;
    const dpr = window.devicePixelRatio ?? 1;
    canvasEl.width = containerWidth * dpr;
    canvasEl.height = containerHeight * dpr;
    canvasEl.style.width = `${containerWidth}px`;
    canvasEl.style.height = `${containerHeight}px`;
    const ctx2d = canvasEl.getContext('2d');
    if (ctx2d) {
      ctx2d.scale(dpr, dpr);
    }
    canvasCtx = new CanvasRenderContext(canvasEl);
  });
</script>

<div class="bsp-tiling-canvas" style:width="{containerWidth}px" style:height="{containerHeight}px">
  <canvas
    bind:this={canvasEl}
    class="tiling-canvas-bg"
    style:pointer-events="none"
    aria-hidden="true"
  ></canvas>

  {#each (sim?.positions ?? []) as zone (zone.cardId)}
    <div
      class="tiling-slot"
      style:left="{zone.x}px"
      style:top="{zone.y}px"
      style:width="{zone.width}px"
      style:height="{zone.height}px"
    >
      {@render children()}
    </div>
  {/each}
</div>

<style>
  .bsp-tiling-canvas {
    position: relative;
    overflow: hidden;
  }

  .tiling-canvas-bg {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
  }

  .tiling-slot {
    position: absolute;
    overflow: auto;
    background: transparent;
    pointer-events: auto;
    z-index: 1;
    box-shadow: inset 0 0 0 1px var(--color-border, #333);
  }

  .tiling-slot::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  .tiling-slot::-webkit-scrollbar-thumb {
    background: var(--color-text-muted, #706858);
    border-radius: 2px;
  }
</style>
