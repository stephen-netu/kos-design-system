import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/svelte';
import RadioGroup from './RadioGroup.svelte';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' }
];

describe('RadioGroup', () => {
  afterEach(() => cleanup());

  it('renders all radio options', () => {
    const { container } = render(RadioGroup, { options, name: 'test' });
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(3);
  });

  it('clicking an option selects it and calls onchange', async () => {
    const onchange = vi.fn();
    const { container } = render(RadioGroup, { options, name: 'test', onchange });
    const radios = container.querySelectorAll('input[type="radio"]');
    await fireEvent.click(radios[1]);
    expect(onchange).toHaveBeenCalledWith('b');
  });

  it('disabled group does not call onchange on click', async () => {
    const onchange = vi.fn();
    const { container } = render(RadioGroup, { options, name: 'test', disabled: true, onchange });
    const radios = container.querySelectorAll('input[type="radio"]');
    await fireEvent.click(radios[0]);
    expect(onchange).not.toHaveBeenCalled();
  });

  it('keyboard navigation: ArrowDown selects next option in vertical orientation', async () => {
    const onchange = vi.fn();
    const { container } = render(RadioGroup, { options, name: 'test', onchange, selected: 'a' });
    const radios = container.querySelectorAll('input[type="radio"]');
    radios[0].focus();
    await fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(onchange).toHaveBeenCalledWith('b');
  });

  it('keyboard navigation: ArrowUp selects previous option', async () => {
    const onchange = vi.fn();
    const { container } = render(RadioGroup, { options, name: 'test', onchange, selected: 'b' });
    const radios = container.querySelectorAll('input[type="radio"]');
    radios[1].focus();
    await fireEvent.keyDown(radios[1], { key: 'ArrowUp' });
    expect(onchange).toHaveBeenCalledWith('a');
  });

  it('applies horizontal class when orientation is horizontal', () => {
    const { container } = render(RadioGroup, { options, name: 'test', orientation: 'horizontal' });
    expect(container.querySelector('.is-horizontal')).not.toBeNull();
  });

  it('applies custom class to wrapper', () => {
    const { container } = render(RadioGroup, { options, name: 'test', class: 'custom-class' });
    expect(container.querySelector('.custom-class')).not.toBeNull();
  });
});
