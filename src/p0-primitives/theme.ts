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

  // Accent (brass — energized signal, use sparingly)
  colorAccent: '#b87333',
  colorAccentHover: '#d4892f',
  colorAccentActive: '#8a5526',
  colorAccentSubtle: 'rgba(184, 115, 51, 0.08)',
  colorAccentGlow: 'rgba(184, 115, 51, 0.28)',
  colorAccentMuted: 'rgba(184, 115, 51, 0.16)',
  colorAccentFaint: 'rgba(184, 115, 51, 0.04)',

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

  // Accent (brass — same in both modes)
  colorAccent: '#b87333',
  colorAccentHover: '#c9894f',
  colorAccentActive: '#9a5f2a',
  colorAccentSubtle: 'rgba(184, 115, 51, 0.12)',
  colorAccentGlow: 'rgba(184, 115, 51, 0.2)',
  colorAccentMuted: 'rgba(184, 115, 51, 0.15)',
  colorAccentFaint: 'rgba(184, 115, 51, 0.06)',

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

  colorAccent: '#00ff41',
  colorAccentHover: '#33ff66',
  colorAccentActive: '#00cc33',
  colorAccentSubtle: 'rgba(0, 255, 65, 0.1)',
  colorAccentGlow: 'rgba(0, 255, 65, 0.3)',
  colorAccentMuted: 'rgba(0, 255, 65, 0.2)',
  colorAccentFaint: 'rgba(0, 255, 65, 0.05)',

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
  colorAccent: '#b87333',
  colorAccentHover: '#d4892f',
  colorAccentActive: '#8a5526',
  colorAccentSubtle: 'rgba(184, 115, 51, 0.08)',
});

/**
 * Copper accent theme variant — reddish metallic (preserved for compatibility)
 */
export const copperAccentTheme: ThemeConfig = createTheme(defaultDarkTheme, {
  colorAccent: '#b87333',
  colorAccentHover: '#c98444',
  colorAccentActive: '#a05f2a',
  colorAccentSubtle: 'rgba(184, 115, 51, 0.08)',
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
  colorAccent: '#ffcc00',
  colorAccentHover: '#ffdd33',
  colorAccentActive: '#e6b800',
});
