<script lang="ts">
  /**
   * ThemeProvider
   * 
   * Runtime theme management for KOS Design System.
   * Provides light/dark/auto modes and custom theme overrides.
   * 
   * ADR: 2026-05-04-openui-generative-ui-integration
   * 
   * @package @kos/design-system/p0-primitives
   */
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  export type ThemeMode = 'light' | 'dark' | 'auto';

  export interface ThemeConfig {
    // Semantic colors
    colorBgPrimary?: string;
    colorBgSecondary?: string;
    colorBgTertiary?: string;
    colorFgPrimary?: string;
    colorFgSecondary?: string;
    colorFgMuted?: string;
    
    // Accent
    colorAccent?: string;
    colorAccentHover?: string;
    colorAccentActive?: string;
    colorAccentSubtle?: string;
    
    // Feedback colors
    colorSuccess?: string;
    colorWarning?: string;
    colorError?: string;
    colorInfo?: string;
    
    // Spacing (in rem)
    spaceScale?: number;
    
    // Radius (in rem)
    radiusScale?: number;
    
    // Typography
    fontSans?: string;
    fontMono?: string;
    
    // Animation
    durationFast?: string;
    durationNormal?: string;
    durationSlow?: string;
  }

  interface Props {
    mode?: ThemeMode;
    theme?: ThemeConfig;
    children: Snippet;
  }

  const props: Props = $props();

  // SSR-safe: start with safe default, update after mount
  let effectiveMode = $state<Exclude<ThemeMode, 'auto'>>('dark');
  
  $effect(() => {
    if (props.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveMode = prefersDark ? 'dark' : 'light';
    } else {
      effectiveMode = props.mode ?? 'dark';
    }
  });

  // Generate CSS custom properties from theme config
  function generateCSSVariables(theme: ThemeConfig | undefined): string {
    if (!theme) return '';
    
    const vars: string[] = [];
    
    if (theme.colorBgPrimary) vars.push(`--color-bg-primary: ${theme.colorBgPrimary};`);
    if (theme.colorBgSecondary) vars.push(`--color-bg-secondary: ${theme.colorBgSecondary};`);
    if (theme.colorBgTertiary) vars.push(`--color-bg-tertiary: ${theme.colorBgTertiary};`);
    if (theme.colorFgPrimary) vars.push(`--color-fg-primary: ${theme.colorFgPrimary};`);
    if (theme.colorFgSecondary) vars.push(`--color-fg-secondary: ${theme.colorFgSecondary};`);
    if (theme.colorFgMuted) vars.push(`--color-fg-muted: ${theme.colorFgMuted};`);
    
    if (theme.colorAccent) vars.push(`--color-accent: ${theme.colorAccent};`);
    if (theme.colorAccentHover) vars.push(`--color-accent-hover: ${theme.colorAccentHover};`);
    if (theme.colorAccentActive) vars.push(`--color-accent-active: ${theme.colorAccentActive};`);
    if (theme.colorAccentSubtle) vars.push(`--color-accent-subtle: ${theme.colorAccentSubtle};`);
    
    if (theme.colorSuccess) vars.push(`--color-success: ${theme.colorSuccess};`);
    if (theme.colorWarning) vars.push(`--color-warning: ${theme.colorWarning};`);
    if (theme.colorError) vars.push(`--color-error: ${theme.colorError};`);
    if (theme.colorInfo) vars.push(`--color-info: ${theme.colorInfo};`);
    
    if (theme.fontSans) vars.push(`--font-sans: ${theme.fontSans};`);
    if (theme.fontMono) vars.push(`--font-mono: ${theme.fontMono};`);
    
    if (theme.durationFast) vars.push(`--duration-fast: ${theme.durationFast};`);
    if (theme.durationNormal) vars.push(`--duration-normal: ${theme.durationNormal};`);
    if (theme.durationSlow) vars.push(`--duration-slow: ${theme.durationSlow};`);
    
    return vars.join('\n');
  }

  const customStyles = $derived(generateCSSVariables(props.theme));
</script>

<div
  class="theme-provider"
  class:mode-light={effectiveMode === 'light'}
  class:mode-dark={effectiveMode === 'dark'}
  data-theme-mode={effectiveMode}
  style={customStyles}
>
  {@render props.children()}
</div>

<style>
  .theme-provider {
    /* Base variables will be set by CSS file */
    color: var(--color-fg-primary, #f2efe9);
    background: var(--color-bg-primary, #141414);
    font-family: var(--font-sans, 'Outfit', system-ui, sans-serif);
  }

  /* Light mode overrides */
  .mode-light {
    color-scheme: light;
  }

  /* Dark mode overrides */
  .mode-dark {
    color-scheme: dark;
  }

  /* Scoped transition base - components opt in via CSS variables */
  .theme-provider {
    /* Base transition properties - children can inherit via var() */
    --_theme-transition: background-color var(--duration-normal, 200ms) var(--ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)),
                         border-color var(--duration-normal, 200ms) var(--ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)),
                         color var(--duration-normal, 200ms) var(--ease-in-out, cubic-bezier(0.4, 0, 0.2, 1));
  }
</style>
