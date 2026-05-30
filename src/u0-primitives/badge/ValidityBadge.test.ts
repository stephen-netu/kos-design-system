import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import ValidityBadge from './ValidityBadge.svelte';

describe('ValidityBadge', () => {
  afterEach(() => cleanup());

  it('renders with default score', () => {
    const { container } = render(ValidityBadge, { props: { children: () => {} } });
    expect(container.querySelector('.ds-validity-badge')).not.toBeNull();
  });

  it('applies high validity class for score >= 900', () => {
    const { container } = render(ValidityBadge, { props: { score: 950, children: () => {} } });
    expect(container.querySelector('.validity-color-high')).not.toBeNull();
  });

  it('applies medium validity class for score 700-899', () => {
    const { container } = render(ValidityBadge, { props: { score: 750, children: () => {} } });
    expect(container.querySelector('.validity-color-medium')).not.toBeNull();
  });

  it('applies low validity class for score 500-699', () => {
    const { container } = render(ValidityBadge, { props: { score: 600, children: () => {} } });
    expect(container.querySelector('.validity-color-low')).not.toBeNull();
  });

  it('applies critical validity class for score < 500', () => {
    const { container } = render(ValidityBadge, { props: { score: 300, children: () => {} } });
    expect(container.querySelector('.validity-color-critical')).not.toBeNull();
  });

  it('renders score and total text', () => {
    const { container } = render(ValidityBadge, { props: { score: 800, total: 1000 } });
    const scoreEl = container.querySelector('.ds-validity-score');
    const totalEl = container.querySelector('.ds-validity-total');
    expect(scoreEl).not.toBeNull();
    expect(totalEl).not.toBeNull();
  });

  it('applies size classes', () => {
    const { container: sm } = render(ValidityBadge, { props: { size: 'sm', children: () => {} } });
    expect(sm.querySelector('.size-sm')).not.toBeNull();

    const { container: lg } = render(ValidityBadge, { props: { size: 'lg', children: () => {} } });
    expect(lg.querySelector('.size-lg')).not.toBeNull();
  });

  it('shows label when showLabel is true', () => {
    const { container } = render(ValidityBadge, { props: { score: 950, showLabel: true } });
    expect(container.querySelector('.ds-validity-label')).not.toBeNull();
  });

  it('hides label when showLabel is false', () => {
    const { container } = render(ValidityBadge, { props: { score: 950, showLabel: false } });
    expect(container.querySelector('.ds-validity-label')).toBeNull();
  });

  it('sets aria-label from validity label', () => {
    const { container } = render(ValidityBadge, { props: { score: 950, children: () => {} } });
    const badge = container.querySelector('.ds-validity-badge')!;
    expect(badge.getAttribute('aria-label')).toBe('High Validity');
  });

  it('renders custom children when provided', () => {
    const { container } = render(ValidityBadge, { props: { score: 500, children: () => 'custom' } });
    expect(container.querySelector('.ds-validity-content')).not.toBeNull();
    expect(container.querySelector('.ds-validity-score')).toBeNull();
  });
});
