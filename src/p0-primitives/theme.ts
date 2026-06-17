/**
 * Theme Utilities
 *
 * Factory functions for creating and composing themes.
 *
 * ADR: 2026-05-04-openui-generative-ui-integration
 */

import type { ThemeConfig } from './ThemeProvider.svelte';

/**
 * Create a theme by merging overrides with a base theme
 */
export function createTheme(
  base: ThemeConfig,
  overrides: Partial<ThemeConfig>
): ThemeConfig {
  return {
    ...base,
    ...overrides,
  };
}

/**
 * Default dark theme — Neo-brutalist industrial
 * Charcoal surfaces, brass accent, telemetry palette
 */
export const defaultDarkTheme: ThemeConfig = {
  // Backgrounds (charcoal depth)
  colorBgPrimary: '#0b0d0f',
  colorBgSecondary: '#121518',
  colorBgTertiary: '#181c20',
  colorBgPanelElevated: '#20252a',
  colorBgInset: '#0a0a0a',

  // Foregrounds (warm silkscreen on dark)
  colorFgPrimary: '#e8e0d0',
  colorFgSecondary: '#a8a08c',
  colorFgTertiary: '#6b6558',
  colorFgMuted: '#3a3630',

  // Accent — SEED ONLY. tokens.css derives hover/active/subtle/glow/muted/faint
  // from --accent-primary via color-mix; emitting derived values here would
  // override and de-sync the single-seed engine (re-introducing the brass leak).
  colorAccent: '#b87333',

  // Telemetry
  colorSuccess: '#4fa8a2',
  colorWarning: '#d4a04c',
  colorError: '#c14a4a',
  colorInfo: '#5b8db8',

  // Typography
  fontSans: "'Outfit', system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",

  // Animation
  durationFast: '100ms',
  durationNormal: '200ms',
  durationSlow: '300ms',
};

/**
 * Default light theme — warm desk surface
 */
export const defaultLightTheme: ThemeConfig = {
  // Backgrounds (warm desk)
  colorBgPrimary: '#d4d0c8',
  colorBgSecondary: '#e8e4dc',
  colorBgTertiary: '#c9c5bd',
  colorBgPanelElevated: '#d9d5cd',
  colorBgInset: '#bfbbb3',

  // Foregrounds (dark on light)
  colorFgPrimary: '#2a2a2a',
  colorFgSecondary: '#5a5a5a',
  colorFgTertiary: '#8a8a8a',
  colorFgMuted: '#a0a0a0',

  // Accent — SEED ONLY (CSS engine derives the ramp).
  colorAccent: '#b87333',

  // Feedback
  colorSuccess: '#5a8a6e',
  colorWarning: '#b8956b',
  colorError: '#a65e5e',
  colorInfo: '#6b8a9c',

  // Typography
  fontSans: "'Outfit', system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",

  // Animation
  durationFast: '100ms',
  durationNormal: '200ms',
  durationSlow: '300ms',
};

/**
 * Control Room theme — terminal green / CRT aesthetic (opt-in alternate)
 */
export const controlRoomTheme: ThemeConfig = {
  colorBgPrimary: '#0a0a0a',
  colorBgSecondary: '#111111',
  colorBgTertiary: '#141414',
  colorBgPanelElevated: '#1a1a1a',
  colorBgInset: '#080808',

  colorFgPrimary: '#e8e8e8',
  colorFgSecondary: '#888888',
  colorFgTertiary: '#555555',
  colorFgMuted: '#333333',

  // Accent — SEED ONLY (CSS engine derives the ramp).
  colorAccent: '#00ff41',

  colorSuccess: '#00ff41',
  colorWarning: '#ff8c00',
  colorError: '#ff3131',
  colorInfo: '#00bfff',

  fontSans: "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', ui-monospace, monospace",
  fontMono: "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', ui-monospace, monospace",

  durationFast: '50ms',
  durationNormal: '100ms',
  durationSlow: '150ms',
};

/**
 * Brass accent theme variant — warm metallic (preserved for compatibility)
 */
export const brassAccentTheme: ThemeConfig = createTheme(defaultDarkTheme, {
  colorAccent: '#b87333', // seed only — ramp derived by the CSS engine
});

/**
 * Copper accent theme variant — reddish metallic (preserved for compatibility)
 */
// Copper = reddish metallic, distinct from brass (#b87333 is yellow-gold).
// The CSS engine derives the ramp from this seed, so hover/active/glow
// all shift toward the red-copper character automatically.
export const copperAccentTheme: ThemeConfig = createTheme(defaultDarkTheme, {
  colorAccent: '#b85533', // seed only — reddish copper
});

/**
 * High contrast accessibility theme
 */
export const highContrastTheme: ThemeConfig = createTheme(defaultDarkTheme, {
  colorBgPrimary: '#000000',
  colorBgSecondary: '#111111',
  colorFgPrimary: '#ffffff',
  colorFgSecondary: '#eeeeee',
  colorFgMuted: '#aaaaaa',
  colorAccent: '#ffcc00', // seed only — ramp derived by the CSS engine
});
