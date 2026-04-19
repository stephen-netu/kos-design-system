// N3 Force Graph — Types
// Pure TypeScript — no Svelte, no DOM dependencies
// S-02: all health values are integer permille (0–1000)

// Re-export shared graph primitives from n1
export type { GraphNode, GraphEdge, GraphSnapshot } from '../n1-flow-canvas/types.js';

// === Force Graph Node (extends GraphNode with health/visual data) ===

export interface ForceGraphNode {
  id: string;
  label: string;
  /** Node category for visual differentiation */
  type: 'app' | 'adr' | 'domain' | string;
  /** Health score in permille (0–1000). 0 = critical, 1000 = healthy. */
  health: number;
  /** Node visual weight — controls circle radius. Default 1. */
  weight?: number;
  /** Optional: pinned position (drag-to-pin). Set fx/fy to pin. */
  fx?: number;
  fy?: number;
  /** Arbitrary domain data for tooltip/detail rendering */
  data?: Record<string, unknown>;
  // d3-force internal (populated by simulation)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
}

export interface ForceGraphLink {
  id: string;
  source: string;
  target: string;
  /** Edge rendering mode */
  mode: 'active' | 'stub' | 'wired';
  /** Optional label (e.g. dependency name) */
  label?: string;
}

// === Health Node Config ===

export interface HealthNodeConfig {
  /** Base circle radius in px. Default 6. */
  baseRadius?: number;
  /** Whether to animate pulse on healthy nodes. Default true. */
  pulseEnabled?: boolean;
  /** Pulse amplitude (scale factor above 1.0). Default 0.02. */
  pulseAmplitude?: number;
}

// === Animated Edge Config ===

export interface AnimatedEdgeConfig {
  /** Marching-ants dash length. Default 8. */
  dashLength?: number;
  /** Marching-ants gap length. Default 4. */
  gapLength?: number;
  /** Animation speed (px/frame). Default 0.5. */
  marchSpeed?: number;
}

// === Graph Data (input to ForceGraph) ===

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

// === Tooltip ===

export interface TooltipPosition {
  x: number;
  y: number;
  visible: boolean;
}

// === Health → Color mapping (integer permille thresholds) ===

/** Map health permille to CSS color string. Pure function, no side effects. */
export function healthToColor(permille: number): string {
  if (permille >= 800) return '#27ae60'; // green — healthy
  if (permille >= 500) return '#f39c12'; // amber — partial
  if (permille >= 200) return '#c0392b'; // red — blocked/stub-heavy
  return '#3a3a3a';                       // dark — no data / dead
}

/** Map health permille to glow opacity (0.0–0.4). Healthy = brighter glow. */
export function healthToGlow(permille: number): number {
  if (permille >= 800) return 0.3;
  if (permille >= 500) return 0.15;
  return 0.0; // No glow for unhealthy/dead
}
