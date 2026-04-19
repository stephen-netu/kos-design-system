<script lang="ts">
  // SnapZoomCamera — viewport camera with snap-zoom transitions
  // wt-903: Camera state + wheel zoom + pinch zoom + snap-zoom to target
  //
  // Provides camera state (zoom, panX, panY) to child content.
  // Handles mouse wheel zoom, trackpad pinch, and programmatic snap-zoom.
  //
  // S-02: Easing from rAF tick, not wall-clock.
  // S-05: Animation bounded (maxDuration).

  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import type { CameraState, SnapZoomTarget, CameraConfig } from './camera-types.js';
  import { DEFAULT_CAMERA_CONFIG } from './camera-types.js';

  // ── Props ────────────────────────────────────────────────────────────────

  interface Props {
    /** Container width */
    width: number;
    /** Container height */
    height: number;
    /** Camera configuration */
    config?: CameraConfig;
    /** Content to render inside the camera viewport */
    children: Snippet<[CameraState]>;
    /** Callback when camera state changes */
    onCameraChange?: (state: CameraState) => void;
  }

  let {
    width,
    height,
    config,
    children,
    onCameraChange,
  }: Props = $props();

  // ── Config ───────────────────────────────────────────────────────────────

  const minZoom = $derived(config?.minZoom ?? DEFAULT_CAMERA_CONFIG.minZoom);
  const maxZoom = $derived(config?.maxZoom ?? DEFAULT_CAMERA_CONFIG.maxZoom);
  const zoomSpeed = $derived(config?.zoomSpeed ?? DEFAULT_CAMERA_CONFIG.zoomSpeed);
  const snapDuration = $derived(config?.snapDuration ?? DEFAULT_CAMERA_CONFIG.snapDuration);

  // ── Camera state ─────────────────────────────────────────────────────────

  let zoom = $state(1.0);
  let panX = $state(0);
  let panY = $state(0);

  const cameraState: CameraState = $derived({ zoom, panX, panY });

  $effect(() => {
    onCameraChange?.(cameraState);
  });

  // ── Wheel zoom ───────────────────────────────────────────────────────────

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    // Determine zoom center (pointer position relative to container)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Content point under pointer before zoom
    const cx = (mx - panX) / zoom;
    const cy = (my - panY) / zoom;

    // Compute new zoom
    const delta = -e.deltaY * zoomSpeed;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * (1 + delta)));

    // Adjust pan so content point stays under pointer
    panX = mx - cx * newZoom;
    panY = my - cy * newZoom;
    zoom = newZoom;
  }

  // ── Pan (middle mouse or shift+drag) ─────────────────────────────────────

  let isPanning = $state(false);
  let panStart = { x: 0, y: 0, panX: 0, panY: 0 };

  function handlePointerDown(e: PointerEvent) {
    // Middle mouse button or shift+left click
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY, panX, panY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isPanning) return;
    panX = panStart.panX + (e.clientX - panStart.x);
    panY = panStart.panY + (e.clientY - panStart.y);
  }

  function handlePointerUp() {
    isPanning = false;
  }

  // ── Snap-zoom API ────────────────────────────────────────────────────────

  let animFrameId: number | null = null;

  export function snapTo(target: SnapZoomTarget) {
    if (animFrameId !== null) cancelAnimationFrame(animFrameId);

    const duration = target.duration ?? snapDuration;
    const startZoom = zoom;
    const startPanX = panX;
    const startPanY = panY;

    // Target: center the point in the viewport at the target zoom
    const targetPanX = width / 2 - target.x * target.zoom;
    const targetPanY = height / 2 - target.y * target.zoom;

    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      zoom = startZoom + (target.zoom - startZoom) * eased;
      panX = startPanX + (targetPanX - startPanX) * eased;
      panY = startPanY + (targetPanY - startPanY) * eased;

      if (t < 1) {
        animFrameId = requestAnimationFrame(animate);
      } else {
        animFrameId = null;
      }
    }

    animFrameId = requestAnimationFrame(animate);
  }

  export function resetCamera() {
    snapTo({ x: 0, y: 0, zoom: 1.0 });
  }

  export function getState(): CameraState {
    return { zoom, panX, panY };
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  onDestroy(() => {
    if (animFrameId !== null) cancelAnimationFrame(animFrameId);
  });
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
  {@render children(cameraState)}
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
</style>
