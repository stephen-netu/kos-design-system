// Type-safe invoke wrapper for Tauri commands

import { invoke as tauriInvoke } from '@tauri-apps/api/core';

export interface CommandDefinition<T = unknown, R = unknown> {
  name: string;
  payload?: T;
  response?: R;
}

/**
 * Invoke a Tauri command with type safety
 */
export async function invoke<R, T extends Record<string, unknown> = Record<string, unknown>>(
  command: string,
  payload?: T
): Promise<R> {
  try {
    return await tauriInvoke<R>(command, payload ? { ...payload } : undefined);
  } catch (error) {
    throw new Error(`Invoke failed: ${command} — ${error}`);
  }
}

/**
 * Check if running in Tauri environment (synchronous, immediate result)
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Synchronous check: is the Tauri bridge injected right now?
 * Use for conditional rendering. Use awaitTauriReady() for init paths.
 */
export function isTauriReady(): boolean {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ != null;
}

/**
 * Polls until window.__TAURI_INTERNALS__ is available (up to 5 seconds).
 * All store init() methods that call invoke() or listen() must await this first.
 * Returns false if bridge is not available (browser/Playwright context).
 */
export async function awaitTauriReady(): Promise<boolean> {
  const MAX_WAIT_MS = 5000;
  const POLL_INTERVAL_MS = 50;
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    if (isTauriReady()) return true;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  console.warn('[t0-transport] Tauri bridge not available after 5s — running outside WebView?');
  return false;
}
