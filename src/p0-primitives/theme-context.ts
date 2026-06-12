import { getContext, setContext } from 'svelte';

export interface ThemeStoreLike {
  theme: string;
  setTheme(t: string): void;
}

export const THEME_STORE_KEY = Symbol('kos-theme-store');

export function provideThemeStore(store: ThemeStoreLike): void {
  setContext(THEME_STORE_KEY, store);
}

export function getThemeStore(): ThemeStoreLike {
  return getContext<ThemeStoreLike>(THEME_STORE_KEY);
}
