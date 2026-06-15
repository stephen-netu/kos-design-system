import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/svelte';
import type { Snippet } from 'svelte';
import type { Completion, CompletionSource } from '../../editor/extensions/types';
import Input from './Input.svelte';

function createSource(completions: Completion[]): CompletionSource {
  return async (context) => {
    const match = context.matchBefore(/\w+$/);
    if (!match) return null;
    return {
      from: match.from,
      to: match.to,
      options: completions,
    };
  };
}

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

  it('does not render autocomplete controls without autocomplete prop', () => {
    const { container } = render(Input);

    expect(container.querySelector('[aria-autocomplete="list"]')).toBeNull();
    expect(container.querySelector('.ds-input-autocomplete')).toBeNull();
  });

  it('renders autocomplete suggestions when autocomplete prop is provided', async () => {
    const source = createSource([
      { label: 'apple', type: 'word' },
      { label: 'application', type: 'word', detail: 'common' },
    ]);
    const { container } = render(Input, { autocomplete: { source } });
    const input = container.querySelector('input')!;

    await fireEvent.input(input, { target: { value: 'app' } });

    await waitFor(() => {
      expect(container.querySelector('.ds-input-autocomplete')).not.toBeNull();
    });
    expect(container.querySelectorAll('[role="option"]').length).toBe(2);
    expect(container.querySelector('.ds-input-autocomplete__label')?.textContent).toBe('apple');
    expect(container.querySelector('.ds-input-autocomplete__detail')?.textContent).toBe('common');
  });

  it('applies the selected autocomplete suggestion with Enter', async () => {
    const source = createSource([
      { label: 'apple', type: 'word' },
      { label: 'application', type: 'word' },
    ]);
    const { container } = render(Input, { autocomplete: { source } });
    const input = container.querySelector('input')!;

    await fireEvent.input(input, { target: { value: 'app' } });

    await waitFor(() => {
      expect(container.querySelector('.ds-input-autocomplete')).not.toBeNull();
    });
    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe('application');
    expect(container.querySelector('.ds-input-autocomplete')).toBeNull();
  });

  it('dismisses autocomplete suggestions with Escape', async () => {
    const source = createSource([{ label: 'apple', type: 'word' }]);
    const { container } = render(Input, { autocomplete: { source } });
    const input = container.querySelector('input')!;

    await fireEvent.input(input, { target: { value: 'app' } });

    await waitFor(() => {
      expect(container.querySelector('.ds-input-autocomplete')).not.toBeNull();
    });
    await fireEvent.keyDown(input, { key: 'Escape' });

    expect(container.querySelector('.ds-input-autocomplete')).toBeNull();
  });

  it('replaces only the current token, preserving prefix and suffix', async () => {
    const source = createSource([
      { label: 'project', type: 'word' },
    ]);
    const { container } = render(Input, { autocomplete: { source } });
    const input = container.querySelector('input')!;

    await fireEvent.input(input, { target: { value: 'create a p' } });

    await waitFor(() => {
      expect(container.querySelector('.ds-input-autocomplete')).not.toBeNull();
    });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe('create a project');
    expect(container.querySelector('.ds-input-autocomplete')).toBeNull();
  });

  it('respects minChars before fetching autocomplete suggestions', async () => {
    const source = createSource([{ label: 'apple', type: 'word' }]);
    const { container } = render(Input, { autocomplete: { source, minChars: 3 } });
    const input = container.querySelector('input')!;

    await fireEvent.input(input, { target: { value: 'ap' } });

    expect(container.querySelector('.ds-input-autocomplete')).toBeNull();
  });
});
