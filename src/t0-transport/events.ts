// Event bus utilities for Tauri event streams

export interface EventBusOptions {
  debug?: boolean;
}

export interface EventBus {
  on<T>(event: string, handler: (payload: T) => void): Promise<() => void>;
  once<T>(event: string, handler: (payload: T) => void): Promise<() => void>;
  emit<T>(event: string, payload?: T): Promise<void>;
}

async function getTauriEvents() {
  const mod = await import('@tauri-apps/api/event');
  return { listen: mod.listen, emit: mod.emit };
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
    const { listen } = await getTauriEvents();
    const unlisten = await listen<T>(event, (e: { payload: T }) => {
      if (debug) console.log(`[event] ${event}:`, e.payload);
      handler(e.payload);
    });
    return unlisten;
  }

  async function once<T>(
    event: string,
    handler: (payload: T) => void
  ): Promise<() => void> {
    const { listen } = await getTauriEvents();
    const unlisten = await listen<T>(event, (e: { payload: T }) => {
      if (debug) console.log(`[event] ${event} (once):`, e.payload);
      handler(e.payload);
      unlisten();
    });
    return unlisten;
  }

  async function emit<T>(event: string, payload?: T): Promise<void> {
    if (debug) console.log('[event] emit %s:', event, payload);
    const { emit: tauriEmit } = await getTauriEvents();
    await tauriEmit(event, payload);
  }

  return { on, once, emit };
}
