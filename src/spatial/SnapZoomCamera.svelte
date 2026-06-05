<script lang="ts">
  // SnapZoomCamera — viewport camera with snap-zoom transitions
  // Delegates all zoom/pan/snap logic to CameraController (Lifecycle)
  // Renders via CSS transforms on a wrapper div

  import type { Snippet } from 'svelte';
  import { onMount, onDestroy } from 'svelte';
  import { CameraController } from './CameraController.svelte.js';
  import type { CameraState, SnapZoomTarget, CameraConfig } from './camera-types.js';
  import type { InteractionContext } from '../s0-lifecycle/InteractionContext.js';

  interface Props {
    width: number;
    height: number;
    config?: CameraConfig;
    children: Snippet<[CameraState]>;
    onCameraChange?: (state: CameraState) => void;
  }

  let {
    width,
    height,
    config,
    children,
    onCameraChange,
  }: Props = $props();

  const controller = $state(new CameraController(width, height, config));
  const cameraState: CameraState = $derived(controller.getCameraState());

  $effect(() => {
    onCameraChange?.(cameraState);
  });

  // ── Contexts for lifecycle phases ─────────────────────────────────────────

  function runPhases(): void {
    controller.constrain({
      available: {
        width: { min: width, preferred: width, max: width },
        height: { min: height, preferred: height, max: height },
      },
      scale: 1,
      constrain(w: number, h: number) {
        return {
          width: { min: w, preferred: w, max: w },
          height: { min: h, preferred: h, max: h },
        };
      },
      childConstraint(): undefined { return undefined; },
    });

    controller.layout({
      bounds: { x: 0, y: 0, width, height },
      requestRepaint() {},
      requestRepaintAt() {},
      childBounds(): undefined { return undefined; },
      viewportSize: { width, height },
    });
  }

  onMount(() => {
    runPhases();
  });

  // ── Interaction forwarding ────────────────────────────────────────────────

  let wheelRafId: number | null = null;
  let pendingWheelEvent: WheelEvent | null = null;

  onDestroy(() => {
    controller.stop();
    if (wheelRafId !== null) cancelAnimationFrame(wheelRafId);
  });

  function getEventOffset(e: PointerEvent | WheelEvent): { x: number; y: number } {
    if (e.type === 'pointerdown' || e.type === 'pointermove' || e.type === 'pointerup' || e.type === 'mousedown' || e.type === 'mousemove' || e.type === 'mouseup' || e.type === 'click') {
      const pe = e as PointerEvent;
      return { x: pe.offsetX, y: pe.offsetY };
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function makeInteractionContext(e: PointerEvent | WheelEvent): InteractionContext {
    const type = e.type;
    let wasConsumed = false;
    const offset = getEventOffset(e);
    const posX = offset.x;
    const posY = offset.y;
    return {
      event: {
        type,
        nativeEvent: e,
        consumed: wasConsumed,
        position: { x: posX, y: posY },
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

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    pendingWheelEvent = e;
    if (wheelRafId !== null) return;
    wheelRafId = requestAnimationFrame(() => {
      wheelRafId = null;
      const evt = pendingWheelEvent;
      pendingWheelEvent = null;
      if (evt) {
        const ctx = makeInteractionContext(evt);
        controller.interact(ctx);
      }
    });
  }

  function handlePointerDown(e: PointerEvent) {
    const ctx = makeInteractionContext(e);
    const outcome = controller.interact(ctx);
    if (outcome === 'consumed') {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    const ctx = makeInteractionContext(e);
    controller.interact(ctx);
  }

  function handlePointerUp(e: PointerEvent) {
    const ctx = makeInteractionContext(e);
    controller.interact(ctx);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="snap-zoom-camera"
  style:width="{width}px"
  style:height="{height}px"
  onwheel={handleWheel}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerUp}
>
  <div
    class="camera-viewport"
    style:transform="translate({controller.panX}px, {controller.panY}px) scale({controller.zoom})"
    style:transform-origin="0 0"
  >
    {@render children(cameraState)}
  </div>
</div>

<style>
  .snap-zoom-camera {
    position: relative;
    overflow: hidden;
    cursor: grab;
    touch-action: none;
  }

  .snap-zoom-camera:active {
    cursor: grabbing;
  }

  .camera-viewport {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    will-change: transform;
  }
</style>
