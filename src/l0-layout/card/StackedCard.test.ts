import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import StackedCard from './StackedCard.svelte';

const textSnippet = (text: string) =>
  createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe('StackedCard', () => {
  afterEach(() => cleanup());

  it('renders three stacked sheets', () => {
    const { container } = render(StackedCard);
    expect(container.querySelectorAll('.ds-stacked-card-sheet')).toHaveLength(3);
  });

  it('hides the decorative back sheets from assistive tech', () => {
    const { container } = render(StackedCard);
    expect(container.querySelector('.sheet-back-1')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.sheet-back-2')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders children inside the front sheet', () => {
    const { container, getByText } = render(StackedCard, {
      children: textSnippet('Evidence panel')
    });
    const front = container.querySelector('.sheet-front');
    expect(front).not.toBeNull();
    expect(getByText('Evidence panel')).toBeDefined();
  });

  it('renders an underlying Card in the front sheet', () => {
    const { container } = render(StackedCard);
    expect(container.querySelector('.sheet-front .ds-card')).not.toBeNull();
  });
});
