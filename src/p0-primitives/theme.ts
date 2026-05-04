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
 * Default dark theme — KOS standard
 */
export const defaultDarkTheme: ThemeConfig = {
  // Backgrounds (dark)
  colorBgPrimary: '#141414',
  colorBgSecondary: '#1a1a1a',
  colorBgTertiary: '#222222',
  
  // Foregrounds (light on dark)
  colorFgPrimary: '#f2efe9',
  colorFgSecondary: '#a8a5a0',
  colorFgMuted: '#6b6966',
  
  // Accent (brass/copper)
  colorAccent: '#b87333',
  colorAccentHover: '#c98444',
  colorAccentActive: '#a05f2a',
  colorAccentSubtle: 'rgba(184, 115, 51, 0.1)',
  
  // Feedback
  colorSuccess: '#22c55e',
  colorWarning: '#f59e0b',
  colorError: '#ef4444',
  colorInfo: '#3b82f6',
  
  // Typography
  fontSans: "'Outfit', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  
  // Animation
  durationFast: '100ms',
  durationNormal: '200ms',
  durationSlow: '300ms',
};

/**
 * Default light theme
 */
export const defaultLightTheme: ThemeConfig = {
  // Backgrounds (light)
  colorBgPrimary: '#fafafa',
  colorBgSecondary: '#f5f5f5',
  colorBgTertiary: '#ffffff',
  
  // Foregrounds (dark on light)
  colorFgPrimary: '#1a1a1a',
  colorFgSecondary: '#4a4a4a',
  colorFgMuted: '#888888',
  
  // Accent (brass/copper — same, works on both)
  colorAccent: '#b87333',
  colorAccentHover: '#c98444',
  colorAccentActive: '#a05f2a',
  colorAccentSubtle: 'rgba(184, 115, 51, 0.1)',
  
  // Feedback
  colorSuccess: '#16a34a',
  colorWarning: '#d97706',
  colorError: '#dc2626',
  colorInfo: '#2563eb',
  
  // Typography
  fontSans: "'Outfit', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  
  // Animation
  durationFast: '100ms',
  durationNormal: '200ms',
  durationSlow: '300ms',
};

/**
 * Brass accent theme variant — warm metallic
 */
export const brassAccentTheme: ThemeConfig = createTheme(defaultDarkTheme, {
  colorAccent: '#c9a961',
  colorAccentHover: '#d4b872',
  colorAccentActive: '#b89a50',
  colorAccentSubtle: 'rgba(201, 169, 97, 0.15)',
});

/**
 * Copper accent theme variant — reddish metallic
 */
export const copperAccentTheme: ThemeConfig = createTheme(defaultDarkTheme, {
  colorAccent: '#b87333',
  colorAccentHover: '#c98444',
  colorAccentActive: '#a05f2a',
  colorAccentSubtle: 'rgba(184, 115, 51, 0.15)',
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
