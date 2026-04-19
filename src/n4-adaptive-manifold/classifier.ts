// N4 TopologyClassifier — always returns manifold layout.
// Pure function, no state. Deterministic given same input.
// S-02: uses Map (ordered) for adjacency, not Set.

import type {
  ManifoldSnapshot,
  LayoutAlgorithm,
  ClassificationResult,
  TopologyMetrics,
} from './types.js';

/** Number of consecutive matching classifications before suggesting. */
export const STABILITY_TICKS = 3;

export function classifyTopology(
  snapshot: ManifoldSnapshot,
): ClassificationResult {
  // Manifold is the implemented layout algorithm.
  // computeMetrics() is preserved for topology analysis.
  const nodeCount = snapshot.nodes.length;
  const edgeCount = snapshot.edges.length;
  const edgeDensity = nodeCount > 0 ? edgeCount / nodeCount : 0;

  return {
    recommended: 'manifold',
    confidence: 1.0,
    reason: edgeCount === 0
      ? 'manifold: sparse (no edges, S³ projection only)'
      : `manifold: ${edgeCount} edges, density ${edgeDensity.toFixed(2)}`,
    ranked: [{ algorithm: 'manifold' as LayoutAlgorithm, fitness: 1.0 }],
    metrics: { nodeCount, edgeCount, edgeDensity, maxDepth: 0, rootCount: 0, cycleCount: 0, componentCount: 0, maxClusterSize: 0 },
  };
}

// === Metrics computation (single pass, O(V+E)) ===

export function computeMetrics(snapshot: ManifoldSnapshot): TopologyMetrics {
  const nodeCount = snapshot.nodes.length;
  const edgeCount = snapshot.edges.length;

  if (nodeCount === 0) {
    return { nodeCount: 0, edgeCount: 0, edgeDensity: 0, maxDepth: 0, rootCount: 0, cycleCount: 0, componentCount: 0, maxClusterSize: 0 };
  }

  // Note: "edgeDensity" here is edges/nodes (avg out-degree), NOT graph density (edges/(n*(n-1)/2)).
  const edgeDensity = nodeCount > 0 ? edgeCount / nodeCount : 0;

  // Build adjacency (directed) and undirected adjacency
  // S-02: Map preserves insertion order (deterministic)
  const adj = new Map<string, string[]>();
  const uAdj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const n of snapshot.nodes) {
    adj.set(n.id, []);
    uAdj.set(n.id, []);
    inDegree.set(n.id, 0);
  }
  for (const e of snapshot.edges) {
    adj.get(e.source)?.push(e.target);
    uAdj.get(e.source)?.push(e.target);
    uAdj.get(e.target)?.push(e.source);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  // Roots: in-degree 0
  let rootCount = 0;
  for (const [, deg] of inDegree) {
    if (deg === 0) rootCount++;
  }

  // Cycle detection via DFS (directed)
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const n of snapshot.nodes) color.set(n.id, WHITE);
  let cycleCount = 0;

  function dfs(nodeId: string): void {
    color.set(nodeId, GRAY);
    for (const neighbor of adj.get(nodeId) ?? []) {
      const c = color.get(neighbor) ?? WHITE;
      if (c === GRAY) { cycleCount++; }
      else if (c === WHITE) { dfs(neighbor); }
    }
    color.set(nodeId, BLACK);
  }

  for (const n of snapshot.nodes) {
    if (color.get(n.id) === WHITE) dfs(n.id);
  }

  // Max depth via BFS from roots (or all nodes if no roots)
  let maxDepth = 0;
  const depthVisited = new Map<string, boolean>();
  const roots = snapshot.nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0);
  const bfsStart = roots.length > 0 ? roots : [snapshot.nodes[0]];

  for (const root of bfsStart) {
    if (depthVisited.get(root.id)) continue;
    const queue: Array<{ id: string; depth: number }> = [{ id: root.id, depth: 0 }];
    depthVisited.set(root.id, true);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (cur.depth > maxDepth) maxDepth = cur.depth;
      for (const neighbor of adj.get(cur.id) ?? []) {
        if (!depthVisited.get(neighbor)) {
          depthVisited.set(neighbor, true);
          queue.push({ id: neighbor, depth: cur.depth + 1 });
        }
      }
    }
  }

  // Connected components via BFS on undirected graph
  const compVisited = new Map<string, boolean>();
  let componentCount = 0;
  let maxClusterSize = 0;

  for (const n of snapshot.nodes) {
    if (compVisited.get(n.id)) continue;
    componentCount++;
    let clusterSize = 0;
    const queue = [n.id];
    compVisited.set(n.id, true);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      clusterSize++;
      for (const nb of uAdj.get(cur) ?? []) {
        if (!compVisited.get(nb)) {
          compVisited.set(nb, true);
          queue.push(nb);
        }
      }
    }
    if (clusterSize > maxClusterSize) maxClusterSize = clusterSize;
  }

  return { nodeCount, edgeCount, edgeDensity, maxDepth, rootCount, cycleCount, componentCount, maxClusterSize };
}
