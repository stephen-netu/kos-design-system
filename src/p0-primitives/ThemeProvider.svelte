<script lang="ts">
  /**
   * ThemeProvider
   *
   * Runtime theme management for KOS Design System.
   * Provides light/dark/auto modes and custom theme overrides.
   * Wraps the singleton ThemeStore for component-level integration.
   *
   * @package @kos/design-system/p0-primitives
   */
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { themeStore, initThemeStore, type ThemeName } from '../s0-state/ThemeStore.svelte';

  export type ThemeMode = 'light' | 'dark' | 'auto';

  export interface ThemeConfig {
    colorBgPrimary?: string;
    colorBgSecondary?: string;
    colorBgTertiary?: string;
    colorBgInset?: string;
    colorBgCanvas?: string;
    colorBgPanel?: string;
    colorBgPanelElevated?: string;

    colorCardBg?: string;
    colorCardBgAlt?: string;
    colorCardBorder?: string;

    colorFgPrimary?: string;
    colorFgSecondary?: string;
    colorFgMuted?: string;
    colorFgInverse?: string;
    colorFgTertiary?: string;

    colorAccent?: string;
    colorAccentHover?: string;
    colorAccentActive?: string;
    colorAccentSubtle?: string;
    colorAccentGlow?: string;
    colorAccentMuted?: string;
    colorAccentFaint?: string;
    colorAccentAmber?: string;
    colorAccentCopper?: string;
    colorAccentRust?: string;
    colorAccentSage?: string;

    colorAccentGold?: string;
    colorAccentGoldHover?: string;
    colorAccentGoldActive?: string;
    colorAccentGoldSubtle?: string;
    colorAccentGoldGlow?: string;

    colorSuccess?: string;
    colorWarning?: string;
    colorError?: string;
    colorInfo?: string;

    colorCyan?: string;
    colorAmber?: string;
    colorCrimson?: string;

    spaceScale?: number;
    radiusScale?: number;

    fontSans?: string;
    fontMono?: string;
    fontData?: string;
    fontSerif?: string;

    durationFast?: string;
    durationNormal?: string;
    durationSlow?: string;
  }

  interface Props {
    mode?: ThemeMode;
    theme?: ThemeConfig;
    children: Snippet;
  }

  let { mode, theme, children }: Props = $props();

  initThemeStore();

  const THEME_MAP: Record<Exclude<ThemeMode, 'auto'>, ThemeName> = {
    dark: 'dark',
    light: 'light',
  };

  function resolveMode(): ThemeName {
    if (mode === 'auto') {
      if (typeof window === 'undefined') return 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return THEME_MAP[mode ?? 'dark'] ?? 'dark';
  }

  $effect(() => {
    themeStore.setTheme(resolveMode());
  });

  function generateCSSVariables(t: ThemeConfig | undefined): string {
    if (!t) return '';
    const vars: string[] = [];

    if (t.colorBgPrimary) vars.push(`--color-bg-primary: ${t.colorBgPrimary};`);
    if (t.colorBgSecondary) vars.push(`--color-bg-secondary: ${t.colorBgSecondary};`);
    if (t.colorBgTertiary) vars.push(`--color-bg-tertiary: ${t.colorBgTertiary};`);
    if (t.colorBgInset) vars.push(`--color-bg-inset: ${t.colorBgInset};`);
    if (t.colorBgCanvas) vars.push(`--color-bg-canvas: ${t.colorBgCanvas};`);
    if (t.colorBgPanel) vars.push(`--color-bg-panel: ${t.colorBgPanel};`);
    if (t.colorBgPanelElevated) vars.push(`--color-bg-panel-elevated: ${t.colorBgPanelElevated};`);

    if (t.colorCardBg) vars.push(`--color-card-bg: ${t.colorCardBg};`);
    if (t.colorCardBgAlt) vars.push(`--color-card-bg-alt: ${t.colorCardBgAlt};`);
    if (t.colorCardBorder) vars.push(`--color-card-border: ${t.colorCardBorder};`);

    if (t.colorFgPrimary) vars.push(`--color-fg-primary: ${t.colorFgPrimary};`);
    if (t.colorFgSecondary) vars.push(`--color-fg-secondary: ${t.colorFgSecondary};`);
    if (t.colorFgMuted) vars.push(`--color-fg-muted: ${t.colorFgMuted};`);
    if (t.colorFgInverse) vars.push(`--color-fg-inverse: ${t.colorFgInverse};`);
    if (t.colorFgTertiary) vars.push(`--color-fg-tertiary: ${t.colorFgTertiary};`);

    if (t.colorAccent) vars.push(`--color-accent: ${t.colorAccent};`);
    if (t.colorAccentHover) vars.push(`--color-accent-hover: ${t.colorAccentHover};`);
    if (t.colorAccentActive) vars.push(`--color-accent-active: ${t.colorAccentActive};`);
    if (t.colorAccentSubtle) vars.push(`--color-accent-subtle: ${t.colorAccentSubtle};`);
    if (t.colorAccentGlow) vars.push(`--color-accent-glow: ${t.colorAccentGlow};`);
    if (t.colorAccentMuted) vars.push(`--color-accent-muted: ${t.colorAccentMuted};`);
    if (t.colorAccentFaint) vars.push(`--color-accent-faint: ${t.colorAccentFaint};`);
    if (t.colorAccentAmber) vars.push(`--color-accent-amber: ${t.colorAccentAmber};`);
    if (t.colorAccentCopper) vars.push(`--color-accent-copper: ${t.colorAccentCopper};`);
    if (t.colorAccentRust) vars.push(`--color-accent-rust: ${t.colorAccentRust};`);
    if (t.colorAccentSage) vars.push(`--color-accent-sage: ${t.colorAccentSage};`);

    if (t.colorAccentGold) vars.push(`--color-accent-gold: ${t.colorAccentGold};`);
    if (t.colorAccentGoldHover) vars.push(`--color-accent-gold-hover: ${t.colorAccentGoldHover};`);
    if (t.colorAccentGoldActive) vars.push(`--color-accent-gold-active: ${t.colorAccentGoldActive};`);
    if (t.colorAccentGoldSubtle) vars.push(`--color-accent-gold-subtle: ${t.colorAccentGoldSubtle};`);
    if (t.colorAccentGoldGlow) vars.push(`--color-accent-gold-glow: ${t.colorAccentGoldGlow};`);

    if (t.colorSuccess) vars.push(`--color-success: ${t.colorSuccess};`);
    if (t.colorWarning) vars.push(`--color-warning: ${t.colorWarning};`);
    if (t.colorError) vars.push(`--color-error: ${t.colorError};`);
    if (t.colorInfo) vars.push(`--color-info: ${t.colorInfo};`);
    if (t.colorCyan) vars.push(`--color-cyan: ${t.colorCyan};`);
    if (t.colorAmber) vars.push(`--color-amber: ${t.colorAmber};`);
    if (t.colorCrimson) vars.push(`--color-crimson: ${t.colorCrimson};`);

    if (t.fontSans) vars.push(`--font-sans: ${t.fontSans};`);
    if (t.fontMono) vars.push(`--font-mono: ${t.fontMono};`);
    if (t.fontData) vars.push(`--font-data: ${t.fontData};`);
    if (t.fontSerif) vars.push(`--font-serif: ${t.fontSerif};`);

    if (t.durationFast) vars.push(`--duration-fast: ${t.durationFast};`);
    if (t.durationNormal) vars.push(`--duration-normal: ${t.durationNormal};`);
    if (t.durationSlow) vars.push(`--duration-slow: ${t.durationSlow};`);

    return vars.join('\n');
  }

  const customStyles = $derived(generateCSSVariables(theme));
</script>

<div
  class="theme-provider"
  class:mode-dark={themeStore.theme === 'dark'}
  class:mode-light={themeStore.theme === 'light'}
  data-theme={themeStore.theme}
  data-theme-mode={themeStore.theme}
  style={customStyles}
>
  {@render children()}
</div>

<style>
  .theme-provider {
    color: var(--color-text-primary, #e8e0d0);
    background: var(--color-bg-primary, #0b0d0f);
    font-family: var(--font-sans, 'Outfit', system-ui, sans-serif);
  }
</style>
