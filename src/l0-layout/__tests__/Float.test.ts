// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import Float from '../Float.svelte';
import { useLayout } from '../useLayout';
import { __clearState } from '../state-map.svelte';

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  callback: ResizeObserverCallback;
  target: Element | null = null;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
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

function makeAnchor(rect?: Partial<DOMRectInit>): HTMLDivElement {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const full = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, ...rect };
  node.getBoundingClientRect = () =>
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

const PLACEMENTS = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
  'right',
  'right-start',
  'right-end',
] as const;

describe('Float primitive', () => {
  let originalRO: typeof ResizeObserver;
  let originalIO: typeof IntersectionObserver;

  beforeEach(() => {
    originalRO = globalThis.ResizeObserver;
    originalIO = globalThis.IntersectionObserver;
    ResizeObserverMock.instances = [];
    IntersectionObserverMock.instances = [];
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true });
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalRO;
    globalThis.IntersectionObserver = originalIO;
    __clearState();
    cleanup();
    document.body.innerHTML = '';
  });

  describe('placement positioning', () => {
    for (const placement of PLACEMENTS) {
      it(`positions correctly for placement="${placement}"`, async () => {
        const anchorBox = { x: 100, y: 100, width: 200, height: 50 };
        const anchor = makeAnchor(anchorBox);

        const layout = useLayout('test-anchor');
        layout.action(anchor);
        fireResize(anchor, anchorBox);

        const floatBox = { width: 80, height: 40 };

        const { container } = render(Float, {
          props: {
            attachTo: 'test-anchor',
            placement,
            children: undefined,
          },
        });

        const floatEl = container.querySelector('.float') as HTMLElement;
        expect(floatEl).not.toBeNull();

        floatEl.getBoundingClientRect = () =>
          ({
            x: 0,
            y: 0,
            width: floatBox.width,
            height: floatBox.height,
            top: 0,
            left: 0,
            right: floatBox.width,
            bottom: floatBox.height,
            toJSON: () => ({}),
          }) as DOMRect;
        Object.defineProperty(floatEl, 'offsetWidth', { value: floatBox.width, configurable: true });
        Object.defineProperty(floatEl, 'offsetHeight', { value: floatBox.height, configurable: true });

        await tick();
        await tick();
        await tick();
        await new Promise((r) => setTimeout(r, 50));

        const x = parseFloat(floatEl.style.getPropertyValue('--float-x'));
        const y = parseFloat(floatEl.style.getPropertyValue('--float-y'));

        expect(Number.isNaN(x)).toBe(false);
        expect(Number.isNaN(y)).toBe(false);

        const expected = expectedPosition(placement, anchorBox, floatBox);
        expect(Math.abs(x - expected.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(y - expected.y)).toBeLessThanOrEqual(1);
      });
    }
  });

  it('has is-hidden class when attachTo ID has no entry', () => {
    const { container } = render(Float, {
      props: {
        attachTo: 'missing-id',
        children: undefined,
      },
    });
    const floatEl = container.querySelector('.float');
    expect(floatEl).not.toBeNull();
    expect(floatEl?.classList.contains('is-hidden')).toBe(true);
  });

  it('re-positions when the anchor box changes', async () => {
    const anchor = makeAnchor({ x: 100, y: 100, width: 200, height: 50 });

    const layout = useLayout('reposition-test');
    layout.action(anchor);
    fireResize(anchor, { x: 100, y: 100, width: 200, height: 50 });

    const { container } = render(Float, {
      props: {
        attachTo: 'reposition-test',
        placement: 'bottom',
        children: undefined,
      },
    });

    const floatEl = container.querySelector('.float') as HTMLElement;
    expect(floatEl).not.toBeNull();

    floatEl.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: 80,
        height: 40,
        top: 0,
        left: 0,
        right: 80,
        bottom: 40,
        toJSON: () => ({}),
      }) as DOMRect;
    Object.defineProperty(floatEl, 'offsetWidth', { value: 80, configurable: true });
    Object.defineProperty(floatEl, 'offsetHeight', { value: 40, configurable: true });

    await tick();
    await tick();
    await tick();
    await new Promise((r) => setTimeout(r, 50));

    const initialX = parseFloat(floatEl.style.getPropertyValue('--float-x'));
    const initialY = parseFloat(floatEl.style.getPropertyValue('--float-y'));

    fireResize(anchor, { x: 300, y: 400, width: 200, height: 50 });

    await tick();
    await tick();
    await tick();
    await new Promise((r) => setTimeout(r, 50));

    const updatedX = parseFloat(floatEl.style.getPropertyValue('--float-x'));
    const updatedY = parseFloat(floatEl.style.getPropertyValue('--float-y'));

    expect(updatedX).not.toBe(initialX);
    expect(updatedY).not.toBe(initialY);
  });

  it('propagates bind:open from parent', async () => {
    const anchor = makeAnchor({ x: 100, y: 100, width: 200, height: 50 });
    const layout = useLayout('bind-test');
    layout.action(anchor);
    fireResize(anchor, { x: 100, y: 100, width: 200, height: 50 });

    let parentOpen = true;
    const { container } = render(Float, {
      props: {
        attachTo: 'bind-test',
        placement: 'bottom',
        open: parentOpen,
        children: undefined,
      },
    });

    const floatEl = container.querySelector('.float') as HTMLElement;
    expect(floatEl).not.toBeNull();

    floatEl.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: 80,
        height: 40,
        top: 0,
        left: 0,
        right: 80,
        bottom: 40,
        toJSON: () => ({}),
      }) as DOMRect;
    Object.defineProperty(floatEl, 'offsetWidth', { value: 80, configurable: true });
    Object.defineProperty(floatEl, 'offsetHeight', { value: 40, configurable: true });

    await tick();
    await tick();
    await tick();
    await new Promise((r) => setTimeout(r, 50));

    expect(floatEl.classList.contains('is-hidden')).toBe(false);

    parentOpen = false;
    // Re-render with updated open value
    ;(container._svelte?.scope?.?.flags?.?. reRender?.() || Promise.resolve()).then(() => {
      await tick();
      await tick();
    });

    expect(floatEl.classList.contains('is-hidden')).toBe(true);
  });
});
});

