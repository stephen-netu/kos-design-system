import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import MetricCard from './MetricCard.svelte';

describe('MetricCard', () => {
  afterEach(() => cleanup());

  it('renders the label and value in default size', () => {
    const { container } = render(MetricCard, { props: { label: 'CPU', value: '42' } });
    expect(container.querySelector('.d0-metric-label')?.textContent).toBe('CPU');
    expect(container.querySelector('.d0-metric-value')?.textContent).toBe('42');
  });

  it('renders unit when provided', () => {
    const { container } = render(MetricCard, { props: { label: 'Temp', value: '72', unit: '°F' } });
    expect(container.querySelector('.d0-metric-unit')?.textContent).toBe('°F');
  });

  it('omits unit when not provided', () => {
    const { container } = render(MetricCard, { props: { label: 'Count', value: '5' } });
    expect(container.querySelector('.d0-metric-unit')).toBeNull();
  });

  it('renders trend indicator with up arrow', () => {
    const { container } = render(MetricCard, {
      label: 'Growth', value: '12', trend: 'up', trendValue: '+5%',
    });
    const trend = container.querySelector('.d0-metric-trend');
    expect(trend).not.toBeNull();
    expect(trend?.classList.contains('trend-up')).toBe(true);
    expect(trend?.textContent).toContain('+5%');
  });

  it('renders trend indicator with down arrow', () => {
    const { container } = render(MetricCard, {
      label: 'Loss', value: '3', trend: 'down', trendValue: '-2%',
    });
    const trend = container.querySelector('.d0-metric-trend');
    expect(trend?.classList.contains('trend-down')).toBe(true);
  });

  it('renders flat trend arrow', () => {
    const { container } = render(MetricCard, {
      label: 'Stable', value: '100', trend: 'flat',
    });
    const trend = container.querySelector('.d0-metric-trend');
    expect(trend?.classList.contains('trend-flat')).toBe(true);
  });

  it('renders inline variant with correct classes', () => {
    const { container } = render(MetricCard, {
      label: 'Net', value: '88', size: 'inline',
    });
    expect(container.querySelector('.d0-metric-inline')).not.toBeNull();
    expect(container.querySelector('.d0-metric-inline__label')?.textContent).toBe('Net');
    expect(container.querySelector('.d0-metric-inline__value')?.textContent).toBe('88');
  });

  it('sets aria-label on trend element', () => {
    const { container } = render(MetricCard, {
      label: 'A', value: '1', trend: 'up', trendValue: '1',
    });
    const trend = container.querySelector('.d0-metric-trend');
    expect(trend?.getAttribute('aria-label')).toBe('trending up');
  });
});
