import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GraphState } from './graph-state.svelte';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('n1-flow-canvas/GraphState', () => {
  it('initializes with empty positions', () => {
    const gs = new GraphState();
    expect(gs.positions.size).toBe(0);
    expect(gs.bfsOrder).toEqual([]);
  });

  it('applyLayout sets positions and bfsOrder', () => {
    const gs = new GraphState();
    const positions = new Map([
      ['n1', { id: 'n1', x: 10, y: 20, width: 100, height: 50 }],
      ['n2', { id: 'n2', x: 200, y: 300, width: 80, height: 40 }],
    ]);
    gs.applyLayout({ positions, bfsOrder: ['n1', 'n2'] });
    vi.advanceTimersByTime(5000);
    expect(gs.positions.size).toBe(2);
    expect(gs.bfsOrder).toEqual(['n1', 'n2']);
  });

  it('setFocusCenter updates focusCenterId', () => {
    const gs = new GraphState();
    gs.setFocusCenter('n1');
    expect(gs.focusCenterId).toBe('n1');
  });

  it('setLayoutRoot updates layoutRootId', () => {
    const gs = new GraphState();
    gs.setLayoutRoot('n1');
    expect(gs.layoutRootId).toBe('n1');
  });

  it('setLayoutRoot calls onLayoutRootChange callback', () => {
    const gs = new GraphState();
    const callback = vi.fn();
    gs.onLayoutRootChange = callback;
    gs.setLayoutRoot('n1');
    expect(callback).toHaveBeenCalledWith('n1');
  });

  it('destroy cancels animation', () => {
    const gs = new GraphState();
    const positions = new Map([
      ['n1', { id: 'n1', x: 10, y: 20, width: 100, height: 50 }],
    ]);
    gs.applyLayout({ positions, bfsOrder: ['n1'] });
    gs.destroy();
    // Should not throw
    vi.advanceTimersByTime(5000);
  });

  it('new applyLayout replaces previous positions', () => {
    const gs = new GraphState();
    const positions1 = new Map([
      ['n1', { id: 'n1', x: 10, y: 20, width: 100, height: 50 }],
    ]);
    gs.applyLayout({ positions: positions1, bfsOrder: ['n1'] });
    vi.advanceTimersByTime(5000);

    const positions2 = new Map([
      ['n2', { id: 'n2', x: 50, y: 60, width: 80, height: 40 }],
    ]);
    gs.applyLayout({ positions: positions2, bfsOrder: ['n2'] });
    vi.advanceTimersByTime(5000);

    expect(gs.positions.size).toBe(1);
    expect(gs.positions.has('n2')).toBe(true);
    expect(gs.positions.has('n1')).toBe(false);
  });
});
