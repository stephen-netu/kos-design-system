import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import BarChart from './BarChart.svelte';

const sampleSeries = [
  { id: 's1', label: 'Alpha', data: [{ label: 'A', value: 10 }, { label: 'B', value: 20 }], color: '#b87333' },
];

describe('BarChart', () => {
  afterEach(() => cleanup());

  it('renders an svg with role img', () => {
    const { container } = render(BarChart, { props: { series: sampleSeries } });
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).not.toBeNull();
  });

  it('renders bars for each data point', () => {
    const { container } = render(BarChart, { props: { series: sampleSeries } });
    expect(container.querySelectorAll('.d0-bar').length).toBe(2);
  });

  it('renders a bar with the correct color', () => {
    const { container } = render(BarChart, { props: { series: [{ id: 'c', label: 'C', data: [{ label: 'X', value: 5 }], color: '#ff0000' }] } });
    const bar = container.querySelector('.d0-bar') as SVGRectElement;
    expect(bar?.getAttribute('fill')).toBe('#ff0000');
  });

  it('renders grid lines when showGrid is true', () => {
    const { container } = render(BarChart, { props: { series: sampleSeries, showGrid: true } });
    expect(container.querySelectorAll('.d0-grid-line').length).toBeGreaterThan(0);
  });

  it('hides grid lines when showGrid is false', () => {
    const { container } = render(BarChart, { props: { series: sampleSeries, showGrid: false } });
    expect(container.querySelectorAll('.d0-grid-line').length).toBe(0);
  });

  it('swaps axes for horizontal orientation', () => {
    const { container } = render(BarChart, { props: { series: sampleSeries, orientation: 'horizontal' } });
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(container.querySelectorAll('.d0-bar').length).toBe(2);
  });

  it('renders axis labels when showLabels is true', () => {
    const { container } = render(BarChart, { props: { series: sampleSeries, showLabels: true } });
    const labels = container.querySelectorAll('.d0-axis-label');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('still renders with empty series', () => {
    const { container } = render(BarChart, { props: { series: [] } });
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('.d0-bar').length).toBe(0);
  });

  it('renders bar titles with label and value', () => {
    const { container } = render(BarChart, { props: { series: sampleSeries } });
    const title = container.querySelector('.d0-bar title');
    expect(title?.textContent).toContain('A');
    expect(title?.textContent).toContain('10');
  });
});
