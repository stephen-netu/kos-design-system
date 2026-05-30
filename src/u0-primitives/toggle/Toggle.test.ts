import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import Toggle from './Toggle.svelte';

describe('Toggle', () => {
  afterEach(() => cleanup());

  it('renders with role="switch"', () => {
    const { container } = render(Toggle);
    expect(container.querySelector('[role="switch"]')).not.toBeNull();
  });

  it('is unchecked by default', () => {
    const { container } = render(Toggle);
    expect(container.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('false');
  });

  it('reflects the checked prop', () => {
    const { container } = render(Toggle, { checked: true });
    expect(container.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('true');
  });

  it('applies size class', () => {
    const { container } = render(Toggle, { size: 'lg' });
    expect(container.querySelector('.size-lg')).not.toBeNull();
  });

  it('applies custom class', () => {
    const { container } = render(Toggle, { class: 'my-toggle' });
    expect(container.querySelector('.my-toggle')).not.toBeNull();
  });

  it('applies disabled class when disabled', () => {
    const { container } = render(Toggle, { disabled: true });
    expect(container.querySelector('.is-disabled')).not.toBeNull();
  });

  it('sets negative tabindex when disabled', () => {
    const { container } = render(Toggle, { disabled: true });
    expect(container.querySelector('[role="switch"]')?.getAttribute('tabindex')).toBe('-1');
  });

  it('applies is-checked class when checked', () => {
    const { container } = render(Toggle, { checked: true });
    expect(container.querySelector('.is-checked')).not.toBeNull();
  });

  it('renders as part of a label wrapper', () => {
    const { container } = render(Toggle);
    expect(container.querySelector('.ds-toggle-wrapper')).not.toBeNull();
  });

  it('is focusable when not disabled', () => {
    const { container } = render(Toggle);
    expect(container.querySelector('[role="switch"]')?.getAttribute('tabindex')).toBe('0');
  });
});
