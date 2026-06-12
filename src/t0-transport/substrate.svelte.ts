import type { UnlistenFn } from '@tauri-apps/api/event';
import { listen } from '@tauri-apps/api/event';
import { awaitTauriReady, invoke } from './invoke';

export type SubstrateState =
  | { status: 'starting' }
  | { status: 'connected'; seqno: number }
  | { status: 'reconnecting'; attempt: number }
  | { status: 'failed'; reason: string };

export interface SubstrateConnection {
  state: SubstrateState;
  init(): Promise<void>;
  retry(): Promise<void>;
  destroy(): void;
  isDegraded: boolean;
  retryLabel: string;
}

export interface CreateSubstrateConnectionOptions {
  getStateCommand?: string;
  stateEvent?: string;
  retryCommand?: string;
}

class SubstrateConnectionImpl implements SubstrateConnection {
  state = $state<SubstrateState>({ status: 'starting' });
  private unlisten: UnlistenFn | null = null;

  constructor(private readonly options: CreateSubstrateConnectionOptions = {}) {}

  get isDegraded(): boolean {
    return this.state.status === 'reconnecting' || this.state.status === 'failed';
  }

  get retryLabel(): string {
    return this.state.status === 'failed' ? 'Retry' : 'Reconnecting';
  }

  async init(): Promise<void> {
    this.destroy();
    const ready = await awaitTauriReady();
    if (!ready) {
      console.warn('[SubstrateConnection] Tauri bridge not available — skipping listeners');
      return;
    }

    try {
      this.state = await invoke<SubstrateState>(this.options.getStateCommand ?? 'substrate_get_state');
    } catch (error) {
      this.state = { status: 'failed', reason: error instanceof Error ? error.message : 'Unable to read substrate state' };
    }

    this.unlisten = await listen<SubstrateState>(this.options.stateEvent ?? 'substrate:state', (event) => {
      this.state = event.payload;
    });
  }

  async retry(): Promise<void> {
    this.state = { status: 'reconnecting', attempt: 0 };
    try {
      await invoke(this.options.retryCommand ?? 'substrate_retry');
    } catch (error) {
      this.state = { status: 'failed', reason: error instanceof Error ? error.message : 'Unable to retry substrate connection' };
    }
  }

  destroy(): void {
    this.unlisten?.();
    this.unlisten = null;
  }
}

export function createSubstrateConnection(
  options: CreateSubstrateConnectionOptions = {}
): SubstrateConnection {
  return new SubstrateConnectionImpl(options);
}
