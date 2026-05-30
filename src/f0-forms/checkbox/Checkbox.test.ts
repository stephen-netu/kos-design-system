import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/svelte';
import Checkbox from './Checkbox.svelte';

describe('Checkbox', () => {
  afterEach(() => cleanup());

  it('renders a checkbox input', () => {
    const { container } = render(Checkbox);
    expect(container.querySelector('input[type="checkbox"]')).not.toBeNull();
  });

  it('toggles checked state on click', async () => {
    const { container } = render(Checkbox);
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.checked).toBe(false);
    await fireEvent.click(input);
    expect(input.checked).toBe(true);
  });

  it('sets indeterminate prop on the native input', () => {
    const { container } = render(Checkbox, { indeterminate: true });
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
  });

  it('applies disabled class when disabled is true', () => {
    const { container } = render(Checkbox, { disabled: true });
    expect(container.querySelector('.is-disabled')).not.toBeNull();
  });

  it('renders label text when label prop provided', () => {
    render(Checkbox, { label: 'Accept terms' });
    expect(screen.getByText('Accept terms')).toBeDefined();
  });

  it('applies custom class to wrapper', () => {
    const { container } = render(Checkbox, { class: 'my-checkbox' });
    expect(container.querySelector('.my-checkbox')).not.toBeNull();
  });

  it('calls onchange when clicked', async () => {
    const handleChange = vi.fn();
    const { container } = render(Checkbox, { onchange: handleChange });
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await fireEvent.click(input);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