function expectedPosition(
  placement: string,
  anchor: { x: number; y: number; width: number; height: number },
  float: { width: number; height: number },
): { x: number; y: number } {
  const ax = anchor.x;
  const ay = anchor.y;
  const aw = anchor.width;
  const ah = anchor.height;
  const fw = float.width;
  const fh = float.height;

  let x = 0;
  let y = 0;

  switch (placement) {
    case 'top':
      x = ax + aw / 2 - fw / 2;
      y = ay - fh;
      break;
    case 'top-start':
      x = ax;
      y = ay - fh;
      break;
    case 'top-end':
      x = ax + aw - fw;
      y = ay - fh;
      break;
    case 'bottom':
      x = ax + aw / 2 - fw / 2;
      y = ay + ah;
      break;
    case 'bottom-start':
      x = ax;
      y = ay + ah;
      break;
    case 'bottom-end':
      x = ax + aw - fw;
      y = ay + ah;
      break;
    case 'left':
      x = ax - fw;
      y = ay + ah / 2 - fh / 2;
      break;
    case 'left-start':
      x = ax - fw;
      y = ay;
      break;
    case 'left-end':
      x = ax - fw;
      y = ay + ah - fh;
      break;
    case 'right':
      x = ax + aw;
      y = ay + ah / 2 - fh / 2;
      break;
    case 'right-start':
      x = ax + aw;
      y = ay;
      break;
    case 'right-end':
      x = ax + aw;
      y = ay + ah - fh;
      break;
  }

  return { x, y };
}