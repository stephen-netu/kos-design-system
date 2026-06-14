import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import SparkLine from './SparkLine.svelte';

describe('SparkLine', () => {
  afterEach(() => cleanup());

  it('renders an svg with role img', () => {
    const { container } = render(SparkLine, { props: { data: [1, 5, 3, 8, 2] } });
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).not.toBeNull();
  });

  it('renders a path element for the line', () => {
    const { container } = render(SparkLine, { props: { data: [1, 5, 3, 8, 2] } });
    const path = container.querySelector('.d0-sparkline-path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('d')).toBeTruthy();
  });

  it('renders empty path for single data point', () => {
    const { container } = render(SparkLine, { props: { data: [42] } });
    const path = container.querySelector('.d0-sparkline-path');
    expect(path?.getAttribute('d')).toBe('');
  });

  it('applies custom width and height via viewBox', () => {
    const { container } = render(SparkLine, { props: { data: [1, 2, 3], width: 200, height: 64 } });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 200 64');
  });

  it('applies custom color to the path stroke', () => {
    const { container } = render(SparkLine, { props: { data: [1, 2, 3], color: '#ff0000' } });
    const path = container.querySelector('.d0-sparkline-path');
    expect(path?.getAttribute('stroke')).toBe('#ff0000');
  });

  it('applies custom strokeWidth', () => {
    const { container } = render(SparkLine, { props: { data: [1, 2, 3], strokeWidth: 4 } });
    const path = container.querySelector('.d0-sparkline-path');
    expect(path?.getAttribute('stroke-width')).toBe('4');
  });

  it('uses default aria-label of Sparkline', () => {
    const { container } = render(SparkLine, { props: { data: [1, 2] } });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Sparkline');
  });

  it('accepts custom aria-label', () => {
    const { container } = render(SparkLine, { props: { data: [1, 2], 'aria-label': 'CPU usage' } });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('CPU usage');
  });
});
