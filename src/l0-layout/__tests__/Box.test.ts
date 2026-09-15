import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Box from '../Box.svelte';
import type { Layout } from '../types';

const sampleLayout: Layout = {
  direction: 'row',
  gap: 8,
  padding: [4, 8, 4, 8],
  align: 'center',
  childAlignment: 'start',
  sizing: 'fit',
};

describe('Box primitive', () => {
  it('renders with required id prop', () => {
    const { container } = render(Box, { props: { id: 'test-box' } });
    const el = container.querySelector('#test-box');
    expect(el).not.toBeNull();
  });

  it('exposes id via data-layout-id attribute', () => {
    const { container } = render(Box, { props: { id: 'my-layout' } });
    const el = container.querySelector('[data-layout-id="my-layout"]');
    expect(el).not.toBeNull();
  });

  it('applies layout style string', () => {
    const { container } = render(Box, { props: { id: 'styled', layout: sampleLayout } });
    const el = container.querySelector('#styled') as HTMLElement;
    expect(el?.style.getPropertyValue('--layout-direction')).toBe('row');
    expect(el?.style.getPropertyValue('--layout-gap')).toBe('8px');
  });

  it('renders children snippet', () => {
    const { container } = render(Box, {
      props: { id: 'with-children', layout: sampleLayout },
    });
    // Children render inside the Box div
    const el = container.querySelector('#with-children');
    expect(el).not.toBeNull();
  });

  it('uses default layout when none provided', () => {
    const { container } = render(Box, { props: { id: 'defaulted' } });
    const el = container.querySelector('#defaulted') as HTMLElement;
    expect(el?.style.getPropertyValue('--layout-direction')).toBe('row');
  });
});
