import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/svelte';
import ThemeSwatchGroup from './ThemeSwatchGroup.svelte';

const swatches = [
  { hex: '#b87333', label: 'Brass' },
  { hex: '#4fa8a2', label: 'Teal' },
  { hex: '#c14a4a', label: 'Crimson' }
];

describe('ThemeSwatchGroup', () => {
  afterEach(() => cleanup());

  it('renders a radiogroup with one radio per swatch', () => {
    render(ThemeSwatchGroup, { swatches });
    expect(screen.getByRole('radiogroup')).toBeDefined();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the swatch matching value as checked', () => {
    render(ThemeSwatchGroup, { swatches, value: '#4fa8a2' });
    const radios = screen.getAllByRole('radio');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
  });

  it('calls onSelect with the clicked swatch hex', async () => {
    const onSelect = vi.fn();
    render(ThemeSwatchGroup, { swatches, onSelect });
    const radios = screen.getAllByRole('radio');
    await fireEvent.click(radios[2]);
    expect(onSelect).toHaveBeenCalledWith('#c14a4a');
  });

  it('selects on Enter and Space keydown', async () => {
    const onSelect = vi.fn();
    render(ThemeSwatchGroup, { swatches, onSelect });
    const radios = screen.getAllByRole('radio');
    await fireEvent.keyDown(radios[0], { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('#b87333');
    await fireEvent.keyDown(radios[1], { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith('#4fa8a2');
  });

  it('uses each swatch label as its aria-label', () => {
    render(ThemeSwatchGroup, { swatches });
    expect(screen.getByLabelText('Brass')).toBeDefined();
    expect(screen.getByLabelText('Teal')).toBeDefined();
    expect(screen.getByLabelText('Crimson')).toBeDefined();
  });

  it('applies size class', () => {
    const { container } = render(ThemeSwatchGroup, { swatches, size: 'lg' });
    expect(container.querySelector('.size-lg')).not.toBeNull();
  });
});
