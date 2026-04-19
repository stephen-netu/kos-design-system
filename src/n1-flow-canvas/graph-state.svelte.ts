// N1 GraphState — Svelte 5 runes, Spring-animated node positions
// S-02: positions lerped deterministically via rAF loop (no Math.random)
// S-05: animation loop bounded by convergence threshold

import type { NodeLayout, LayoutResult, GraphStateApi } from './types.js';

const LERP_FACTOR   = 0.12;   // per frame (bounded, S-05)
const SETTLE_THRESH = 0.5;    // pixels — stop animating below this delta
const MAX_FRAMES    = 240;    // ~4s at 60fps hard cap (S-05 killability)

export class GraphState implements GraphStateApi {
  positions = $state<Map<string, NodeLayout>>(new Map());
  bfsOrder  = $state<ReadonlyArray<string>>([]);

  // Focus semantics
  focusCenterId  = $state<string | null>(null);
  layoutRootId   = $state<string | null>(null);

  private _targets  = new Map<string, NodeLayout>();
  private _rafId: number | null = null;
  private _frameCount = 0;

  // Callback invoked by FlowCanvas when layoutRootId changes
  onLayoutRootChange: ((nodeId: string) => void) | null = null;

  applyLayout(result: LayoutResult): void {
    this._targets = new Map(result.positions);
    this.bfsOrder = result.bfsOrder;
    this._frameCount = 0;
    this._startAnimation();
  }

  setFocusCenter(nodeId: string): void {
    // Re-centers Poincaré disk — does NOT trigger re-layout
    this.focusCenterId = nodeId;
  }

  setLayoutRoot(nodeId: string): void {
    this.layoutRootId = nodeId;
    this.onLayoutRootChange?.(nodeId);
  }

  // ── Animation ──────────────────────────────────────────────────────────────

  private _startAnimation(): void {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._tick();
  }

  private _tick = (): void => {
    if (this._frameCount >= MAX_FRAMES) {
      // Force-snap to targets on hard cap (S-05)
      this.positions = new Map(this._targets);
      this._rafId = null;
      return;
    }

    let maxDelta = 0;
    const next = new Map<string, NodeLayout>();

    for (const [id, target] of this._targets) {
      const current = this.positions.get(id);
      if (!current) {
        // First appearance — snap directly, no lerp
        next.set(id, { ...target });
        continue;
      }
      const nx = current.x + (target.x - current.x) * LERP_FACTOR;
      const ny = current.y + (target.y - current.y) * LERP_FACTOR;
      const dx = Math.abs(target.x - nx);
      const dy = Math.abs(target.y - ny);
      if (dx > maxDelta) maxDelta = dx;
      if (dy > maxDelta) maxDelta = dy;
      next.set(id, { id, x: nx, y: ny, width: target.width, height: target.height });
    }

    this.positions = next;
    this._frameCount++;

    if (maxDelta > SETTLE_THRESH) {
      this._rafId = requestAnimationFrame(this._tick);
    } else {
      // Settled — snap to exact targets
      this.positions = new Map(this._targets);
      this._rafId = null;
    }
  };

  destroy(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}
