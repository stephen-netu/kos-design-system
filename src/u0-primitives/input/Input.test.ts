import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import type { Snippet } from 'svelte';
import Input from './Input.svelte';

describe('Input', () => {
  afterEach(() => cleanup());

  it('renders an <input> element', () => {
    const { container } = render(Input);
    expect(container.querySelector('input')).not.toBeNull();
  });

  it('applies placeholder', () => {
    const { container } = render(Input, { placeholder: 'Search...' });
    expect(container.querySelector('input[placeholder="Search..."]')).not.toBeNull();
  });

  it('sets disabled attribute', () => {
    const { container } = render(Input, { disabled: true });
    expect(container.querySelector('input')?.hasAttribute('disabled')).toBe(true);
  });

  it('respects the type prop', () => {
    const { container } = render(Input, { type: 'password' });
    expect(container.querySelector('input[type="password"]')).not.toBeNull();
  });

  it('applies error class wrapper when error is true', () => {
    const { container } = render(Input, { error: true });
    expect(container.querySelector('.has-error')).not.toBeNull();
  });

  it('applies custom id to the native input', () => {
    const { container } = render(Input, { id: 'my-input' });
    expect(container.querySelector('#my-input')).not.toBeNull();
  });

  it('applies custom name to the native input', () => {
    const { container } = render(Input, { name: 'email' });
    expect(container.querySelector('input')?.getAttribute('name')).toBe('email');
  });

  it('applies custom class to wrapper', () => {
    const { container } = render(Input, { class: 'custom-input' });
    expect(container.querySelector('.custom-input')).not.toBeNull();
  });

  it('displays leading icon element when iconLeading is provided', () => {
    const { container } = render(Input, {
      iconLeading: ((() => '') as unknown as Snippet)
    });
    expect(container.querySelector('.ds-input-icon.leading')).not.toBeNull();
  });

  it('has a show/hide button when type is password', () => {
    const { container } = render(Input, { type: 'password' });
    expect(container.querySelector('.ds-input-action')).not.toBeNull();
  });

  it('applies disabled class to wrapper when disabled', () => {
    const { container } = render(Input, { disabled: true });
    expect(container.querySelector('.is-disabled')).not.toBeNull();
  });

  it('sets aria-invalid when error is true', () => {
    const { container } = render(Input, { error: true });
    expect(container.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('sets aria-disabled when disabled', () => {
    const { container } = render(Input, { disabled: true });
    expect(container.querySelector('input')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('does not set aria-invalid when no error', () => {
    const { container } = render(Input, {});
    expect(container.querySelector('input')?.getAttribute('aria-invalid')).toBeNull();
  });
});
