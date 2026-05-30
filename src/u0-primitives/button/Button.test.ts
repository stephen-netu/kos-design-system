import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button', () => {
  afterEach(() => cleanup());

  it('renders a real <button> element', () => {
    render(Button, { children: () => 'ok' });
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('calls onclick when clicked', async () => {
    const handleClick = vi.fn();
    const { container } = render(Button, { children: () => 'tap', onclick: handleClick });
    const btn = container.querySelector('button')!;
    await fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('sets disabled attribute on the native button when disabled', () => {
    const { container } = render(Button, { children: () => 'tap', disabled: true });
    expect(container.querySelector('button')!.hasAttribute('disabled')).toBe(true);
  });

  it('sets disabled attribute on the native button when loading', () => {
    const { container } = render(Button, { children: () => 'tap', loading: true });
    expect(container.querySelector('button')!.hasAttribute('disabled')).toBe(true);
  });

  it('sets aria-label when provided', () => {
    const { container } = render(Button, { 'aria-label': 'Submit form' });
    const btn = container.querySelector('button')!;
    expect(btn.getAttribute('aria-label')).toBe('Submit form');
  });

  it('renders spinner element when loading is true', () => {
    const { container } = render(Button, { children: () => 'tap', loading: true });
    expect(container.querySelector('.ds-button-spinner')).not.toBeNull();
  });

  it('applies variant class', () => {
    const { container } = render(Button, { children: () => 'tap', variant: 'danger' });
    expect(container.querySelector('.variant-danger')).not.toBeNull();
  });

  it('applies size class', () => {
    const { container } = render(Button, { children: () => 'tap', size: 'lg' });
    expect(container.querySelector('.size-lg')).not.toBeNull();
  });

  it('applies custom class', () => {
    const { container } = render(Button, { children: () => 'tap', class: 'my-btn' });
    expect(container.querySelector('.my-btn')).not.toBeNull();
  });

  it('applies variant-secondary class', () => {
    const { container } = render(Button, { children: () => 'tap', variant: 'secondary' });
    expect(container.querySelector('.variant-secondary')).not.toBeNull();
  });

  it('defaults type to "button"', () => {
    const { container } = render(Button, { children: () => 'Go' });
    expect(container.querySelector('button')!.getAttribute('type')).toBe('button');
  });

  it('forwards custom type to the native button', () => {
    const { container } = render(Button, { children: () => 'Go', type: 'submit' });
    expect(container.querySelector('button')!.getAttribute('type')).toBe('submit');
  });
});
