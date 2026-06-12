import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/svelte';
import AppHeaderBar from './AppHeaderBar.svelte';

describe('AppHeaderBar', () => {
  afterEach(() => cleanup());

  it('renders the app name', () => {
    const { container } = render(AppHeaderBar, { appName: 'TEST_APP' });
    expect(container.querySelector('.app-name')?.textContent).toBe('TEST_APP');
  });

  it('renders SELECT VAULT button', () => {
    const { container } = render(AppHeaderBar, { appName: 'TEST_APP' });
    const buttons = container.querySelectorAll('button');
    const found = Array.from(buttons).some(b => b.textContent?.trim() === 'SELECT VAULT');
    expect(found).toBe(true);
  });

  it('renders SHORTCUTS button', () => {
    const { container } = render(AppHeaderBar, { appName: 'TEST_APP' });
    const buttons = container.querySelectorAll('button');
    const found = Array.from(buttons).some(b => b.textContent?.trim() === 'SHORTCUTS');
    expect(found).toBe(true);
  });

  it('calls onselectvault when SELECT VAULT is clicked', async () => {
    const handler = vi.fn();
    const { container } = render(AppHeaderBar, { appName: 'TEST_APP', onselectvault: handler });
    const buttons = Array.from(container.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.trim() === 'SELECT VAULT') as HTMLElement;
    await fireEvent.click(btn);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls onopenkeybindsettings when SHORTCUTS is clicked', async () => {
    const handler = vi.fn();
    const { container } = render(AppHeaderBar, { appName: 'TEST_APP', onopenkeybindsettings: handler });
    const buttons = Array.from(container.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.trim() === 'SHORTCUTS') as HTMLElement;
    await fireEvent.click(btn);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('renders mode label (uppercased) when modeLabel is provided', () => {
    const { container } = render(AppHeaderBar, { appName: 'TEST_APP', modeLabel: 'edit' });
    expect(container.querySelector('.mode-label')?.textContent).toBe('EDIT');
  });

  it('does NOT render mode label when modeLabel is not provided', () => {
    const { container } = render(AppHeaderBar, { appName: 'TEST_APP' });
    expect(container.querySelector('.mode-label')).toBeNull();
  });
});
