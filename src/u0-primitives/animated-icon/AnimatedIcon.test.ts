import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import AnimatedIcon from './AnimatedIcon.svelte';

describe('AnimatedIcon', () => {
  afterEach(() => cleanup());

  it('renders an SVG element', () => {
    const { container } = render(AnimatedIcon, { name: 'power-node' });
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('applies the default size (40px)', () => {
    const { container } = render(AnimatedIcon, { name: 'power-node' });
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('style')).toContain('width: 40px');
    expect(svg.getAttribute('style')).toContain('height: 40px');
  });

  it('applies a custom size', () => {
    const { container } = render(AnimatedIcon, { name: 'power-node', size: 64 });
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('style')).toContain('width: 64px');
    expect(svg.getAttribute('style')).toContain('height: 64px');
  });

  it('applies a custom color', () => {
    const { container } = render(AnimatedIcon, { name: 'power-node', color: 'red' });
    expect(container.querySelector('svg')!.getAttribute('style')).toContain('color: red');
  });

  it('renders power-node icon paths (core circle)', () => {
    const { container } = render(AnimatedIcon, { name: 'power-node' });
    const svg = container.querySelector('svg')!;
    expect(svg.querySelectorAll('circle').length).toBeGreaterThanOrEqual(3);
  });

  it('renders activity icon paths (rect bars)', () => {
    const { container } = render(AnimatedIcon, { name: 'activity' });
    const svg = container.querySelector('svg')!;
    expect(svg.querySelectorAll('rect').length).toBe(4);
  });

  it('renders connection icon paths (two circles and a line)', () => {
    const { container } = render(AnimatedIcon, { name: 'connection' });
    const svg = container.querySelector('svg')!;
    expect(svg.querySelectorAll('circle').length).toBeGreaterThanOrEqual(3);
    expect(svg.querySelectorAll('line').length).toBe(1);
  });

  it('contains animate elements for animated icons', () => {
    const { container } = render(AnimatedIcon, { name: 'activity' });
    const svg = container.querySelector('svg')!;
    expect(svg.querySelectorAll('animate').length).toBeGreaterThan(0);
  });

  it('contains animateTransform for orbit animation on power-node', () => {
    const { container } = render(AnimatedIcon, { name: 'power-node', animation: 'orbit' });
    const svg = container.querySelector('svg')!;
    expect(svg.querySelectorAll('animateTransform').length).toBe(1);
  });

  it('render pulse animation markup on power-node', () => {
    const { container } = render(AnimatedIcon, { name: 'power-node', animation: 'pulse' });
    const svg = container.querySelector('svg')!;
    expect(svg.querySelectorAll('animate').length).toBeGreaterThanOrEqual(2);
  });

  it('doubles speed halves the dur attribute', () => {
    const { container: c1 } = render(AnimatedIcon, { name: 'power-node', animation: 'pulse', speed: 1 });
    const animates1 = c1.querySelectorAll('animate');
    const dur1 = animates1[0].getAttribute('dur');

    cleanup();

    const { container: c2 } = render(AnimatedIcon, { name: 'power-node', animation: 'pulse', speed: 2 });
    const animates2 = c2.querySelectorAll('animate');
    const dur2 = animates2[0].getAttribute('dur');

    expect(dur1).toBe('2000ms');
    expect(dur2).toBe('1000ms');
  });

  it('has aria-hidden attribute on SVG', () => {
    const { container } = render(AnimatedIcon, { name: 'power-node' });
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders energy-pulse icon correctly', () => {
    const { container } = render(AnimatedIcon, { name: 'energy-pulse' });
    const svg = container.querySelector('svg')!;
    expect(svg.querySelectorAll('circle').length).toBeGreaterThanOrEqual(4);
  });

  it('renders status-ring icon correctly', () => {
    const { container } = render(AnimatedIcon, { name: 'status-ring' });
    const svg = container.querySelector('svg')!;
    expect(svg.querySelectorAll('path').length).toBe(2);
  });
});
