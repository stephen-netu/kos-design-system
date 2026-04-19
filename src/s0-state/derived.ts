// Derived store helpers
// NOTE: $derived runes only work inside Svelte component context (.svelte files).
// This module is meant to be used from .svelte.ts files or component <script> blocks.

export interface DerivedOptions<T> {
  debug?: boolean;
}

export interface Derived<T> {
  readonly value: T;
  subscribe(fn: (value: T) => void): () => void;
}

/**
 * Create a derived value from source stores.
 * Must be called during component initialization (where $derived is valid).
 */
export function createDerived<T>(
  fn: () => T,
  options?: DerivedOptions<T>
): Derived<T> {
  const value = $derived(fn());
  const subscribers = new Set<(value: T) => void>();

  if (options?.debug) {
    $effect(() => {
      console.log(`[derived] Value:`, value);
    });
  }

  function subscribe(cb: (value: T) => void) {
    subscribers.add(cb);
    cb(value);
    return () => subscribers.delete(cb);
  }

  return {
    get value() { return value; },
    subscribe,
  };
}
