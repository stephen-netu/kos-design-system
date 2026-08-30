// L0 Layout — useLayout shared state map (adr:clay-inspired-layout-layer-001)
//
// Module-level reactive map keyed by `${id}-${index ?? ''}`. This is global
// state: a deliberate departure from Svelte 5 component-scoped reactivity so
// that one element id read from two components in a single mount tree resolves
// to one backing entry. The tradeoffs are declared in the parent ADR.
//
// Bounded by an LRU of MAX_LAYOUT_ENTRIES = 4096. When the 4097th distinct id
// is touched, the oldest entry is evicted. The cap is a module constant, not
// per-call. On the server (no window) the map is never instantiated.

import type { Action } from 'svelte/action';

export interface ElementState {
  box: DOMRect;
  hovered: boolean;
  pointerOver: boolean;
  scrollOffset: { x: number; y: number };
  inView: boolean;
}

export const MAX_LAYOUT_ENTRIES = 4096;

export type LayoutAction = Action<HTMLElement, void>;

/**
 * Build the internal map key. The optional `index` is the collision-safety
 * mechanism for the row-in-list case: the key becomes `${id}-${index}`, never
 * `${id}${index}`, so `useLayout("row", 0)` and `useLayout("row", 1)` stay
 * distinct.
 */
export function layoutKey(id: string, index?: number): string {
  return index === undefined ? id : `${id}-${index}`;
}

const isBrowser = typeof window !== 'undefined';

interface ObserverBundle {
  node: HTMLElement;
  resizeObserver: ResizeObserver;
  intersectionObserver: IntersectionObserver;
  scrollTarget: HTMLElement | Window | null;
  onScroll: () => void;
  onPointerEnter: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerLeave: () => void;
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  buttonsDown: number;
}

interface LayoutEntry extends ElementState {
  owners: Set<number>;
  bundle: ObserverBundle | null;
}

function makeZeroRect(): DOMRect {
  if (typeof DOMRect !== 'undefined') return new DOMRect(0, 0, 0, 0);
  return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 } as DOMRect;
}

function toRect(source: { x: number; y: number; width: number; height: number }): DOMRect {
  if (typeof DOMRect !== 'undefined') {
    return new DOMRect(source.x, source.y, source.width, source.height);
  }
  return {
    x: source.x,
    y: source.y,
    width: source.width,
    height: source.height,
    top: source.y,
    left: source.x,
    right: source.x + source.width,
    bottom: source.y + source.height,
  } as DOMRect;
}

let ownerSeq = 0;

export function nextOwnerId(): number {
  return ++ownerSeq;
}

// Reactive map. On the server we pass null so no Map object is built.
const store = $state<Map<string, LayoutEntry> | null>(
  isBrowser ? new Map<string, LayoutEntry>() : null
);

function evictOldest(): void {
  if (!store) return;
  const oldest = store.keys().next().value;
  if (oldest === undefined) return;
  const evicted = store.get(oldest);
  if (evicted?.bundle) teardownBundle(evicted.bundle);
  store.delete(oldest);
}

function createEntry(): LayoutEntry {
  return {
    box: makeZeroRect(),
    hovered: false,
    pointerOver: false,
    scrollOffset: { x: 0, y: 0 },
    inView: false,
    owners: new Set<number>(),
    bundle: null,
  };
}

/**
 * Get (or create) the reactive entry for a key. Creating a new key counts as a
 * touch and triggers LRU eviction when over capacity. Returns null on the
 * server, where the map is never instantiated.
 */
export function getState(key: string): LayoutEntry | null {
  if (!store) return null;
  let entry = store.get(key);
  if (!entry) {
    entry = createEntry();
    store.set(key, entry);
    if (store.size > MAX_LAYOUT_ENTRIES) evictOldest();
  }
  return store.get(key) ?? entry;
}

/** Number of live entries. Zero on the server. */
export function getEntryCount(): number {
  return store?.size ?? 0;
}

/** Whether a key currently has a backing entry. */
export function hasEntry(key: string): boolean {
  return store ? store.has(key) : false;
}

/** Test-only: drop every entry without tearing down (no DOM in unit scope). */
export function __clearState(): void {
  if (store) store.clear();
}

/**
 * Register an owner (one per action mount). Returns true when this is the
 * first owner, signalling the caller to wire observers.
 */
export function attach(key: string, ownerId: number): boolean {
  const entry = getState(key);
  if (!entry) return false;
  const wasEmpty = entry.owners.size === 0;
  entry.owners.add(ownerId);
  return wasEmpty;
}

/**
 * Remove an owner. Returns true when this was the last owner, signalling the
 * caller to tear down observers. The entry itself stays in the map (for
 * remount / transition continuity) until the LRU evicts it.
 */
export function detach(key: string, ownerId: number): boolean {
  const entry = store?.get(key);
  if (!entry || !entry.owners.has(ownerId)) return false;
  entry.owners.delete(ownerId);
  return entry.owners.size === 0;
}

export function getBundle(key: string): ObserverBundle | null {
  return store?.get(key)?.bundle ?? null;
}

