/**
 * Command Palette — Slash command interface for LEAP
 * 
 * Exports:
 * - CommandPalette.svelte — Main UI component
 * - command-types.ts — TypeScript type definitions (mirror of i0-primitives)
 * - commandStore.svelte.ts — Svelte 5 runes store for registry + execution
 * 
 * HDA: u0-primitives (atom component)
 * Domain: Interfaces (I)
 * Layer: 0-1 (pure types → mediation)
 */

export { default as CommandPalette } from './CommandPalette.svelte';
export { commandStore } from './commandStore.svelte';
export type {
  CommandId,
  CommandPath,
  CommandContext,
  ParameterType,
  AutocompleteSource,
  CommandParameter,
  CommandSchema,
  InvocationContext,
  CommandResult,
  ValidationError,
  ParseResult,
  ICommandRegistry,
  CommandUIState,
  ActiveCommandSession,
} from './command-types';
