import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import Accordion from './Accordion.svelte';
import type { Snippet } from 'svelte';

const samplePanels: { id: string; title: string; content: Snippet; disabled?: boolean }[] = [
  { id: 'p1', title: 'First', content: (() => '') as unknown as Snippet },
  { id: 'p2', title: 'Second', content: (() => '') as unknown as Snippet },
  { id: 'p3', title: 'Third', content: (() => '') as unknown as Snippet },
];

describe('Accordion', () => {
  afterEach(() => cleanup());

  it('renders all panel titles', () => {
    const { container } = render(Accordion, { panels: samplePanels });
    const items = container.querySelectorAll('.accordion-item');
    expect(items.length).toBe(3);
    expect(container.textContent).toContain('First');
    expect(container.textContent).toContain('Second');
    expect(container.textContent).toContain('Third');
  });

  it('renders no panels initially (uncontrolled, no defaultOpen)', () => {
    const { container } = render(Accordion, { panels: samplePanels });
    expect(container.querySelectorAll('[role="region"]').length).toBe(0);
  });

  it('opens a panel when its header is clicked', async () => {
    const { container } = render(Accordion, { panels: samplePanels });
    const header = container.querySelector('[role="button"]')!;
    await fireEvent.click(header);
    expect(container.querySelectorAll('[role="region"]').length).toBe(1);
  });

  it('toggles panel closed when header is clicked again', async () => {
    const { container } = render(Accordion, { panels: samplePanels });
    const header = container.querySelector('[role="button"]')!;
    await fireEvent.click(header);
    expect(container.querySelectorAll('[role="region"]').length).toBe(1);
    await fireEvent.click(header);
    expect(container.querySelectorAll('[role="region"]').length).toBe(0);
  });

  it('opens panels listed in defaultOpen', () => {
    const { container } = render(Accordion, { panels: samplePanels, defaultOpen: ['p2'] });
    const items = container.querySelectorAll('.accordion-item');
    const secondItem = Array.from(items).find(i => i.textContent?.includes('Second'));
    const firstItem = Array.from(items).find(i => i.textContent?.includes('First'));
    expect(secondItem!.classList.contains('open')).toBe(true);
    expect(firstItem!.classList.contains('open')).toBe(false);
  });

  it('only allows one panel open when singleOpen is true', async () => {
    const { container } = render(Accordion, { panels: samplePanels, singleOpen: true });
    const buttons = container.querySelectorAll('[role="button"]');
    const h1 = buttons[0];
    const h2 = buttons[1];
    await fireEvent.click(h1);
    expect(container.querySelectorAll('[role="region"]').length).toBe(1);
    await fireEvent.click(h2);
    expect(container.querySelectorAll('[role="region"]').length).toBe(1);
  });

  it('does not open disabled panels', async () => {
    const panels = [
      { id: 'p1', title: 'Enabled', content: (() => '') as unknown as Snippet },
      { id: 'p2', title: 'Disabled', content: (() => '') as unknown as Snippet, disabled: true },
    ];
    const { container } = render(Accordion, { panels });
    const buttons = container.querySelectorAll('[role="button"]');
    const header = buttons[1]; // Disabled is second
    await fireEvent.click(header);
    expect(container.querySelectorAll('[role="region"]').length).toBe(0);
  });

  it('calls onOpenChange callback with new open ids in controlled mode', async () => {
    const handleOpen = vi.fn();
    const { container } = render(Accordion, { panels: samplePanels, open: [], onOpenChange: handleOpen });
    const button = container.querySelector('[role="button"]')!;
    await fireEvent.click(button);
    expect(handleOpen).toHaveBeenCalledWith(['p1']);
  });

  it('applies aria-expanded to headers', async () => {
    const { container } = render(Accordion, { panels: samplePanels });
    const header = container.querySelector('[role="button"]')!;
    expect(header.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(header);
    expect(header.getAttribute('aria-expanded')).toBe('true');
  });

  it('displays nothing when panels array is empty', () => {
    const { container } = render(Accordion, { panels: [] });
    expect(container.querySelector('.accordion')).toBeNull();
  });

  it('sets aria-controls on header pointing to region', async () => {
    const { container } = render(Accordion, { panels: samplePanels });
    const header = container.querySelector('[role="button"]')!;
    await fireEvent.click(header);
    const controls = header.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(container.querySelector(`#${controls}`)).not.toBeNull();
  });

  it('open panel region has role="region"', async () => {
    const { container } = render(Accordion, { panels: samplePanels });
    const header = container.querySelector('[role="button"]')!;
    await fireEvent.click(header);
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
  });
});
