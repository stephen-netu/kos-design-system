import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { reveal } from './reveal';

// Scoped to this file only (installed in beforeEach, removed in afterEach) —
// a global IntersectionObserver polyfill in vitest-setup.ts changes which
// code path unrelated components (e.g. MarkmapDiagram's d3-zoom setup) take,
// crashing on jsdom's incomplete SVG support. Keep this local.
class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  callback: IntersectionObserverCallback;
  observedTargets: Element[] = [];
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverMock.instances.push(this);
  }
  observe(target: Element) { this.observedTargets.push(target); }
  unobserve(target: Element) { this.observedTargets = this.observedTargets.filter((t) => t !== target); }
  disconnect() { this.observedTargets = []; }
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

function lastObserver() {
  return IntersectionObserverMock.instances[IntersectionObserverMock.instances.length - 1];
}

function makeEntry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  return { target, isIntersecting } as IntersectionObserverEntry;
}

describe('reveal', () => {
  let node: HTMLElement;
  let originalIntersectionObserver: typeof IntersectionObserver | undefined;

  beforeEach(() => {
    originalIntersectionObserver = globalThis.IntersectionObserver;
    IntersectionObserverMock.instances = [];
    globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    node?.remove();
    globalThis.IntersectionObserver = originalIntersectionObserver as typeof IntersectionObserver;
  });

  it('adds the ds-reveal class on mount', () => {
    node = document.createElement('div');
    reveal(node);
    expect(node.classList.contains('ds-reveal')).toBe(true);
  });

  it('adds ds-reveal-in once the node intersects', () => {
    node = document.createElement('div');
    reveal(node);
    const observer = lastObserver();
    observer.callback([makeEntry(node, true)], observer as unknown as IntersectionObserver);
    expect(node.classList.contains('ds-reveal-in')).toBe(true);
  });

  it('does not add ds-reveal-in before intersecting', () => {
    node = document.createElement('div');
    reveal(node);
    expect(node.classList.contains('ds-reveal-in')).toBe(false);
  });

  it('sets --ds-reveal-delay when delayMs is passed', () => {
    node = document.createElement('div');
    reveal(node, { delayMs: 240 });
    expect(node.style.getPropertyValue('--ds-reveal-delay')).toBe('240ms');
  });

  it('removes ds-reveal-in on exit when once is false', () => {
    node = document.createElement('div');
    reveal(node, { once: false });
    const observer = lastObserver();
    observer.callback([makeEntry(node, true)], observer as unknown as IntersectionObserver);
    expect(node.classList.contains('ds-reveal-in')).toBe(true);
    observer.callback([makeEntry(node, false)], observer as unknown as IntersectionObserver);
    expect(node.classList.contains('ds-reveal-in')).toBe(false);
  });

  it('disconnects the observer on destroy', () => {
    node = document.createElement('div');
    const action = reveal(node);
    const observer = lastObserver();
    expect(observer.observedTargets).toContain(node);
    action?.destroy?.();
    expect(observer.observedTargets).not.toContain(node);
  });

  it('reveals immediately with no observer when prefers-reduced-motion is set', () => {
    const originalMatchMedia = window.matchMedia;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    });

    node = document.createElement('div');
    reveal(node);
    expect(node.classList.contains('ds-reveal-in')).toBe(true);
    expect(node.classList.contains('ds-reveal')).toBe(false);

    window.matchMedia = originalMatchMedia;
  });
});
