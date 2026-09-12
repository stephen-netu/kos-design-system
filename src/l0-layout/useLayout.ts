// L0 Layout — useLayout action helper (adr:clay-inspired-layout-layer-001)
//
// Returns stable per-element state (box, hovered, pointerOver, scrollOffset,
// inView) across renders, backed by web platform observers. The same id read
// from two components in one mount tree resolves to one shared backing entry
// held in the module-level state map (see state-map.svelte.ts).
//
// Usage:
//   const layout = useLayout(row, index);
//   <div use:layout.action class:is-hovered={layout.hovered}>…</div>
//   onDestroy(() => layout.release());
//
// The `action` shape matches the existing `use:reveal` convention. No
// `{@attach}` — that pattern is not used in this codebase.

import type { Action } from 'svelte/action';
import {
  type ElementState,
  layoutKey,
  getState,
  attach,
  detach,
  attachObservers,
  teardownBundle,
  getBundle,
  setBundle,
  clearBundle,
  createStubState,
  nextOwnerId,
} from './state-map.svelte';

export interface UseLayoutReturn extends ElementState {
  version: number;
  release: () => void;
  action: Action<HTMLElement, void>;
}

/**
 * Bind per-element layout state for `id`, optionally disambiguated by `index`
 * (the row-in-list collision-safety case: key becomes `${id}-${index}`).
 *
 * On the server returns a frozen `ElementState` stub and is a no-op. In the
 * browser the returned `action` registers the DOM node with the shared state
 * map; `release()` removes this call's ownership and, when it is the last
 * owner, tears down observers. The entry survives until the LRU evicts it, so
 * a remount sees the last-known box.
 */
export function useLayout(id: string, index?: number): UseLayoutReturn {
  if (typeof window === 'undefined') {
    return createStubState() as UseLayoutReturn;
  }

  const key = layoutKey(id, index);
  const ownerId = nextOwnerId();

  const release = (): void => {
    const isLast = detach(key, ownerId);
    if (isLast) {
      const bundle = getBundle(key);
      if (bundle) {
        teardownBundle(bundle);
        clearBundle(key);
      }
    }
  };

  const action: Action<HTMLElement, void> = (node) => {
    const isPrimary = attach(key, ownerId);
    if (isPrimary) {
      const entry = getState(key);
      if (entry) {
        const bundle = attachObservers(key, node, entry);
        setBundle(key, bundle);
      }
    }
    return {
      destroy() {
        release();
      },
    };
  };

  const entry = getState(key);
  if (!entry) {
    // Server guard already returned above; this branch is unreachable in the
    // browser, but keeps the type-narrowing honest.
    return createStubState() as UseLayoutReturn;
  }

  return {
    get box() {
      return entry.box;
    },
    get version() {
      return entry.version;
    },
    get hovered() {
      return entry.hovered;
    },
    get pointerOver() {
      return entry.pointerOver;
    },
    get scrollOffset() {
      return entry.scrollOffset;
    },
    get inView() {
      return entry.inView;
    },
    release,
    action,
  };
}
