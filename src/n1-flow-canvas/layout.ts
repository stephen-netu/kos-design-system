// N1 layout — ELK-based graph layout + BFS order
// Runs on the main thread (ELK is async/Promise-based; won't block UI).
// Extracted from layout.worker.ts so FlowCanvas can call it directly,
// avoiding nested Worker creation which fails in Tauri's WKWebView.

import ELK from 'elkjs/lib/elk.bundled.js';
import type { LayoutResult, NodeLayout } from './types.js';
import type { GraphSnapshot, GraphNode, GraphEdge } from './types.js';

const elk = new ELK();

// ── BFS ───────────────────────────────────────────────────────────────────────

function computeBfsOrder(
  nodes: ReadonlyArray<GraphNode>,
  edges: ReadonlyArray<GraphEdge>,
  startId: string | null,
): string[] {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    const neighbors = adj.get(e.sourceId);
    if (neighbors) neighbors.push(e.targetId);
  }

  const rootId = startId ?? nodes[0]?.id;
  if (!rootId) return [];

  const visited = new Set<string>();
  const queue: string[] = [rootId];
  const order: string[] = [];
  visited.add(rootId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    const neighbors = (adj.get(current) ?? []).slice().sort(); // S-02: deterministic
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) order.push(n.id);
  }

  return order;
}

// ── ELK layout ────────────────────────────────────────────────────────────────

const NODE_WIDTH  = 120;
const NODE_HEIGHT = 60;

export async function runLayout(
  snapshot: GraphSnapshot,
  _canvasWidth: number,
  _canvasHeight: number,
): Promise<LayoutResult> {
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '30',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.padding': '[top=40,left=40,bottom=40,right=40]',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    },
    children: snapshot.nodes.map(n => ({
      id: n.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: snapshot.edges.map(e => ({
      id: e.id,
      sources: [e.sourceId],
      targets: [e.targetId],
    })),
  };

  const result = await elk.layout(elkGraph);

  const positions = new Map<string, NodeLayout>();
  for (const child of result.children ?? []) {
    if (child.x !== undefined && child.y !== undefined) {
      positions.set(child.id, {
        id: child.id,
        x: child.x,
        y: child.y,
        width: child.width ?? NODE_WIDTH,
        height: child.height ?? NODE_HEIGHT,
      });
    }
  }

  // Grid fallback for nodes ELK dropped (should not happen)
  let col = 0;
  for (const n of snapshot.nodes) {
    if (!positions.has(n.id)) {
      positions.set(n.id, {
        id: n.id,
        x: 40 + col * (NODE_WIDTH + 40),
        y: 40,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
      col++;
    }
  }

  const bfsOrder = computeBfsOrder(snapshot.nodes, snapshot.edges, snapshot.focusNodeId);

  return { positions, bfsOrder };
}
