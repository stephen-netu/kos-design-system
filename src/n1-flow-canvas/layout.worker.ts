// N1 Layout Worker — ELK.js layout + BFS traversal order
// Runs in a dedicated Web Worker (mandatory at mount, never on main thread)
// S-02: BFS neighbors sorted before enqueue for deterministic order

import ELK from 'elkjs/lib/elk.bundled.js';
import type { WorkerIn, WorkerOut, LayoutResult, NodeLayout } from './types.js';
import type { GraphSnapshot, GraphNode, GraphEdge } from './types.js';

const elk = new ELK();

// ── BFS ───────────────────────────────────────────────────────────────────────

function computeBfsOrder(
  nodes: ReadonlyArray<GraphNode>,
  edges: ReadonlyArray<GraphEdge>,
  startId: string | null,
): string[] {
  // Build adjacency with Map (S-02: no object spread iteration)
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    const neighbors = adj.get(e.sourceId);
    if (neighbors) neighbors.push(e.targetId);
  }

  // Root: prefer explicit startId, fall back to first node in declaration order
  const rootId = startId ?? nodes[0]?.id;
  if (!rootId) return [];

  const visited = new Set<string>();
  const queue: string[] = [rootId];
  const order: string[] = [];
  visited.add(rootId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    // Sort neighbors for determinism (S-02)
    const neighbors = (adj.get(current) ?? []).slice().sort();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Append any unreachable nodes in declaration order (disconnected subgraphs)
  for (const n of nodes) {
    if (!visited.has(n.id)) order.push(n.id);
  }

  return order;
}

// ── ELK layout ────────────────────────────────────────────────────────────────

const NODE_WIDTH  = 120;
const NODE_HEIGHT = 60;

async function runLayout(snapshot: GraphSnapshot, canvasWidth: number, canvasHeight: number): Promise<LayoutResult> {
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
      'elk.padding': '[top=40,left=40,bottom=40,right=40]',
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

  // Fall back: place unmapped nodes in a grid (ELK dropped them — shouldn't happen)
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

// ── Worker message loop ───────────────────────────────────────────────────────

self.onmessage = async (event: MessageEvent<WorkerIn>) => {
  const msg = event.data;
  if (msg.type !== 'layout') return;

  const result = await runLayout(msg.snapshot, msg.canvasWidth, msg.canvasHeight);

  const out: WorkerOut = { type: 'layout_result', result };
  self.postMessage(out);
};
