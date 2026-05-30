// CameraController — viewport camera Lifecycle class
// Implements s0-lifecycle for camera transforms with snap-zoom, pan, and wheel zoom
// S-02: Uses rAF tick easing, NOT performance.now()

import type { Lifecycle } from '../s0-lifecycle/Lifecycle.js';
import type { ConstraintContext, SizeConstraints } from '../s0-lifecycle/ConstraintContext.js';
import type { LayoutContext } from '../s0-lifecycle/LayoutContext.js';
import type { InteractionContext, EventOutcome } from '../s0-lifecycle/InteractionContext.js';
import type { RenderContext } from '../s0-lifecycle/RenderContext.js';
import type { CameraState, SnapZoomTarget, CameraConfig } from './camera-types.js';
import { DEFAULT_CAMERA_CONFIG } from './camera-types.js';

interface ActiveAnimation {
  startZoom: number;
  startPanX: number;
  startPanY: number;
  targetZoom: number;
  targetPanX: number;
  targetPanY: number;
  startTick: number;
  duration: number;
}

export class CameraController implements Lifecycle {
  zoom: number = $state(1.0);
  panX: number = $state(0);
  panY: number = $state(0);

  private config: Required<CameraConfig>;
  private width: number;
  private height: number;
  private viewportW: number = 0;
  private viewportH: number = 0;
  private isPanning: boolean = false;
  private panStartX: number = 0;
  private panStartY: number = 0;
  private panStartPanX: number = 0;
  private panStartPanY: number = 0;
  private activeAnim: ActiveAnimation | null = null;
  private animFrameId: number | null = null;
  private frameTick: number = 0;

  constructor(width: number, height: number, config?: CameraConfig) {
    this.width = width;
    this.height = height;
    this.config = {
      minZoom: config?.minZoom ?? DEFAULT_CAMERA_CONFIG.minZoom,
      maxZoom: config?.maxZoom ?? DEFAULT_CAMERA_CONFIG.maxZoom,
      zoomSpeed: config?.zoomSpeed ?? DEFAULT_CAMERA_CONFIG.zoomSpeed,
      snapDuration: config?.snapDuration ?? DEFAULT_CAMERA_CONFIG.snapDuration,
    };
  }

  getCameraState(): CameraState {
    return { zoom: this.zoom, panX: this.panX, panY: this.panY };
  }

  constrain(_ctx: ConstraintContext): SizeConstraints {
    return {
      width: {
        min: this.width,
        preferred: this.width,
        max: this.width,
      },
      height: {
        min: this.height,
        preferred: this.height,
        max: this.height,
      },
    };
  }

  layout(ctx: LayoutContext): void {
    this.viewportW = ctx.viewportSize.width;
    this.viewportH = ctx.viewportSize.height;
  }

  interact(ctx: InteractionContext): EventOutcome {
    const evt = ctx.event;
    const type = evt.type;

    if (type === 'wheel') {
      return this.handleWheel(evt);
    }

    if (type === 'pointerdown') {
      return this.handlePointerDown(evt);
    }

    if (type === 'pointermove') {
      return this.handlePointerMove(evt);
    }

    if (type === 'pointerup' || type === 'pointercancel') {
      this.isPanning = false;
      return 'propagated';
    }

    return 'propagated';
  }

  render(ctx: RenderContext): void {
    if (typeof ctx.pushTransform === 'function') {
      ctx.pushTransform([this.zoom, 0, 0, this.zoom, this.panX, this.panY]);
    }
  }

  // ── Wheel zoom ────────────────────────────────────────────────────────────

  private handleWheel(evt: InteractionContext['event']): EventOutcome {
    const native = evt.nativeEvent as WheelEvent;
    native.preventDefault();

    const pos = evt.position;
    if (!pos) return 'propagated';

    const mx = pos.x;
    const my = pos.y;

    const cx = (mx - this.panX) / this.zoom;
    const cy = (my - this.panY) / this.zoom;

    const delta = -native.deltaY * this.config.zoomSpeed;
    const newZoom = Math.max(
      this.config.minZoom,
      Math.min(this.config.maxZoom, this.zoom * (1 + delta))
    );

    this.panX = mx - cx * newZoom;
    this.panY = my - cy * newZoom;
    this.zoom = newZoom;

    return 'consumed';
  }

  // ── Pan ───────────────────────────────────────────────────────────────────

  private handlePointerDown(evt: InteractionContext['event']): EventOutcome {
    const native = evt.nativeEvent as PointerEvent;
    if (native.button === 1 || (native.button === 0 && native.shiftKey)) {
      native.preventDefault();
      this.isPanning = true;
      this.panStartX = native.clientX;
      this.panStartY = native.clientY;
      this.panStartPanX = this.panX;
      this.panStartPanY = this.panY;
      return 'consumed';
    }
    return 'propagated';
  }

  private handlePointerMove(evt: InteractionContext['event']): EventOutcome {
    if (!this.isPanning) return 'propagated';
    const native = evt.nativeEvent as PointerEvent;
    this.panX = this.panStartPanX + (native.clientX - this.panStartX);
    this.panY = this.panStartPanY + (native.clientY - this.panStartY);
    return 'consumed';
  }

  // ── Snap-zoom API ─────────────────────────────────────────────────────────

  snapTo(target: SnapZoomTarget): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }

    const duration = target.duration ?? this.config.snapDuration;
    const targetPanX = this.viewportW / 2 - target.x * target.zoom;
    const targetPanY = this.viewportH / 2 - target.y * target.zoom;

    this.activeAnim = {
      startZoom: this.zoom,
      startPanX: this.panX,
      startPanY: this.panY,
      targetZoom: target.zoom,
      targetPanX,
      targetPanY,
      startTick: this.frameTick,
      duration,
    };

    this.scheduleAnimate();
  }

  resetCamera(): void {
    this.snapTo({ x: 0, y: 0, zoom: 1.0 });
  }

  stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.activeAnim = null;
  }

  // ── Animation (S-02: rAF tick, NOT performance.now) ──────────────────────

  private scheduleAnimate(): void {
    this.animFrameId = requestAnimationFrame(() => {
      this.frameTick++;
      this.tickAnimate();
    });
  }

  private tickAnimate(): void {
    if (!this.activeAnim) {
      this.animFrameId = null;
      return;
    }

    const anim = this.activeAnim;
    // Assume 60fps → ~16.67ms per frame, compute elapsed from tick delta
    const elapsed = (this.frameTick - anim.startTick) * 16.667;
    const t = Math.min(1, elapsed / anim.duration);
    const eased = 1 - Math.pow(1 - t, 3);

    this.zoom = anim.startZoom + (anim.targetZoom - anim.startZoom) * eased;
    this.panX = anim.startPanX + (anim.targetPanX - anim.startPanX) * eased;
    this.panY = anim.startPanY + (anim.targetPanY - anim.startPanY) * eased;

    if (t < 1) {
      this.scheduleAnimate();
    } else {
      this.animFrameId = null;
      this.activeAnim = null;
    }
  }
}
