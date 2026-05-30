import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import KeyboardShortcuts from './KeyboardShortcuts.svelte';

const baseGroups = [
  {
    name: 'General',
    shortcuts: [
      { key: 'k', modifiers: ['ctrl'] as const, description: 'Open command bar' },
      { key: 'n', modifiers: ['ctrl', 'shift'] as const, description: 'New note', scope: 'global' },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      { key: 'Escape', description: 'Close dialog' },
    ],
  },
];

const baseProps = {
  groups: baseGroups,
  isOpen: true,
  onClose: vi.fn(),
};

describe('KeyboardShortcuts', () => {
  afterEach(() => cleanup());

  it('renders the overlay and panel when isOpen is true', () => {
    const { container } = render(KeyboardShortcuts, { props: baseProps });
    expect(container.querySelector('.shortcuts-overlay')).toBeTruthy();
    expect(container.querySelector('.shortcuts-panel')).toBeTruthy();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(KeyboardShortcuts, { props: { ...baseProps, isOpen: false } });
    expect(container.querySelector('.shortcuts-overlay')).toBeNull();
  });

  it('renders group titles and shortcut descriptions', () => {
    const { container } = render(KeyboardShortcuts, { props: baseProps });
    expect(container.querySelector('.group-title')?.textContent).toBe('General');
    const items = container.querySelectorAll('.shortcut-item');
    expect(items.length).toBe(3);
  });

  it('renders modifier keys with correct labels (Ctrl, Shift)', () => {
    const { container } = render(KeyboardShortcuts, { props: baseProps });
    const firstItemKeys = container.querySelectorAll('.shortcut-item')[0].querySelectorAll('.key');
    expect(firstItemKeys[0].textContent).toBe('Ctrl');
    expect(firstItemKeys[1].textContent).toBe('K');
  });

  it('renders multiple modifiers (Ctrl + Shift)', () => {
    const { container } = render(KeyboardShortcuts, { props: baseProps });
    const secondItemKeys = container.querySelectorAll('.shortcut-item')[1].querySelectorAll('.key');
    expect(secondItemKeys.length).toBe(3);
    expect(secondItemKeys[0].textContent).toBe('Ctrl');
    expect(secondItemKeys[1].textContent).toBe('Shift');
    expect(secondItemKeys[2].textContent).toBe('N');
  });

  it('renders scope badge when shortcut has a scope', () => {
    const { container } = render(KeyboardShortcuts, { props: baseProps });
    const scopeBadges = container.querySelectorAll('.shortcut-scope');
    expect(scopeBadges.length).toBe(1);
    expect(scopeBadges[0].textContent).toBe('global');
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(KeyboardShortcuts, { props: { ...baseProps, onClose } });
    const closeBtn = container.querySelector('.close-btn') as HTMLElement;
    await fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onShortcutClick with the shortcut when a shortcut is clicked', async () => {
    const onShortcutClick = vi.fn();
    const { container } = render(KeyboardShortcuts, { props: { ...baseProps, onShortcutClick } });
    const firstShortcutBtn = container.querySelector('.shortcut-btn') as HTMLElement;
    await fireEvent.click(firstShortcutBtn);
    expect(onShortcutClick).toHaveBeenCalledTimes(1);
    expect(onShortcutClick).toHaveBeenCalledWith(baseGroups[0].shortcuts[0]);
  });

  it('renders custom title when provided', () => {
    const { container } = render(KeyboardShortcuts, { props: { ...baseProps, title: 'My Shortcuts' } });
    expect(container.querySelector('.panel-title')?.textContent).toBe('My Shortcuts');
  });

  it('renders search box when searchable is true', () => {
    const { container } = render(KeyboardShortcuts, { props: { ...baseProps, searchable: true } });
    expect(container.querySelector('.search-box')).toBeTruthy();
    expect(container.querySelector('input[placeholder="Search shortcuts..."]')).toBeTruthy();
  });

  it('does not render search box when searchable is false', () => {
    const { container } = render(KeyboardShortcuts, { props: { ...baseProps, searchable: false } });
    expect(container.querySelector('.search-box')).toBeNull();
  });
});
