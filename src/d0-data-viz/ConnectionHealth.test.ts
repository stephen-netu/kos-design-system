import { tick } from 'svelte';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import ConnectionHealth from './ConnectionHealth.svelte';

const excellentMetrics = {
  latency: 45,
  jitter: 3,
  lossRate: 0,
  quality: 'excellent' as const,
  history: [
    { timestamp: 1, latency: 40, lost: false },
    { timestamp: 2, latency: 45, lost: false },
    { timestamp: 3, latency: 42, lost: false },
  ],
};

describe('ConnectionHealth', () => {
  afterEach(() => cleanup());

  it('renders the quality label', () => {
    const { container } = render(ConnectionHealth, { props: { metrics: excellentMetrics } });
    expect(container.querySelector('.health-label')?.textContent).toBe('Excellent');
  });

  it('renders latency in compact view', () => {
    const { container } = render(ConnectionHealth, { props: { metrics: excellentMetrics } });
    expect(container.querySelector('.health-latency')?.textContent).toBe('45ms');
  });

  it('renders a colored indicator dot', () => {
    const { container } = render(ConnectionHealth, { props: { metrics: excellentMetrics } });
    const indicator = container.querySelector('.health-indicator') as HTMLElement;
    expect(indicator).not.toBeNull();
    expect(indicator.style.backgroundColor).toContain('27ae60');
  });

  it('shows metrics grid when expanded', () => {
    const { container } = render(ConnectionHealth, { props: { metrics: excellentMetrics, expanded: true } });
    expect(container.querySelector('.metrics-grid')).not.toBeNull();
    const text = container.textContent || '';
    expect(text).toContain('Latency');
    expect(text).toContain('Jitter');
    expect(text).toContain('Loss');
  });

  it('calls onRetry when retry button is clicked in poor state', async () => {
    const onRetry = vi.fn();
    const poorMetrics = { ...excellentMetrics, quality: 'poor' as const };
    const { container } = render(ConnectionHealth, { props: { metrics: poorMetrics, onRetry, expanded: true } });
    const retryBtn = container.querySelector('.retry-button') as HTMLElement;
    expect(retryBtn).not.toBeNull();
    await fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders disconnected quality with muted color', () => {
    const { container } = render(ConnectionHealth, {
      props: { metrics: { ...excellentMetrics, quality: 'disconnected' as const, latency: null, jitter: null } },
    });
    expect(container.querySelector('.health-label')?.textContent).toBe('Disconnected');
  });

  it('renders sparkline when showGraph is true and history exists', () => {
    const { container } = render(ConnectionHealth, {
      props: { metrics: excellentMetrics, showGraph: true },
    });
    expect(container.querySelector('.health-sparkline')).not.toBeNull();
  });

  it('hides sparkline when showGraph is false', () => {
    const { container } = render(ConnectionHealth, {
      props: { metrics: excellentMetrics, showGraph: false },
    });
    expect(container.querySelector('.health-sparkline')).toBeNull();
  });

  it('renders with null metrics', () => {
    const { container } = render(ConnectionHealth, { props: { metrics: null } });
    expect(container.querySelector('.health-label')?.textContent).toBe('Unknown');
  });
});
