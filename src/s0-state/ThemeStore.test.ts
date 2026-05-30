import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { themeStore } from './ThemeStore.svelte';

function safeStorageClear(): void {
  try { localStorage.clear(); } catch { /* jsdom may not fully implement storage */ }
}

describe('ThemeStore', () => {
  const originalTheme = document.documentElement.getAttribute('data-theme');

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    safeStorageClear();
    themeStore.setTheme('dark');
  });

  afterEach(() => {
    if (originalTheme) {
      document.documentElement.setAttribute('data-theme', originalTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.documentElement.style.colorScheme = '';
    safeStorageClear();
  });

  it('defaults to dark theme', () => {
    expect(themeStore.theme).toBe('dark');
  });

  it('setTheme updates theme, data-theme attr, colorScheme, and localStorage', () => {
    themeStore.setTheme('light');
    expect(themeStore.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('kos-theme')).toBe('light');
  });

  it('setTheme("control-room") sets correct attributes', () => {
    themeStore.setTheme('control-room');
    expect(themeStore.theme).toBe('control-room');
    expect(document.documentElement.getAttribute('data-theme')).toBe('control-room');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('toggleTheme cycles dark → light → control-room → dark', () => {
    themeStore.setTheme('dark');
    themeStore.toggleTheme();
    expect(themeStore.theme).toBe('light');
    themeStore.toggleTheme();
    expect(themeStore.theme).toBe('control-room');
    themeStore.toggleTheme();
    expect(themeStore.theme).toBe('dark');
  });

  it('syncFromDOM reads data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', 'control-room');
    themeStore.syncFromDOM();
    expect(themeStore.theme).toBe('control-room');
  });

  it('syncFromDOM ignores invalid values', () => {
    document.documentElement.setAttribute('data-theme', 'invalid');
    themeStore.syncFromDOM();
    expect(themeStore.theme).toBe('dark');
  });

  it('persists theme across setTheme calls', () => {
    themeStore.setTheme('light');
    expect(localStorage.getItem('kos-theme')).toBe('light');
    themeStore.setTheme('control-room');
    expect(localStorage.getItem('kos-theme')).toBe('control-room');
  });
});
