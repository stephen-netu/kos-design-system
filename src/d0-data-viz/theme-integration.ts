/**
 * Theme Integration for D0 Data Viz
 *
 * This module provides integration with the LEAP theme system for
 * checkpoint visualization components. Colors are customizable via
 * the themeStore settings panel.
 *
 * @module d0-data-viz/theme
 *
 * @example
 * ```svelte
 * <script>
 *   import { CheckpointBar } from '@sov/design-system';
 *   import { themeStore } from '$lib/stores/themeStore.svelte';
 *
 *   // Colors automatically applied from themeStore
 *   // Users customize via Settings > Appearance > Checkpoint Colors
 * </script>
 *
 * <CheckpointBar {checkpoints} {currentSeqno} />
 * ```
 *
 * @example
 * ```typescript
 * // Programmatic color customization
 * import { themeStore } from '$lib/stores/themeStore.svelte';
 *
 * themeStore.setCustomToken('d0-checkpoint-rust', '#ff6b35');     // Orange rust
 * themeStore.setCustomToken('d0-checkpoint-ui', '#00d4aa');       // Teal UI
 * themeStore.setCustomToken('d0-checkpoint-substrate', '#ff3366'); // Pink substrate
 * ```
 */

import { getCheckpointColor } from './checkpoint-types';
import type { CheckpointComponentType } from './checkpoint-types';

/**
 * CSS variable names for checkpoint colors.
 * These are set by themeStore and consumed by CheckpointBar.
 */
export const CHECKPOINT_CSS_VARS: Record<CheckpointComponentType, string> = {
  'rust-crate': '--d0-checkpoint-rust',
  'ui-bundle': '--d0-checkpoint-ui',
  'config': '--d0-checkpoint-config',
  'faculty-state': '--d0-checkpoint-faculty',
  'substrate-binary': '--d0-checkpoint-substrate',
  'system-snapshot': '--d0-checkpoint-aggregate',
} as const;

/**
 * Human-readable labels for checkpoint color settings.
 * Use these in settings panel UI.
 */
export const CHECKPOINT_COLOR_LABELS: Record<CheckpointComponentType, string> = {
  'rust-crate': 'Rust Crate',
  'ui-bundle': 'UI Bundle',
  'config': 'Config File',
  'faculty-state': 'Faculty State',
  'substrate-binary': 'Substrate Binary',
  'system-snapshot': 'Aggregate Snapshot',
} as const;

/**
 * Default colors for light and dark themes.
 * Used when themeStore hasn't applied custom values.
 */
export const CHECKPOINT_DEFAULT_COLORS: Record<
  CheckpointComponentType,
  { light: string; dark: string }
> = {
  'rust-crate': { light: '#8a5a28', dark: '#b87333' },
  'ui-bundle': { light: '#2d6b6e', dark: '#5f9ea0' },
  'config': { light: '#7c6fae', dark: '#a99fd6' },
  'faculty-state': { light: '#d4a03d', dark: '#e6c470' },
  'substrate-binary': { light: '#c75a5a', dark: '#d98a8a' },
  'system-snapshot': { light: '#6b7280', dark: '#9ca3af' },
} as const;

/**
 * Get the effective checkpoint color for a component type.
 * Returns the themeStore CSS variable reference for runtime,
 * or a fallback color for SSR/initial render.
 *
 * @param type - The checkpoint component type
 * @param isDark - Whether to use dark theme fallback
 * @returns CSS color value (variable reference or hex)
 */
export function getEffectiveCheckpointColor(
  type: CheckpointComponentType,
  isDark = true
): string {
  // Return CSS variable reference for runtime
  // Browser will resolve from themeStore-set values
  const cssVar = CHECKPOINT_CSS_VARS[type];
  const fallback = getCheckpointColor(type, isDark);

  // For SSR safety, return fallback directly
  // For client-side, return CSS var with fallback
  if (typeof window === 'undefined') {
    return fallback;
  }

  return `var(${cssVar}, ${fallback})`;
}

/**
 * Re-export for convenience.
 * @deprecated Use getEffectiveCheckpointColor for theme-aware colors
 */
export { getCheckpointColor };

/**
 * Integration with themeStore CUSTOMIZABLE_TOKENS.
 *
 * These tokens are registered in themeStore and appear in the
 * settings panel under "Checkpoint" category.
 */
export const THEME_INTEGRATION = {
  /** Category name in settings panel */
  category: 'Checkpoint',

  /** Token prefix for checkpoint colors */
  tokenPrefix: 'd0-checkpoint-',

  /** All customizable checkpoint tokens */
  tokens: [
    { name: 'd0-checkpoint-rust', label: 'Rust Crate', component: 'rust-crate' },
    { name: 'd0-checkpoint-ui', label: 'UI Bundle', component: 'ui-bundle' },
    { name: 'd0-checkpoint-config', label: 'Config', component: 'config' },
    { name: 'd0-checkpoint-faculty', label: 'Faculty', component: 'faculty-state' },
    { name: 'd0-checkpoint-substrate', label: 'Substrate Binary', component: 'substrate-binary' },
    { name: 'd0-checkpoint-aggregate', label: 'Aggregate', component: 'system-snapshot' },
  ],
} as const;
