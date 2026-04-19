// Base store factory using Svelte 5 runes
// This provides reactive state management without Svelte 4's writable/readable

export interface PersistenceConfig {
  key: string;
  storage: 'localStorage' | 'IndexedDB';
  serialize?: (value: unknown) => string;
  deserialize?: (value: string) => unknown;
}

export interface StoreOptions<T> {
  initial: T;
  persist?: PersistenceConfig;
  debug?: boolean;
}

interface Store<T> {
  readonly value: T;
  set(value: T): void;
  update(fn: (value: T) => T): void;
  subscribe(fn: (value: T) => void): () => void;
}

/**
 * Create a reactive store using Svelte 5 runes
 */
export function createStore<T>(options: StoreOptions<T>): Store<T> {
  let value = $state(options.initial);
  const subscribers = new Set<(value: T) => void>();

  // Handle persistence
  if (options.persist) {
    if (typeof window !== 'undefined' && options.persist.storage === 'localStorage') {
      const stored = localStorage.getItem(options.persist.key);
      if (stored) {
        try {
          const deserialized = options.persist.deserialize
            ? options.persist.deserialize(stored)
            : JSON.parse(stored);
          value = deserialized as T;
        } catch (e) {
          console.warn('[store] Failed to deserialize stored value for key:', options.persist.key, e);
        }
      }

      // Set up effect to persist changes.
      // $effect.root() so this works whether createStore() is called at module
      // level (outside any component) or inside a component.
      $effect.root(() => {
        $effect(() => {
          const serialized = options.persist!.serialize
            ? options.persist!.serialize(value)
            : JSON.stringify(value);
          localStorage.setItem(options.persist!.key, serialized);
        });
      });
    }
  }

  function set(newValue: T) {
    value = newValue;
    if (options.debug) {
      console.log(`[store] Set:`, value);
    }
    subscribers.forEach(fn => fn(value));
  }

  function update(fn: (value: T) => T) {
    set(fn(value));
  }

  function subscribe(fn: (value: T) => void) {
    subscribers.add(fn);
    fn(value); // Immediate call with current value
    return () => subscribers.delete(fn);
  }

  return {
    get value() { return value; },
    set,
    update,
    subscribe,
  };
}
