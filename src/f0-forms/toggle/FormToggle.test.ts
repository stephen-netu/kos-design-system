import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import FormToggle from './FormToggle.svelte';

describe('FormToggle', () => {
  afterEach(() => cleanup());

  it('renders a checkbox input with role="switch"', () => {
    const { container } = render(FormToggle);
    expect(container.querySelector('input[type="checkbox"][role="switch"]')).not.toBeNull();
  });

  it('renders label text when label prop is provided', () => {
    const { container } = render(FormToggle, { props: { label: 'Enable dark mode' } });
    expect(container.querySelector('.ds-form-toggle-label')?.textContent).toBe(
      'Enable dark mode'
    );
  });

  it('does not render label element when label is empty', () => {
    const { container } = render(FormToggle);
    expect(container.querySelector('.ds-form-toggle-label')).toBeNull();
  });

  it('is unchecked by default', () => {
    const { container } = render(FormToggle);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.checked).toBe(false);
  });

  it('reflects checked state via aria-checked', () => {
    const { container } = render(FormToggle, { props: { checked: true } });
    expect(container.querySelector('input')?.getAttribute('aria-checked')).toBe('true');
  });

  it('applies is-checked class when checked is true', () => {
    const { container } = render(FormToggle, { props: { checked: true } });
    expect(container.querySelector('.is-checked')).not.toBeNull();
  });

  it('applies is-disabled class and disabled attribute when disabled', () => {
    const { container } = render(FormToggle, { props: { disabled: true } });
    expect(container.querySelector('.is-disabled')).not.toBeNull();
    expect(container.querySelector('input')?.hasAttribute('disabled')).toBe(true);
  });

  it('applies is-sm class when size is sm', () => {
    const { container } = render(FormToggle, { props: { size: 'sm' } });
    expect(container.querySelector('.is-sm')).not.toBeNull();
  });

  it('uses correct track dimensions for sm size', () => {
    const { container } = render(FormToggle, { props: { size: 'sm' } });
    const track = container.querySelector('.ds-form-toggle-track') as HTMLElement;
    expect(track.style.width).toBe('32px');
    expect(track.style.height).toBe('18px');
  });

  it('uses correct track dimensions for md size (default)', () => {
    const { container } = render(FormToggle);
    const track = container.querySelector('.ds-form-toggle-track') as HTMLElement;
    expect(track.style.width).toBe('40px');
    expect(track.style.height).toBe('22px');
  });

  it('calls onchange callback when toggled', async () => {
    const onchange = vi.fn();
    const { container } = render(FormToggle, {
      props: { onchange, checked: false },
    });
    const input = container.querySelector('input') as HTMLInputElement;
    await fireEvent.click(input);
    expect(onchange).toHaveBeenCalledTimes(1);
  });

  it('applies custom id to the native input', () => {
    const { container } = render(FormToggle, { props: { id: 'toggle-dark' } });
    expect(container.querySelector('#toggle-dark')).not.toBeNull();
  });

  it('applies name attribute when provided', () => {
    const { container } = render(FormToggle, { props: { name: 'dark-mode' } });
    expect(container.querySelector('input')?.getAttribute('name')).toBe('dark-mode');
  });

  it('applies custom class to the wrapper label', () => {
    const { container } = render(FormToggle, { props: { class: 'my-toggle' } });
    expect(container.querySelector('.my-toggle')).not.toBeNull();
  });
});
