import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import WindowFrame from './WindowFrame.svelte';

const textSnippet = (text: string) =>
  createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe('WindowFrame', () => {
  afterEach(() => cleanup());

  it('renders three chrome dots', () => {
    const { container } = render(WindowFrame);
    expect(container.querySelectorAll('.dot')).toHaveLength(3);
  });

  it('renders the title when provided', () => {
    const { getByText } = render(WindowFrame, { title: 'PROPERTY SEARCH' });
    expect(getByText('PROPERTY SEARCH')).toBeDefined();
  });

  it('omits the title element when not provided', () => {
    const { container } = render(WindowFrame);
    expect(container.querySelector('.ds-window-frame-title')).toBeNull();
  });

  it('renders slotted children in the body', () => {
    const { container, getByText } = render(WindowFrame, {
      children: textSnippet('Body content')
    });
    expect(container.querySelector('.ds-window-frame-body')).not.toBeNull();
    expect(getByText('Body content')).toBeDefined();
  });

  it('omits the body element when no children given', () => {
    const { container } = render(WindowFrame);
    expect(container.querySelector('.ds-window-frame-body')).toBeNull();
  });
});
