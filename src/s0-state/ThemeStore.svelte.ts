import { onMount, setContext } from 'svelte';
import { THEME_STORE_KEY, type ThemeStoreLike } from '../p0-primitives/theme-context';

export type ThemeName = 'dark' | 'light' | 'control-room';

const STORAGE_KEY = 'kos-theme';

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function getStoredTheme(): ThemeName | null {
  if (!hasLocalStorage()) return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'control-room') return stored;
  } catch { /* storage access denied */ }
  return null;
}

function getInitialTheme(): ThemeName {
  return getStoredTheme() ?? 'dark';
}

class ThemeStore {
  #theme = $state<ThemeName>(getInitialTheme());

  get theme(): ThemeName {
    return this.#theme;
  }

  setTheme(t: ThemeName): void {
    this.#theme = t;
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t === 'light' ? 'light' : 'dark';
    if (hasLocalStorage()) {
      try { localStorage.setItem(STORAGE_KEY, t); } catch { /* storage access denied */ }
    }
  }

  toggleTheme(): void {
    const order: ThemeName[] = ['dark', 'light', 'control-room'];
    const idx = order.indexOf(this.#theme);
    this.setTheme(order[(idx + 1) % order.length]);
  }

  syncFromDOM(): void {
    const dom = document.documentElement.getAttribute('data-theme');
    if (dom === 'dark' || dom === 'light' || dom === 'control-room') {
      this.#theme = dom;
    }
  }
}

export const themeStore = new ThemeStore();

export function provideThemeStoreContext(): void {
  setContext(THEME_STORE_KEY, themeStore as ThemeStoreLike);
}

export function initThemeStore(): void {
  provideThemeStoreContext();
  onMount(() => {
    themeStore.syncFromDOM();
    const stored = getStoredTheme();
    if (stored) themeStore.setTheme(stored);
  });
}
