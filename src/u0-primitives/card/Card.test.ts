import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Card from './Card.svelte';

const textSnippet = (text: string) =>
  createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe('Card', () => {
  afterEach(() => cleanup());

  it('renders the ds-card root element', () => {
    const { container } = render(Card);
    expect(container.querySelector('.ds-card')).not.toBeNull();
  });

  it('defaults to the elevated variant', () => {
    const { container } = render(Card);
    expect(container.querySelector('.variant-elevated')).not.toBeNull();
  });

  it('applies the requested variant class', () => {
    const { container } = render(Card, { variant: 'hazard' });
    expect(container.querySelector('.variant-hazard')).not.toBeNull();
  });

  it('applies a custom class', () => {
    const { container } = render(Card, { class: 'my-card' });
    expect(container.querySelector('.my-card')).not.toBeNull();
  });

  it('applies an inline style', () => {
    const { container } = render(Card, { style: 'width: 200px' });
    expect(container.querySelector('.ds-card')!.getAttribute('style')).toContain('width: 200px');
  });

  it('renders children content', () => {
    const { container } = render(Card, { children: textSnippet('body') });
    const content = container.querySelector('.ds-card-content');
    expect(content).not.toBeNull();
    expect(content!.textContent).toContain('body');
  });

  it('renders header and footer snippets', () => {
    const { container } = render(Card, {
      header: textSnippet('head'),
      footer: textSnippet('foot')
    });
    expect(container.querySelector('.ds-card-header')!.textContent).toContain('head');
    expect(container.querySelector('.ds-card-footer')!.textContent).toContain('foot');
  });

  it('is not interactive by default (no button role)', () => {
    const { container } = render(Card);
    expect(container.querySelector('[role="button"]')).toBeNull();
    expect(container.querySelector('.is-interactive')).toBeNull();
  });

  it('becomes interactive when an onclick handler is provided', () => {
    const { container } = render(Card, { onclick: vi.fn() });
    const card = container.querySelector('.ds-card')!;
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');
    expect(container.querySelector('.is-interactive')).not.toBeNull();
  });

  it('becomes interactive for the interactive variant without onclick', () => {
    const { container } = render(Card, { variant: 'interactive' });
    expect(container.querySelector('[role="button"]')).not.toBeNull();
  });

  it('calls onclick when an interactive card is clicked', async () => {
    const handleClick = vi.fn();
    const { container } = render(Card, { onclick: handleClick });
    await fireEvent.click(container.querySelector('.ds-card')!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onclick on Enter key when interactive', async () => {
    const handleClick = vi.fn();
    const { container } = render(Card, { onclick: handleClick });
    await fireEvent.keyDown(container.querySelector('.ds-card')!, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onclick on Space key when interactive', async () => {
    const handleClick = vi.fn();
    const { container } = render(Card, { onclick: handleClick });
    await fireEvent.keyDown(container.querySelector('.ds-card')!, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('reflects selection via the is-selected class and aria-pressed', () => {
    const { container } = render(Card, { selected: true, onclick: vi.fn() });
    const card = container.querySelector('.ds-card')!;
    expect(card.classList.contains('is-selected')).toBe(true);
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders the selection ring when selected', () => {
    const { container } = render(Card, { selected: true });
    expect(container.querySelector('.ds-card-ring')).not.toBeNull();
  });
});
