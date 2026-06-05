declare module '@tauri-apps/api/core' {
  export function invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
  export function convertFileSrc(filePath: string): string;
}

declare module '@tauri-apps/api/event' {
  export interface Event<T> {
    payload: T;
  }
  export type UnlistenFn = () => void;
  export function listen<T>(event: string, handler: (event: Event<T>) => void): Promise<UnlistenFn>;
  export function emit<T>(event: string, payload?: T): Promise<void>;
}

declare module '@tauri-apps/api/fs' {
  export function readTextFile(path: string): Promise<string>;
  export function writeTextFile(path: string, content: string): Promise<void>;
}
