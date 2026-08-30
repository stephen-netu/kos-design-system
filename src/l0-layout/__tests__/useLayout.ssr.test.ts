// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { useLayout } from '../useLayout';
import { createStubState } from '../state-map.svelte';

// Runs in a node harness (no window), exercising the SSR stub path without a DOM.

describe('useLayout SSR stub (node)', () => {
  it('returns a frozen ElementState-shaped stub and does not throw', () => {
    const layout = useLayout('x');
    expect(Object.isFrozen(layout)).toBe(true);
    expect(layout.box.width).toBe(0);
    expect(layout.box.height).toBe(0);
    expect(layout.box.top).toBe(0);
    expect(layout.hovered).toBe(false);
    expect(layout.pointerOver).toBe(false);
    expect(layout.inView).toBe(false);
    expect(layout.scrollOffset).toEqual({ x: 0, y: 0 });
    expect(typeof layout.release).toBe('function');
    expect(typeof layout.action).toBe('function');
    expect(() => layout.release()).not.toThrow();
  });

  it('action is a no-op on the server', () => {
    const layout = useLayout('y');
    const result = (layout.action as unknown as () => Record<string, never>)();
    expect(result).toEqual({});
  });

  it('createStubState matches the documented shape', () => {
    const stub = createStubState();
    expect(Object.isFrozen(stub)).toBe(true);
    expect(stub.box.width).toBe(0);
    expect(stub.hovered).toBe(false);
    expect(stub.scrollOffset).toEqual({ x: 0, y: 0 });
  });
});
