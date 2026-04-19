// Event bus utilities for Tauri event streams

import { listen, emit as tauriEmit, type UnlistenFn } from '@tauri-apps/api/event';

export interface EventBusOptions {
  debug?: boolean;
}

export interface EventBus {
  on<T>(event: string, handler: (payload: T) => void): Promise<() => void>;
  once<T>(event: string, handler: (payload: T) => void): Promise<() => void>;
  emit<T>(event: string, payload?: T): Promise<void>;
}

/**
 * Create an event bus for Tauri events
 */
export function createEventBus(options?: EventBusOptions): EventBus {
  const debug = options?.debug ?? false;

  async function on<T>(
    event: string,
    handler: (payload: T) => void
  ): Promise<() => void> {
    const unlisten = await listen<T>(event, (e) => {
      if (debug) console.log(`[event] ${event}:`, e.payload);
      handler(e.payload);
    });
    return unlisten;
  }

  async function once<T>(
    event: string,
    handler: (payload: T) => void
  ): Promise<() => void> {
    const unlisten = await listen<T>(event, (e) => {
      if (debug) console.log(`[event] ${event} (once):`, e.payload);
      handler(e.payload);
      unlisten();
    });
    return unlisten;
  }

  async function emit<T>(event: string, payload?: T): Promise<void> {
    if (debug) console.log('[event] emit %s:', event, payload);
    await tauriEmit(event, payload);
  }

  return { on, once, emit };
}
