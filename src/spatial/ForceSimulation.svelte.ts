// ForceSimulation — Lifecycle implementation for d3-force semantic positioning
// Implements constrain → layout → render; interact is owned by ForceCanvas
// (hit-testing requires access to the onCellClick callback).
//
// S-02: No Math.random — initial positions seeded by node index.
// S-05: alphaDecay bounds simulation convergence; RAF cancelled on destroy.

import type { Lifecycle } from '../s0-lifecycle/Lifecycle';
import type { ConstraintContext, SizeConstraints } from '../s0-lifecycle/ConstraintContext';
import type { LayoutContext } from '../s0-lifecycle/LayoutContext';
import type { RenderContext } from '../s0-lifecycle/RenderContext';
import type { ForceCell, CellPosition, ForceCanvasConfig } from './force-canvas-types';
import { weightToRadius, cosineSimilarity, semanticSpringLength } from './force-canvas-types';

const MIN_ZONE_PAD = 40;

export class ForceSimulation implements Lifecycle {
  // Reactive positions — read by LodRenderer via $state
  positions: CellPosition[] = $state([]);

  private cells: ForceCell[] = [];
  private config: ForceCanvasConfig | undefined;
  private simulation: any = null;
  private boundsWidth = 0;
  private boundsHeight = 0;
  private generation = 0;

  constructor(cells: ForceCell[], config?: ForceCanvasConfig) {
    this.cells = cells;
    this.config = config;
  }

  // ── Lifecycle phases ────────────────────────────────────────────────────

  constrain(_ctx: ConstraintContext): SizeConstraints {
    const n = this.cells.length;
    const r = this.config?.minSpringLength ?? 30;
    // Minimum canvas area: cells need space to spread
    const minSide = Math.max(MIN_ZONE_PAD * 2, Math.ceil(Math.sqrt(n)) * r * 2);
    return {
      width: { min: minSide, preferred: minSide * 1.5, max: Infinity },
      height: { min: minSide, preferred: minSide * 1.5, max: Infinity }
    };
  }

  layout(ctx: LayoutContext): void {
    const { bounds } = ctx;
    this.boundsWidth = bounds.width;
    this.boundsHeight = bounds.height;
    // Re-init simulation whenever layout changes
    this.initSimulation();
  }

  render(ctx: RenderContext): void {
    for (const pos of this.positions) {
      const r = pos.radius;
      ctx.drawRect(
        { x: pos.x - r, y: pos.y - r, width: r * 2, height: r * 2 },
        '#b87333'
      );
    }
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private async initSimulation(): Promise<void> {
    const gen = ++this.generation;
    this.simulation?.stop();
    if (this.cells.length === 0 || this.boundsWidth === 0) {
      this.positions = [];
      return;
    }

    const d3 = await import('d3-force');
    if (gen !== this.generation) return; // superseded by a newer layout call
    const cfg = this.config;
    const w = this.boundsWidth;
    const h = this.boundsHeight;
    const chargeStrength = cfg?.chargeStrength ?? -80;
    const collisionPadding = cfg?.collisionPadding ?? 4;
    const wallMargin = cfg?.wallMargin ?? 20;
    const wallStrength = cfg?.wallStrength ?? 0.3;
    const minSpring = cfg?.minSpringLength ?? 30;
    const maxSpring = cfg?.maxSpringLength ?? 200;
    const velocityDecay = cfg?.velocityDecay ?? 0.4;

    const cx = w / 2;
    const cy = h / 2;

    for (const cell of this.cells) {
      if (cell.x === undefined) {
        // Deterministic initial placement: spiral by index
        cell.x = cx + (cell.index ?? 0) * 3;
        cell.y = cy + (cell.index ?? 0) * 2;
      }
    }

    const links = this.buildLinks();

    this.simulation = d3
      .forceSimulation(this.cells as any)
      .alphaDecay(0.02)
      .velocityDecay(velocityDecay)
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('collision', d3.forceCollide<ForceCell>().radius((d) => weightToRadius(d.weight) + collisionPadding))
      .force('link', d3.forceLink(links as any).id((d: any) => d.id)
        .distance((l: any) => semanticSpringLength(1 - l.distance, minSpring, maxSpring))
        .strength(0.5))
      .force('center', d3.forceCenter(cx, cy).strength(0.03))
      .force('wall', this.wallForce(w, h, wallMargin, wallStrength))
      .on('tick', () => {
        this.positions = this.cells.map((c) => ({
          x: c.x ?? cx,
          y: c.y ?? cy,
          radius: weightToRadius(c.weight),
          cell: c,
        }));
      });
  }

  private buildLinks(): unknown[] {
    const links: Array<{ source: string; target: string; distance: number }> = [];
    const THRESHOLD = 0.3;
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = i + 1; j < this.cells.length; j++) {
        const sim = cosineSimilarity(this.cells[i].embedding, this.cells[j].embedding);
        if (sim > THRESHOLD) {
          links.push({ source: this.cells[i].id, target: this.cells[j].id, distance: 1 - sim });
        }
      }
    }
    return links;
  }

  private wallForce(w: number, h: number, margin: number, strength: number): (alpha: number) => void {
    let nodes: ForceCell[] = [];
    function force(alpha: number): void {
      for (const n of nodes) {
        const x = n.x ?? 0;
        const y = n.y ?? 0;
        const r = weightToRadius(n.weight);
        if (x - r < margin) n.vx = (n.vx ?? 0) + (margin - x + r) * strength * alpha;
        if (x + r > w - margin) n.vx = (n.vx ?? 0) - (x + r - w + margin) * strength * alpha;
        if (y - r < margin) n.vy = (n.vy ?? 0) + (margin - y + r) * strength * alpha;
        if (y + r > h - margin) n.vy = (n.vy ?? 0) - (y + r - h + margin) * strength * alpha;
      }
    }
    force.initialize = (ns: ForceCell[]) => { nodes = ns; };
    return force;
  }

  stop(): void { this.simulation?.stop(); }
}
