import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import Dropdown from './Dropdown.svelte';

const sampleItems = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
];

function renderDropdown(props = {}) {
  return render(Dropdown, {
    items: sampleItems,
    trigger: () => '<button>Open</button>',
    ...props,
  });
}

describe('Dropdown', () => {
  afterEach(() => cleanup());

  it('renders the trigger button element', () => {
    const { container } = renderDropdown();
    expect(container.querySelector('[role="button"]')).not.toBeNull();
  });

  it('does not render the menu initially', () => {
    const { container } = renderDropdown();
    expect(container.querySelector('.ds-dropdown-menu')).toBeNull();
  });

  it('opens the menu when trigger is clicked', async () => {
    const { container } = renderDropdown();
    const trigger = container.querySelector('[role="button"]')!;
    await fireEvent.click(trigger);
    expect(container.querySelector('.ds-dropdown-menu')).not.toBeNull();
  });

  it('renders all items when open', async () => {
    const { container } = renderDropdown();
    await fireEvent.click(container.querySelector('[role="button"]')!);
    expect(container.querySelectorAll('[role="menuitem"]').length).toBe(3);
  });

  it('calls onselect when an item is clicked', async () => {
    const handleSelect = vi.fn();
    const { container } = renderDropdown({ onselect: handleSelect });
    await fireEvent.click(container.querySelector('[role="button"]')!);
    const items = container.querySelectorAll('[role="menuitem"]');
    await fireEvent.click(items[1]);
    expect(handleSelect).toHaveBeenCalledWith({ id: 'b', label: 'Beta' });
  });

  it('does not call onselect for disabled items', async () => {
    const handleSelect = vi.fn();
    const { container } = renderDropdown({
      items: [
        { id: 'a', label: 'Alpha', disabled: true },
        { id: 'b', label: 'Beta' },
      ],
      onselect: handleSelect,
    });
    await fireEvent.click(container.querySelector('[role="button"]')!);
    const items = container.querySelectorAll('[role="menuitem"]');
    await fireEvent.click(items[0]);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('closes the menu after selecting an item', async () => {
    const { container } = renderDropdown();
    await fireEvent.click(container.querySelector('[role="button"]')!);
    expect(container.querySelector('.ds-dropdown-menu')).not.toBeNull();
    const items = container.querySelectorAll('[role="menuitem"]');
    await fireEvent.click(items[2]);
    expect(container.querySelector('.ds-dropdown-menu')).toBeNull();
  });

  it('applies align class', async () => {
    const { container } = renderDropdown({ align: 'right' });
    await fireEvent.click(container.querySelector('[role="button"]')!);
    expect(container.querySelector('.ds-dropdown-menu')?.classList.contains('align-right')).toBe(true);
  });

  it('sets aria-expanded on trigger', async () => {
    const { container } = renderDropdown();
    const trigger = container.querySelector('[role="button"]')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('applies aria-disabled to disabled items', async () => {
    const { container } = renderDropdown({
      items: [{ id: 'x', label: 'Blocked', disabled: true }],
    });
    await fireEvent.click(container.querySelector('[role="button"]')!);
    const item = container.querySelector('[role="menuitem"]');
    expect(item?.getAttribute('aria-disabled')).toBe('true');
  });

  it('renders menu items with correct labels', async () => {
    const { container } = renderDropdown();
    await fireEvent.click(container.querySelector('[role="button"]')!);
    expect(container.querySelector('[role="menuitem"]')?.textContent?.trim()).toBe('Alpha');
  });

  it('menu has role="menu" when open', async () => {
    const { container } = renderDropdown();
    await fireEvent.click(container.querySelector('[role="button"]')!);
    expect(container.querySelector('[role="menu"]')).not.toBeNull();
  });

  it('menu has aria-orientation when open', async () => {
    const { container } = renderDropdown();
    await fireEvent.click(container.querySelector('[role="button"]')!);
    const menu = container.querySelector('[role="menu"]');
    expect(menu?.getAttribute('aria-orientation')).not.toBeNull();
  });

  it('trigger has aria-haspopup', () => {
    const { container } = renderDropdown();
    const trigger = container.querySelector('[role="button"]');
    expect(trigger?.getAttribute('aria-haspopup')).not.toBeNull();
  });
});
