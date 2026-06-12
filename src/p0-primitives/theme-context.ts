import { getContext, setContext } from 'svelte';

export type ThemeName = 'dark' | 'light' | 'control-room';

export interface ThemeStoreLike {
  theme: ThemeName;
  setTheme(t: ThemeName): void;
}

export const THEME_STORE_KEY = Symbol('kos-theme-store');

export function provideThemeStore(store: ThemeStoreLike): void {
  setContext(THEME_STORE_KEY, store);
}

export function getThemeStore(): ThemeStoreLike {
  return getContext<ThemeStoreLike>(THEME_STORE_KEY);
}
