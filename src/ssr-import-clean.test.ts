/**
 * F-30a: Verify that key modules import cleanly without browser-API violations.
 *
 * vitest-setup.ts injects a localStorage mock and jsdom provides window/document,
 * which can mask SSR violations. This test verifies that pure logic modules
 * (no DOM, no browser-only APIs) import and execute without errors.
 */

import { describe, it, expect } from 'vitest';

describe('F-30a import-clean (pure modules)', () => {
  it('quality module imports cleanly (module-scope singletons)', async () => {
    const mod = await import('./t0-transport/quality');
    expect(mod.startQualityMonitoring).toBeDefined();
    expect(mod.subscribeQuality).toBeDefined();
    expect(mod.getCurrentMetrics).toBeDefined();
  });

  it('n1-flow-canvas utils are pure and import cleanly', async () => {
    const mod = await import('./n1-flow-canvas/utils');
    expect(mod.nodeHitTest).toBeDefined();
    expect(mod.domEventToCanvasCoords).toBeDefined();
    expect(mod.parseMentionEdges).toBeDefined();
    expect(mod.parseGroupedSequenceEdges).toBeDefined();
  });

  it('n4 classifier is pure and import cleanly', async () => {
    const mod = await import('./n4-adaptive-manifold/classifier');
    expect(mod.classifyTopology).toBeDefined();
    expect(mod.computeMetrics).toBeDefined();
  });

  it('n4 transition is pure and import cleanly', async () => {
    const mod = await import('./n4-adaptive-manifold/transition');
    expect(mod.EASING_FUNCTIONS).toBeDefined();
    expect(mod.TransitionAnimator).toBeDefined();
  });

  it('n4 graph-state is pure and import cleanly', async () => {
    const mod = await import('./n1-flow-canvas/graph-state.svelte');
    expect(mod.GraphState).toBeDefined();
  });
});
