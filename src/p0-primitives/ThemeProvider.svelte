<script lang="ts">
  /**
   * ThemeProvider
   *
   * Runtime theme management for KOS Design System.
   * Provides light/dark/auto modes and custom theme overrides.
   * Receives theme store via Svelte context (set by s0-state or app layer).
   *
   * @package @kos/design-system/p0-primitives
   */
  import type { Snippet } from 'svelte';
  import { getThemeStore, THEME_STORE_KEY, type ThemeName, type ThemeStoreLike } from './theme-context';

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
    /** @deprecated Accent ramp fields ignored by ThemeProvider — the ramp is
     *  derived from `colorAccent` via tokens.css color-mix. Palette fields
     *  (Amber, Copper, Rust, Sage, Gold) below are still emitted directly as
     *  --color-accent-* custom properties for source compatibility. Set only
     *  `colorAccent` for the primary accent. */
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

  const store = getThemeStore();

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
    store.setTheme(resolveMode());
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

    // Accent: emit the seed AND redeclare the full alias/ramp chain on this
    // wrapper. CSS resolves var() in unregistered custom properties at computed-
    // value time on the declaring element (:root). Without redeclaring the
    // derived variables here, --color-accent etc. stay baked to the root seed
    // even when --accent-primary is overridden on this wrapper.
    if (t.colorAccent) {
      vars.push(`--accent-primary: ${t.colorAccent};`);
      vars.push(`--accent-hover: color-mix(in oklab, var(--accent-primary), #fff 16%);`);
      vars.push(`--accent-active: color-mix(in oklab, var(--accent-primary), #000 22%);`);
      vars.push(`--accent-glow: color-mix(in srgb, var(--accent-primary) 28%, transparent);`);
      vars.push(`--accent-muted: color-mix(in srgb, var(--accent-primary) 16%, transparent);`);
      vars.push(`--accent-subtle: color-mix(in srgb, var(--accent-primary) 8%, transparent);`);
      vars.push(`--accent-faint: color-mix(in srgb, var(--accent-primary) 4%, transparent);`);
      vars.push(`--color-accent: var(--accent-primary);`);
      vars.push(`--color-accent-hover: var(--accent-hover);`);
      vars.push(`--color-accent-active: var(--accent-active);`);
      vars.push(`--color-accent-glow: var(--accent-glow);`);
      vars.push(`--color-accent-muted: var(--accent-muted);`);
      vars.push(`--color-accent-subtle: var(--accent-subtle);`);
      vars.push(`--color-accent-faint: var(--accent-faint);`);
      vars.push(`--color-accent-secondary: color-mix(in oklab, var(--accent-primary), #fff 26%);`);
      vars.push(`--border-focus: var(--accent-primary);`);
    }
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
  class:mode-dark={store.theme === 'dark'}
  class:mode-light={store.theme === 'light'}
  data-theme={store.theme}
  data-theme-mode={store.theme}
  style={customStyles}
>
  {@render children()}
</div>

<style>
  .theme-provider {
    color: var(--color-text-primary);
    background: var(--color-bg-primary);
    font-family: var(--font-sans, 'Outfit', system-ui, sans-serif);
  }
</style>
