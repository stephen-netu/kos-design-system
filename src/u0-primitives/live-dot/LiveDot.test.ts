import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import LiveDot from './LiveDot.svelte';

describe('LiveDot', () => {
  afterEach(() => cleanup());

  it('renders with role="status"', () => {
    render(LiveDot);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('defaults to the cleared variant', () => {
    const { container } = render(LiveDot);
    expect(container.querySelector('.variant-cleared')).not.toBeNull();
  });

  it('applies each variant class', () => {
    for (const variant of ['cleared', 'blocked', 'pending', 'degraded'] as const) {
      const { container, unmount } = render(LiveDot, { variant });
      expect(container.querySelector(`.variant-${variant}`)).not.toBeNull();
      unmount();
    }
  });

  it('applies size class', () => {
    const { container } = render(LiveDot, { size: 'lg' });
    expect(container.querySelector('.size-lg')).not.toBeNull();
  });

  it('pulses by default', () => {
    const { container } = render(LiveDot);
    expect(container.querySelector('.is-pulsing')).not.toBeNull();
  });

  it('does not pulse when pulse is false', () => {
    const { container } = render(LiveDot, { pulse: false });
    expect(container.querySelector('.is-pulsing')).toBeNull();
  });

  it('falls back to the variant name as aria-label', () => {
    render(LiveDot, { variant: 'blocked' });
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('blocked');
  });

  it('uses an explicit aria-label when provided', () => {
    render(LiveDot, { 'aria-label': 'Connection live' });
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Connection live');
  });
});
