// N3 Health Node — nodeCanvasObject callback for force-graph
// wt-798: Renders nodes with health-derived color, pulse animation, size scaling
// Zero domain knowledge — pure visual primitive
//
// S-02: health values are integer permille. No Math.random.
// S-05: pulse uses rAF tick count (bounded by force-graph's own cooldown).

import type { ForceGraphNode, HealthNodeConfig } from './types.js';
import { healthToColor, healthToGlow } from './types.js';
import { getCanvasTheme } from '../p0-primitives/canvas-theme';

const DEFAULTS: Required<HealthNodeConfig> = {
  baseRadius: 6,
  pulseEnabled: true,
  pulseAmplitude: 0.02,
};

// Capture theme at render creation time so color lookups happen once,
// not on every frame tick.
const theme = getCanvasTheme();

// Global tick counter for deterministic pulse — incremented by the ForceGraph
// component on each engine tick. Avoids Date.now() / performance.now() in render.
let _pulseTick = 0;
export function advancePulseTick(): void { _pulseTick++; }
export function getPulseTick(): number { return _pulseTick; }

/**
 * Create a `nodeCanvasObject` callback for force-graph.
 *
 * Usage:
 * ```ts
 * import { createHealthNodeRenderer } from '@kos/design-system/n3-force-graph';
 * graph.nodeCanvasObject(createHealthNodeRenderer({ baseRadius: 8 }));
 * graph.nodeCanvasObjectMode(() => 'replace');
 * ```
 */
export function createHealthNodeRenderer(
  config?: HealthNodeConfig,
): (node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => void {
  const { baseRadius, pulseEnabled, pulseAmplitude } = { ...DEFAULTS, ...config };

  return (node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const weight = node.weight ?? 1;
    const health = node.health ?? 0;

    // Size: base * sqrt(weight) for area-proportional scaling
    let radius = baseRadius * Math.sqrt(weight);

    // Pulse: subtle scale oscillation on healthy nodes
    if (pulseEnabled && health >= 500) {
      // Deterministic sine wave from tick counter, not wall clock
      const phase = (_pulseTick * 0.05) % (2 * Math.PI);
      const pulse = 1.0 + pulseAmplitude * Math.sin(phase);
      radius *= pulse;
    }

    const color = healthToColor(health);
    const glowAlpha = healthToGlow(health);

    // Glow (outer ring via shadow)
    if (glowAlpha > 0) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 3 / globalScale, 0, 2 * Math.PI);
      // Parse hex → rgba for the fill
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${glowAlpha})`;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 / globalScale;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Border
      ctx.strokeStyle = theme.nodeBorder;
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();

      // Label (below node, only when zoomed in enough)
      if (globalScale >= 0.6) {
        const fontSize = Math.max(10, 12 / globalScale);
        ctx.font = `${fontSize}px var(--font-mono, 'JetBrains Mono', monospace)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = theme.nodeText;

        const label = node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label;
        ctx.fillText(label, x, y + radius + 4 / globalScale);
      }

      // Type indicator: app nodes get a ring, ADR nodes get a diamond
      if (node.type === 'app') {
        ctx.beginPath();
        ctx.arc(x, y, radius + 1.5 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = theme.nodeBorder;
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }
  };
}

/**
 * Create a `nodePointerAreaPaint` callback for hit detection.
 * Returns a circle matching the visual node size.
 */
export function createHealthNodeAreaPaint(
  config?: HealthNodeConfig,
): (node: ForceGraphNode, paintColor: string, ctx: CanvasRenderingContext2D, globalScale: number) => void {
  const { baseRadius } = { ...DEFAULTS, ...config };

  return (node: ForceGraphNode, paintColor: string, ctx: CanvasRenderingContext2D) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const weight = node.weight ?? 1;
    const radius = baseRadius * Math.sqrt(weight) + 4; // generous hit area

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = paintColor;
    ctx.fill();
  };
}
