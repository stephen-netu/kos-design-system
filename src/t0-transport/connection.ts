// Connection status tracking

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ConnectionTracker {
  readonly state: ConnectionState;
  subscribe(fn: (state: ConnectionState) => void): () => void;
  setState(state: ConnectionState): void;
}

/**
 * Track connection status to Tauri backend
 */
export function createConnectionTracker(): ConnectionTracker {
  let state = $state<ConnectionState>('disconnected');
  const subscribers = new Set<(state: ConnectionState) => void>();

  function setState(newState: ConnectionState) {
    state = newState;
    subscribers.forEach(fn => fn(state));
  }

  function subscribe(fn: (state: ConnectionState) => void) {
    subscribers.add(fn);
    fn(state);
    return () => subscribers.delete(fn);
  }

  return {
    get state() { return state; },
    setState,
    subscribe,
  };
}
