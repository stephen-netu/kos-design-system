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
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