export function setBundle(key: string, bundle: ObserverBundle): void {
  if (!store) return;
  const entry = store.get(key);
  if (entry) entry.bundle = bundle;
}

export function clearBundle(key: string): void {
  if (!store) return;
  const entry = store.get(key);
  if (entry) entry.bundle = null;
}

function findScrollParent(node: HTMLElement): HTMLElement | Window {
  let el: HTMLElement | null = node.parentElement;
  while (el) {
    const cs = getComputedStyle(el);
    const oy = el.style.overflowY || el.style.overflow || cs.overflowY;
    const ox = el.style.overflowX || el.style.overflow || cs.overflowX;
    if (oy === 'auto' || oy === 'scroll' || ox === 'auto' || ox === 'scroll') return el;
    el = el.parentElement;
  }
  return window;
}

function readScrollOffset(target: HTMLElement | Window): { x: number; y: number } {
  if (target === window) {
    return { x: window.scrollX || 0, y: window.scrollY || 0 };
  }
  const el = target as HTMLElement;
  return { x: el.scrollLeft || 0, y: el.scrollTop || 0 };
}

function updatePointer(entry: LayoutEntry, node: HTMLElement, ev: PointerEvent): void {
  const rect = node.getBoundingClientRect();
  const x = ev.clientX;
  const y = ev.clientY;
  const inside =
    x >= rect.left &&
    x <= rect.left + rect.width &&
    y >= rect.top &&
    y <= rect.top + rect.height;
  entry.pointerOver = inside;
  entry.hovered = inside && ev.buttons === 0;
  entry.box = toRect(rect);
}

/**
 * Wire the ResizeObserver, IntersectionObserver, scroll, and pointer listeners
 * for a freshly-attached node. Writes straight into the reactive `entry` so
 * component reads update. Returns the bundle for later teardown.
 */
export function attachObservers(key: string, node: HTMLElement, entry: LayoutEntry): ObserverBundle {
  const resizeObserver = new ResizeObserver((entries) => {
    const target = entries[0]?.target ?? node;
    const rect = (target as HTMLElement).getBoundingClientRect();
    entry.box = toRect(rect);
  });

  const intersectionObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.target === node) entry.inView = e.isIntersecting;
    }
  });

  const scrollTarget = findScrollParent(node);

  const onScroll = () => {
    entry.scrollOffset = readScrollOffset(scrollTarget);
  };

  const onPointerEnter = (e: PointerEvent) => updatePointer(entry, node, e);
  const onPointerMove = (e: PointerEvent) => updatePointer(entry, node, e);
  const onPointerLeave = () => {
    entry.pointerOver = false;
    entry.hovered = false;
  };
  const onPointerDown = (e: PointerEvent) => {
    bundle.buttonsDown += 1;
    updatePointer(entry, node, e);
  };
  const onPointerUp = (e: PointerEvent) => {
    bundle.buttonsDown = Math.max(0, bundle.buttonsDown - 1);
    updatePointer(entry, node, e);
  };

  const bundle: ObserverBundle = {
    node,
    resizeObserver,
    intersectionObserver,
    scrollTarget,
    onScroll,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
    onPointerDown,
    onPointerUp,
    buttonsDown: 0,
  };

  resizeObserver.observe(node);
  intersectionObserver.observe(node);
  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  node.addEventListener('pointerenter', onPointerEnter);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerleave', onPointerLeave);
  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointerup', onPointerUp);

  // Seed scroll offset so reads are live before the first scroll event. Box is
  // intentionally NOT seeded here: the ResizeObserver (which fires on observe in
  // a real browser) sets it, and leaving it untouched preserves the previous
  // box across a remount / for transition continuity until the observer fires.
  entry.scrollOffset = readScrollOffset(scrollTarget);

  return bundle;
}

/** Disconnect every observer and listener held by a bundle. */
export function teardownBundle(bundle: ObserverBundle): void {
  bundle.resizeObserver.disconnect();
  bundle.intersectionObserver.disconnect();
  if (bundle.scrollTarget) {
    bundle.scrollTarget.removeEventListener('scroll', bundle.onScroll);
  }
  const node = bundle.node;
  node.removeEventListener('pointerenter', bundle.onPointerEnter);
  node.removeEventListener('pointermove', bundle.onPointerMove);
  node.removeEventListener('pointerleave', bundle.onPointerLeave);
  node.removeEventListener('pointerdown', bundle.onPointerDown);
  node.removeEventListener('pointerup', bundle.onPointerUp);
}

/** Frozen SSR stub: documented ElementState shape, no observers, no throw. */
export function createStubState(): ElementState & { release: () => void; action: LayoutAction } {
  const stub = Object.freeze({
    box: makeZeroRect(),
    hovered: false,
    pointerOver: false,
    scrollOffset: { x: 0, y: 0 },
    inView: false,
  });
  return Object.freeze({
    ...stub,
    release: () => {},
    action: (() => ({})) as LayoutAction,
  }) as ElementState & { release: () => void; action: LayoutAction };
}
