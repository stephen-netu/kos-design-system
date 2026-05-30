// N3 Animated Edge — linkCanvasObject callback for force-graph
// wt-799: Three modes: marching-ants (active), dashed-static (stub), solid (wired)
// Zero domain knowledge — pure visual primitive
//
// S-02: animation driven by tick counter, not wall clock
// S-05: bounded by force-graph's own cooldown/frame budget

import type { ForceGraphNode, ForceGraphLink, AnimatedEdgeConfig } from './types.js';
import { getPulseTick } from './health-node.js';
import { getCanvasTheme } from '../p0-primitives/canvas-theme';

const DEFAULTS: Required<AnimatedEdgeConfig> = {
  dashLength: 8,
  gapLength: 4,
  marchSpeed: 0.5,
};

/**
 * Create a `linkCanvasObject` callback for force-graph.
 *
 * Modes:
 * - `active`: marching-ants animation (data flowing)
 * - `stub`: dashed static line (connection exists but not wired)
 * - `wired`: solid line (fully connected)
 *
 * Usage:
 * ```ts
 * import { createAnimatedEdgeRenderer } from '@kos/design-system/n3-force-graph';
 * graph.linkCanvasObject(createAnimatedEdgeRenderer());
 * graph.linkCanvasObjectMode(() => 'replace');
 * ```
 */
export function createAnimatedEdgeRenderer(
   config?: AnimatedEdgeConfig,
 ): (link: ForceGraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => void {
   const { dashLength, gapLength, marchSpeed } = { ...DEFAULTS, ...config };

   return (link: ForceGraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
     // force-graph mutates source/target to resolved node objects at runtime
     const source = link.source as unknown as ForceGraphNode;
     const target = link.target as unknown as ForceGraphNode;

     const sx = source.x ?? 0;
     const sy = source.y ?? 0;
     const tx = target.x ?? 0;
     const ty = target.y ?? 0;

     ctx.save();

     const mode = link.mode ?? 'wired';

     switch (mode) {
       case 'active': {
         // Marching-ants: animated dash offset driven by pulse tick
         const offset = getPulseTick() * marchSpeed;
         ctx.setLineDash([dashLength / globalScale, gapLength / globalScale]);
         ctx.lineDashOffset = -offset / globalScale;
         ctx.strokeStyle = getCanvasTheme().nodeBorder;
         ctx.lineWidth = 2 / globalScale;
         break;
       }
       case 'stub': {
         // Dashed static: connection exists but unwired
         ctx.setLineDash([4 / globalScale, 6 / globalScale]);
         ctx.lineDashOffset = 0;
         ctx.strokeStyle = 'rgba(88, 166, 255, 0.15)'; // accent subtle
         ctx.lineWidth = 1 / globalScale;
         break;
       }
       case 'wired':
       default: {
         // Solid: fully connected
         ctx.setLineDash([]);
         ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; // border subtle
         ctx.lineWidth = 1.5 / globalScale;
         break;
       }
     }

    // Draw line
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // Arrowhead for directed links (except stub)
    if (mode !== 'stub') {
      const angle = Math.atan2(ty - sy, tx - sx);
      const arrowSize = 6 / globalScale;

      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(
        tx - arrowSize * Math.cos(angle - Math.PI / 7),
        ty - arrowSize * Math.sin(angle - Math.PI / 7),
      );
      ctx.lineTo(
        tx - arrowSize * Math.cos(angle + Math.PI / 7),
        ty - arrowSize * Math.sin(angle + Math.PI / 7),
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };
}
