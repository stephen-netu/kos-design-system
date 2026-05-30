import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/svelte';
import Select from './Select.svelte';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

describe('Select', () => {
  afterEach(() => cleanup());

  it('renders a <select> element', () => {
    const { container } = render(Select, { props: { options } });
    expect(container.querySelector('select')).not.toBeNull();
  });

  it('renders all options', () => {
    const { container } = render(Select, { props: { options } });
    const select = container.querySelector('select') as HTMLSelectElement;
    // +1 for the placeholder option
    expect(select.querySelectorAll('option').length).toBe(options.length + 1);
  });

  it('applies placeholder when no selection', () => {
    const { container } = render(Select, { props: { options, placeholder: 'Pick one' } });
    const select = container.querySelector('select') as HTMLSelectElement;
    const placeholderOpt = Array.from(select.options).find(o => o.textContent === 'Pick one');
    expect(placeholderOpt).toBeDefined();
  });

  it('calls onchange when selection changes', async () => {
    const handleChange = vi.fn();
    const { container } = render(Select, { props: { options, onchange: handleChange } });
    const select = container.querySelector('select') as HTMLSelectElement;
    await fireEvent.change(select, { target: { value: 'b' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('b');
  });

  it('sets disabled attribute when disabled prop is true', () => {
    const { container } = render(Select, { props: { options, disabled: true } });
    expect(container.querySelector('select')?.hasAttribute('disabled')).toBe(true);
  });

  it('applies error class when error is true', () => {
    const { container } = render(Select, { props: { options, error: true } });
    expect(container.querySelector('.has-error')).not.toBeNull();
  });

  it('applies custom class to wrapper', () => {
    const { container } = render(Select, { props: { options, class: 'my-select' } });
    expect(container.querySelector('.my-select')).not.toBeNull();
  });

  it('sets id on the native select element', () => {
    const { container } = render(Select, { props: { options, id: 'my-select' } });
    expect(container.querySelector('#my-select')).not.toBeNull();
  });
});
