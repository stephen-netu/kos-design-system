// N4 TransitionAnimator — Interpolates between two LayoutResults
// Uses requestAnimationFrame for smooth 60fps transitions.
// S-02: deterministic interpolation, no random values.

import type { AnimationFrame, EasingFn, NodeLayout } from './types.js';

/** Named easing functions. All map t∈[0,1] → [0,1]. */
export const EASING_FUNCTIONS: Record<string, EasingFn> = {
  linear: (t) => t,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  spring: (t) => {
    // Damped spring approximation — overshoots ~6% then settles
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export class TransitionAnimator {
  private rafId: number | null = null;

  /**
   * Animate from `from` positions to `to` positions over `durationMs`.
   * Calls `onFrame` on each animation frame with the interpolated moment.
   * Calls `onComplete` when the animation finishes.
   *
   * Nodes present in `to` but not `from` appear at their target position (no lerp).
   * Nodes present in `from` but not `to` are dropped from the interpolated map.
   */
  animate(
    from: Map<string, NodeLayout>,
    to: Map<string, NodeLayout>,
    durationMs: number,
    easing: EasingFn,
    onFrame: (frame: AnimationFrame) => void,
    onComplete: () => void,
  ): void {
    this.cancel();

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / durationMs, 1);
      const progress = easing(rawProgress);

      const positions = new Map<string, NodeLayout>();

      for (const [id, target] of to) {
        const source = from.get(id);
        if (!source) {
          // New node — appear at target position
          positions.set(id, { ...target });
        } else {
          // Interpolate
          positions.set(id, {
            id,
            x: source.x + (target.x - source.x) * progress,
            y: source.y + (target.y - source.y) * progress,
            width: source.width + (target.width - source.width) * progress,
            height: source.height + (target.height - source.height) * progress,
          });
        }
      }

      onFrame({ positions, progress, elapsedMs: elapsed });

      if (rawProgress < 1) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
        onComplete();
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  /** Cancel any in-flight animation. */
  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  get active(): boolean {
    return this.rafId !== null;
  }
}
