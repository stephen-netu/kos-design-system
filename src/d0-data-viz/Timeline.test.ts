import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import Timeline from './Timeline.svelte';

const sampleEntries = [
  { id: 'e1', timestamp: '10:00', label: 'Start', description: 'System boot', color: '#b87333' },
  { id: 'e2', timestamp: '10:05', label: 'Connect', description: 'Peer connected', color: '#5f9ea0' },
  { id: 'e3', timestamp: '10:10', label: 'Sync', description: 'State synced', color: '#e6c470' },
];

describe('Timeline', () => {
  afterEach(() => cleanup());

  it('renders an svg with role img', () => {
    const { container } = render(Timeline, { props: { entries: sampleEntries } });
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).not.toBeNull();
  });

  it('renders a dot for each entry', () => {
    const { container } = render(Timeline, { props: { entries: sampleEntries } });
    expect(container.querySelectorAll('.d0-timeline-dot').length).toBe(3);
  });

  it('renders labels for each entry', () => {
    const { container } = render(Timeline, { props: { entries: sampleEntries } });
    const text = container.textContent || '';
    expect(text).toContain('Start');
    expect(text).toContain('Connect');
    expect(text).toContain('Sync');
  });

  it('renders timestamps', () => {
    const { container } = render(Timeline, { props: { entries: sampleEntries } });
    const text = container.textContent || '';
    expect(text).toContain('10:00');
    expect(text).toContain('10:05');
    expect(text).toContain('10:10');
  });

  it('renders descriptions when provided', () => {
    const { container } = render(Timeline, { props: { entries: sampleEntries } });
    const text = container.textContent || '';
    expect(text).toContain('System boot');
    expect(text).toContain('Peer connected');
  });

  it('renders a connecting line for multiple entries', () => {
    const { container } = render(Timeline, { props: { entries: sampleEntries } });
    expect(container.querySelector('.d0-timeline-line')).not.toBeNull();
  });

  it('omits connecting line for single entry', () => {
    const { container } = render(Timeline, { props: { entries: [sampleEntries[0]] } });
    expect(container.querySelector('.d0-timeline-line')).toBeNull();
  });

  it('renders horizontal orientation with class', () => {
    const { container } = render(Timeline, { props: { entries: sampleEntries, orientation: 'horizontal' } });
    expect(container.querySelector('.d0-timeline.horizontal')).not.toBeNull();
  });

  it('uses custom aria-label', () => {
    const { container } = render(Timeline, { props: { entries: sampleEntries, 'aria-label': 'Build timeline' } });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Build timeline');
  });

  it('renders dots with custom fill color', () => {
    const { container } = render(Timeline, { props: { entries: [sampleEntries[0]] } });
    const dot = container.querySelector('.d0-timeline-dot') as SVGCircleElement;
    expect(dot?.getAttribute('fill')).toBe('#b87333');
  });
});
