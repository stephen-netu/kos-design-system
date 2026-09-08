// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
  observe(target: Element) { this.target = target; }
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverMock.instances.push(this);
  }
  observe() {} unobserve() {} disconnect() {}
  takeRecords() { return []; }
}

function roFor(node: Element): ResizeObserverMock {
  return ResizeObserverMock.instances.find((r) => r.target === node) as ResizeObserverMock;
}

function makeAnchor(rect?: Partial<DOMRectInit>): HTMLDivElement {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const full = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, ...rect };
  node.getBoundingClientRect = () => ({ ...full, toJSON: () => ({}) } as DOMRect);
  return node;
}

function fireResize(node: Element, rect?: Partial<DOMRectInit>) {
  const full = { x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50, ...rect };
  if (rect) {
    (node as HTMLDivElement).getBoundingClientRect = () => ({ ...full, toJSON: () => ({}) } as DOMRect);
  }
  roFor(node).callback([{ target: node } as ResizeObserverEntry], {} as ResizeObserver);
}

describe('debug', () => {
  beforeEach(() => {
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true });
  });
  afterEach(() => {
    __clearState();
    cleanup();
    document.body.innerHTML = '';
  });

  it('debug reposition', async () => {
    const anchor = makeAnchor({ x: 100, y: 100, width: 200, height: 50 });
    const layout = useLayout('reposition-test');
    layout.action(anchor);
    fireResize(anchor, { x: 100, y: 100, width: 200, height: 50 });
    
    console.log('initial layout.box:', JSON.stringify({ x: layout.box.x, y: layout.box.y }));
    
    const { container } = render(Float, {
      props: { attachTo: 'reposition-test', placement: 'bottom', children: undefined },
    });
    
    const floatEl = container.querySelector('.float') as HTMLElement;
    floatEl.getBoundingClientRect = () => ({ x: 0, y: 0, width: 80, height: 40, top: 0, left: 0, right: 80, bottom: 40, toJSON: () => ({}) } as DOMRect);
    Object.defineProperty(floatEl, 'offsetWidth', { value: 80, configurable: true });
    Object.defineProperty(floatEl, 'offsetHeight', { value: 40, configurable: true });
    
    await tick();
    await tick();
    await tick();
    await new Promise(r => setTimeout(r, 50));
    
    const initialX = parseFloat(floatEl.style.getPropertyValue('--float-x'));
    const initialY = parseFloat(floatEl.style.getPropertyValue('--float-y'));
    console.log('initial position:', initialX, initialY);
    
    console.log('layout.box before resize:', JSON.stringify({ x: layout.box.x, y: layout.box.y }));
    fireResize(anchor, { x: 300, y: 400, width: 200, height: 50 });
    console.log('layout.box after resize:', JSON.stringify({ x: layout.box.x, y: layout.box.y }));
    
    await tick();
    await tick();
    await tick();
    await new Promise(r => setTimeout(r, 50));
    
    const updatedX = parseFloat(floatEl.style.getPropertyValue('--float-x'));
    const updatedY = parseFloat(floatEl.style.getPropertyValue('--float-y'));
    console.log('updated position:', updatedX, updatedY);
    
    expect(true).toBe(true);
  });
});
