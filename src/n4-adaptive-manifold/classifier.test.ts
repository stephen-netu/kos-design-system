import { describe, it, expect } from 'vitest';
import { classifyTopology, computeMetrics, STABILITY_TICKS } from './classifier';
import { EASING_FUNCTIONS, TransitionAnimator } from './transition';
import type { ManifoldSnapshot } from './types';

function makeSnapshot(nodes: string[], edges: Array<{ source: string; target: string }>): ManifoldSnapshot {
  return {
    nodes: nodes.map((id) => ({ id, label: id, weight: 1, type: 'default' as const })),
    edges: edges.map((e, i) => ({ id: `e-${i}`, source: e.source, target: e.target })),
  };
}

describe('n4-adaptive-manifold/classifier', () => {
  it('recommends manifold for any graph', () => {
    const snapshot = makeSnapshot(['a', 'b', 'c'], [{ source: 'a', target: 'b' }]);
    const result = classifyTopology(snapshot);
    expect(result.recommended).toBe('manifold');
    expect(result.confidence).toBe(1.0);
  });

  it('returns empty metrics for empty snapshot', () => {
    const snapshot = makeSnapshot([], []);
    const metrics = computeMetrics(snapshot);
    expect(metrics.nodeCount).toBe(0);
    expect(metrics.edgeCount).toBe(0);
    expect(metrics.edgeDensity).toBe(0);
  });

  it('computes correct node/edge counts', () => {
    const snapshot = makeSnapshot(['a', 'b', 'c'], [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ]);
    const metrics = computeMetrics(snapshot);
    expect(metrics.nodeCount).toBe(3);
    expect(metrics.edgeCount).toBe(2);
    expect(metrics.edgeDensity).toBeCloseTo(2 / 3);
  });

  it('detects cycles in directed graph', () => {
    const snapshot = makeSnapshot(['a', 'b', 'c'], [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'a' },
    ]);
    const metrics = computeMetrics(snapshot);
    expect(metrics.cycleCount).toBeGreaterThan(0);
  });

  it('counts roots (in-degree 0)', () => {
    const snapshot = makeSnapshot(['a', 'b', 'c'], [
      { source: 'a', target: 'b' },
      { source: 'a', target: 'c' },
    ]);
    const metrics = computeMetrics(snapshot);
    expect(metrics.rootCount).toBe(1);
  });

  it('computes max depth via BFS from roots', () => {
    const snapshot = makeSnapshot(['a', 'b', 'c', 'd'], [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'd' },
    ]);
    const metrics = computeMetrics(snapshot);
    expect(metrics.maxDepth).toBe(3);
  });

  it('counts connected components', () => {
    const snapshot = makeSnapshot(['a', 'b', 'c', 'd'], [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'd' },
    ]);
    const metrics = computeMetrics(snapshot);
    expect(metrics.componentCount).toBe(2);
  });

  it('tracks max cluster size', () => {
    const snapshot = makeSnapshot(['a', 'b', 'c', 'd'], [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'd', target: 'd' },
    ]);
    const metrics = computeMetrics(snapshot);
    expect(metrics.maxClusterSize).toBe(3);
  });

  it('STABILITY_TICKS is 3', () => {
    expect(STABILITY_TICKS).toBe(3);
  });
});

describe('n4-adaptive-manifold/transition', () => {
  it('EASING_FUNCTIONS contains expected names', () => {
    expect(EASING_FUNCTIONS).toHaveProperty('linear');
    expect(EASING_FUNCTIONS).toHaveProperty('easeInOutCubic');
    expect(EASING_FUNCTIONS).toHaveProperty('easeOutExpo');
    expect(EASING_FUNCTIONS).toHaveProperty('spring');
  });

  it('linear easing returns t unchanged', () => {
    expect(EASING_FUNCTIONS.linear(0)).toBe(0);
    expect(EASING_FUNCTIONS.linear(0.5)).toBe(0.5);
    expect(EASING_FUNCTIONS.linear(1)).toBe(1);
  });

  it('easeInOutCubic is clamped to [0,1]', () => {
    expect(EASING_FUNCTIONS.easeInOutCubic(0)).toBe(0);
    expect(EASING_FUNCTIONS.easeInOutCubic(1)).toBe(1);
    expect(EASING_FUNCTIONS.easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });

  it('TransitionAnimator cancels without error', () => {
    const animator = new TransitionAnimator();
    expect(animator.active).toBe(false);
    animator.cancel();
    expect(animator.active).toBe(false);
  });
});
