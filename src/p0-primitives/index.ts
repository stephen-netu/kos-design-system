// P0 Primitives — Shared types, utilities, and design tokens
// This is the foundation layer that all other domains depend on
// CSS tokens are imported via base.css or '@kos/design-system/tokens.css'

export * from './types/index';
export * from './utils/index';
export { getCanvasTheme } from './canvas-theme';

// Theme system
export { default as ThemeProvider } from './ThemeProvider.svelte';
export type { ThemeMode, ThemeConfig } from './ThemeProvider.svelte';
export { createTheme, defaultLightTheme, defaultDarkTheme, brassAccentTheme } from './theme';
