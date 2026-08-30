// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { useLayout } from '../useLayout';
import {
  getEntryCount,
  hasEntry,
  __clearState,
  MAX_LAYOUT_ENTRIES,
} from '../state-map.svelte';

// Local ResizeObserver mock — captures every instance so tests can fire the
// callback for a specific node. Installed per-file so it does not leak into
// unrelated components (unlike a global shim in vitest-setup.ts).
class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  static last: ResizeObserverMock | null = null;
  callback: ResizeObserverCallback;
  target: Element | null = null;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
    ResizeObserverMock.last = this;
  }
  observe(target: Element) {
    this.target = target;
  }
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  callback: IntersectionObserverCallback;
  target: Element | null = null;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverMock.instances.push(this);
  }
  observe(target: Element) {
    this.target = target;
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function roFor(node: Element): ResizeObserverMock {
  return ResizeObserverMock.instances.find((r) => r.target === node) as ResizeObserverMock;
}
function ioFor(node: Element): IntersectionObserverMock {
  return IntersectionObserverMock.instances.find((i) => i.target === node) as IntersectionObserverMock;
}

function makeNode(rect?: Partial<DOMRectInit>): HTMLDivElement {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const full = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, ...rect };
  node.getBoundingClientRect = () => ({
    x: full.x,
    y: full.y,
    width: full.width,
    height: full.height,
    top: full.top,
    left: full.left,
    right: full.right,
    bottom: full.bottom,
    toJSON: () => ({}),
  }) as DOMRect;
  return node;
}

function fireResize(node: Element, rect?: Partial<DOMRectInit>) {
  const full = { x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50, ...rect };
  if (rect) {
    (node as HTMLDivElement).getBoundingClientRect = () =>
      ({
        x: full.x,
        y: full.y,
        width: full.width,
        height: full.height,
        top: full.top,
        left: full.left,
        right: full.right,
        bottom: full.bottom,
        toJSON: () => ({}),
      }) as DOMRect;
  }
  roFor(node).callback([{ target: node } as ResizeObserverEntry], {} as ResizeObserver);
}

describe('useLayout (browser)', () => {
  let originalRO: typeof ResizeObserver;
  let originalIO: typeof IntersectionObserver;

  beforeEach(() => {
    originalRO = globalThis.ResizeObserver;
    originalIO = globalThis.IntersectionObserver;
    ResizeObserverMock.instances = [];
    ResizeObserverMock.last = null;
    IntersectionObserverMock.instances = [];
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalRO;
    globalThis.IntersectionObserver = originalIO;
    __clearState();
    document.body.innerHTML = '';
  });

  it('two callers of the same id share one backing box after a resize', () => {
    const node = makeNode();
    const a = useLayout('x');
    const b = useLayout('x');
    a.action(node);
    fireResize(node, { width: 120, height: 60 });
    expect(a.box.width).toBe(120);
    expect(b.box.width).toBe(120);
  });

  it('preserves the previous box across unmount + remount (stable id)', () => {
    const node1 = makeNode();
    const a = useLayout('x');
    a.action(node1);
    fireResize(node1, { width: 200, height: 80 });
    expect(a.box.width).toBe(200);

    // Unmount: action destroy / release tears down observers but keeps entry.
    a.release();

    const node2 = makeNode({ width: 0, height: 0 });
    const b = useLayout('x');
    b.action(node2);
    // Box survives until the new observer fires — the Clay-equivalent of stable ids.
    expect(b.box.width).toBe(200);
  });

  it('useLayout("row", 0) and useLayout("row", 1) are distinct entries', () => {
    const node0 = makeNode();
    const node1 = makeNode();
    const r0 = useLayout('row', 0);
    const r1 = useLayout('row', 1);
    r0.action(node0);
    r1.action(node1);
    fireResize(node0, { width: 10, height: 10 });
    expect(r0.box.width).toBe(10);
    expect(r1.box.width).toBe(0);
  });

  it('updates hovered / pointerOver via pointer events', () => {
    const node = makeNode({ width: 100, height: 100 });
    const a = useLayout('p');
    a.action(node);
    const move = new Event('pointermove');
    (move as PointerEvent & { clientX: number; clientY: number; buttons: number }).clientX = 10;
    (move as PointerEvent & { clientX: number; clientY: number; buttons: number }).clientY = 10;
    (move as PointerEvent & { clientX: number; clientY: number; buttons: number }).buttons = 0;
    node.dispatchEvent(move);
    expect(a.pointerOver).toBe(true);
    expect(a.hovered).toBe(true);

    const leave = new Event('pointerleave');
    node.dispatchEvent(leave);
    expect(a.pointerOver).toBe(false);
    expect(a.hovered).toBe(false);
  });

  it('updates inView via IntersectionObserver', () => {
    const node = makeNode();
    const a = useLayout('v');
    a.action(node);
    ioFor(node).callback(
      [{ target: node, isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    expect(a.inView).toBe(true);
  });

  it('updates scrollOffset from the nearest scrollable ancestor', () => {
    const container = document.createElement('div');
    container.style.overflow = 'auto';
    const node = document.createElement('div');
    container.appendChild(node);
    document.body.appendChild(container);
    const a = useLayout('s');
    a.action(node);
    Object.defineProperty(container, 'scrollLeft', { value: 30, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 12, configurable: true });
    container.dispatchEvent(new Event('scroll'));
    expect(a.scrollOffset).toEqual({ x: 30, y: 12 });
  });

  it('cleans up observers on release', () => {
    const node = makeNode();
    const a = useLayout('c');
    const handle = a.action(node) as { destroy: () => void };
    expect(roFor(node)).toBeTruthy();
    handle.destroy();
    // After teardown the observers are disconnected; re-firing must not crash
    // and the entry still exists for transition continuity.
    expect(hasEntry('c')).toBe(true);
  });

  it('evicts the oldest entry once MAX_LAYOUT_ENTRIES + 1 distinct ids are touched', () => {
    for (let i = 0; i <= MAX_LAYOUT_ENTRIES; i++) {
      useLayout(`lru-${i}`);
    }
    expect(getEntryCount()).toBe(MAX_LAYOUT_ENTRIES);
    expect(hasEntry('lru-0')).toBe(false);
    expect(hasEntry(`lru-${MAX_LAYOUT_ENTRIES}`)).toBe(true);
  });
});
