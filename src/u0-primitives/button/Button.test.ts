import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/svelte';
import type { Snippet } from 'svelte';
import Button from './Button.svelte';

describe('Button', () => {
  afterEach(() => cleanup());

  it('renders a real <button> element', () => {
    render(Button, { children: ((() => '') as unknown as Snippet) });
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('calls onclick when clicked', async () => {
    const handleClick = vi.fn();
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet), onclick: handleClick });
    const btn = container.querySelector('button')!;
    await fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('sets disabled attribute on the native button when disabled', () => {
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet), disabled: true });
    expect(container.querySelector('button')!.hasAttribute('disabled')).toBe(true);
  });

  it('sets disabled attribute on the native button when loading', () => {
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet), loading: true });
    expect(container.querySelector('button')!.hasAttribute('disabled')).toBe(true);
  });

  it('sets aria-label when provided', () => {
    const { container } = render(Button, { 'aria-label': 'Submit form' });
    const btn = container.querySelector('button')!;
    expect(btn.getAttribute('aria-label')).toBe('Submit form');
  });

  it('renders spinner element when loading is true', () => {
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet), loading: true });
    expect(container.querySelector('.ds-button-spinner')).not.toBeNull();
  });

  it('applies variant class', () => {
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet), variant: 'danger' });
    expect(container.querySelector('.variant-danger')).not.toBeNull();
  });

  it('applies size class', () => {
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet), size: 'lg' });
    expect(container.querySelector('.size-lg')).not.toBeNull();
  });

  it('applies custom class', () => {
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet), class: 'my-btn' });
    expect(container.querySelector('.my-btn')).not.toBeNull();
  });

  it('applies variant-secondary class', () => {
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet), variant: 'secondary' });
    expect(container.querySelector('.variant-secondary')).not.toBeNull();
  });

  it('defaults type to "button"', () => {
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet) });
    expect(container.querySelector('button')!.getAttribute('type')).toBe('button');
  });

  it('forwards custom type to the native button', () => {
    const { container } = render(Button, { children: ((() => '') as unknown as Snippet), type: 'submit' });
    expect(container.querySelector('button')!.getAttribute('type')).toBe('submit');
  });
});
