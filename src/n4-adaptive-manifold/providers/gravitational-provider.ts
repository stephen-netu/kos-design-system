import type {
  ManifoldSnapshot,
  GravitationalConfig,
  AlgorithmProvider,
  LayoutAlgorithm,
} from '../types.js';
import type { NodeLayout, LayoutResult } from '../../n1-flow-canvas/types.js';
import { DEFAULT_GRAVITATIONAL_CONFIG } from '../types.js';

/** 
 * Node sizes by kind with support for measured content.
 * Checks node.data.measuredSize first (from Enchanted Blocks), 
 * then falls back to fixed sizes by kind.
 */
function nodeSize(
  kind: string, 
  status: string, 
  data?: Record<string, unknown>
): { w: number; h: number } {
  // Check for measured size from Enchanted Blocks integration
  const measured = data?.measuredSize as { w: number; h: number } | undefined;
  if (measured && measured.w > 0 && measured.h > 0) {
    return measured;
  }
  
  // Fall back to fixed sizes by kind
  switch (kind) {
    case 'agent': return { w: 52, h: 46 }; // Large hexagon
    case 'task':  return { w: 72, h: 48 }; // Compact badge with ID
    case 'signal': return { w: 10, h: 10 };
    default:      return { w: 140, h: 32 };
  }
}

/**
 * Gravitational layout with deterministic spiral placement.
 * Guarantees no overlap by construction using explicit overlap checking.
 */
export class GravitationalProvider implements AlgorithmProvider {
  readonly algorithm: LayoutAlgorithm = 'gravitational';
  private config: GravitationalConfig;

  constructor(config: Partial<GravitationalConfig> = {}) {
    this.config = { ...DEFAULT_GRAVITATIONAL_CONFIG, ...config };
  }

  updateConfig(config: Partial<GravitationalConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async layout(
    snapshot: ManifoldSnapshot,
    canvasWidth: number,
    canvasHeight: number,
  ): Promise<LayoutResult> {
    const { nodes, edges } = snapshot;
    if (nodes.length === 0) {
      return { positions: new Map(), bfsOrder: [] };
    }

    // Layout world: compact to fit viewport
    const layoutDim = Math.max(canvasWidth, canvasHeight) * 1.2;
    const cx = layoutDim / 2;
    const cy = layoutDim / 2;

    // ── Deterministic spiral layout with guaranteed separation ──────────────
    // Sort nodes: agents first (center), then claimed tasks, then by priority
    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.kind === 'agent' && b.kind !== 'agent') return -1;
      if (a.kind !== 'agent' && b.kind === 'agent') return 1;
      const aClaimed = a.metadata?.claiming_agent ? 1 : 0;
      const bClaimed = b.metadata?.claiming_agent ? 1 : 0;
      if (aClaimed !== bClaimed) return bClaimed - aClaimed;
      const priorityOrder: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
      const aPriority = typeof a.metadata?.priority === 'string' ? a.metadata.priority : '';
      const bPriority = typeof b.metadata?.priority === 'string' ? b.metadata.priority : '';
      return (priorityOrder[aPriority] ?? 4) - (priorityOrder[bPriority] ?? 4);
    });

    // Place nodes in spiral with guaranteed minimum spacing
    const positions = new Map<string, NodeLayout>();
    const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
    
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const { w, h } = nodeSize(node.kind, node.status, node.metadata);
      
      // Golden angle spiral for even distribution
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const angle = i * goldenAngle;
      
      // Radius grows with sqrt(index) for equal area distribution
      // Start with minimum spacing of 60px between nodes
      const minSpacing = 60;
      const baseRadius = Math.sqrt(i) * minSpacing * 1.5;
      
      let x = cx + Math.cos(angle) * baseRadius - w / 2;
      let y = cy + Math.sin(angle) * baseRadius - h / 2;
      
      // Check for overlaps with placed nodes and nudge if needed
      let attempts = 0;
      while (attempts < 50) {
        let hasOverlap = false;
        for (const p of placed) {
          const dx = Math.abs((x + w/2) - p.x);
          const dy = Math.abs((y + h/2) - p.y);
          const minDx = (w + p.w) / 2 + minSpacing;
          const minDy = (h + p.h) / 2 + minSpacing;
          if (dx < minDx && dy < minDy) {
            hasOverlap = true;
            // Nudge outward along the angle
            const nudge = minSpacing * (1 + attempts * 0.2);
            x = cx + Math.cos(angle) * (baseRadius + nudge) - w / 2;
            y = cy + Math.sin(angle) * (baseRadius + nudge) - h / 2;
            break;
          }
        }
        if (!hasOverlap) break;
        attempts++;
      }
      
      // Clamp to bounds
      x = Math.max(20, Math.min(layoutDim - w - 20, x));
      y = Math.max(20, Math.min(layoutDim - h - 20, y));
      
      positions.set(node.id, { id: node.id, x, y, width: w, height: h });
      placed.push({ x: x + w/2, y: y + h/2, w, h });
    }

    // BFS order for edge reveal
    const incoming = new Set(edges.map((e) => e.target));
    const roots = nodes.filter((n) => !incoming.has(n.id)).map((n) => n.id);
    const visited = new Set<string>();
    const bfsOrder: string[] = [];
    const queue = [...roots];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      bfsOrder.push(id);
      for (const e of edges) {
        if (e.source === id && !visited.has(e.target)) queue.push(e.target);
      }
    }
    for (const n of nodes) {
      if (!visited.has(n.id)) bfsOrder.push(n.id);
    }
    
    return { positions, bfsOrder };
  }

  /** Classify node into gravitational zone based on kind + metadata */
  private classifyZone(
    kind: string,
    metadata: Record<string, unknown>,
  ): 'center' | 'mid' | 'periphery' {
    // Agents: zone depends on dominant rotation axis
    if (kind === 'agent') {
      const sparkByAxis = metadata.spark_by_axis as
        | [number, number, number]
        | undefined;
      if (sparkByAxis) {
        const [i, j, k] = sparkByAxis;
        const max = Math.max(i, j, k);
        // Tie-break: k (relation) beats j (actuation) beats i (accumulation).
        // Intentional: balanced agents (i===j===k) land in 'center' — coordination role.
        if (max === k) return 'center'; // Relation axis dominant → coordination
        if (max === j) return 'mid';    // Actuation axis dominant → worker
        return 'periphery';             // Accumulation axis dominant → epistemic
      }
      return 'mid'; // default for agents without axis data
    }

    // Tasks: active tasks (claimed) pull to mid; idle tasks orbit by priority.
    // p0 = critical → center; p1 = high → mid; p2/p3 = background → periphery.
    // This gives the idle Pinnacle a legible priority hierarchy, not a random scatter.
    if (kind === 'task') {
      if (metadata.claiming_agent) return 'mid';
      const priority = metadata.priority as string | undefined;
      if (priority === 'p0') return 'center';
      if (priority === 'p1') return 'mid';
      return 'periphery';
    }

    // Signals: always middleground
    if (kind === 'signal') return 'mid';

    // Capabilities, intents: background/deferred
    return 'periphery';
  }
}
