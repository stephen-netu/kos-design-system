import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import Badge from './Badge.svelte';

describe('Badge', () => {
  afterEach(() => cleanup());

  it('renders with default variant', () => {
    const { container } = render(Badge, { props: { children: () => {} } });
    expect(container.querySelector('.ds-badge')).not.toBeNull();
    expect(container.querySelector('.variant-status')).not.toBeNull();
  });

  it('renders with info variant color class', () => {
    const { container } = render(Badge, { props: { color: 'info', children: () => {} } });
    expect(container.querySelector('.color-info')).not.toBeNull();
  });

  it('renders with success variant color class', () => {
    const { container } = render(Badge, { props: { color: 'success', children: () => {} } });
    expect(container.querySelector('.color-success')).not.toBeNull();
  });

  it('renders with warning variant color class', () => {
    const { container } = render(Badge, { props: { color: 'warning', children: () => {} } });
    expect(container.querySelector('.color-warning')).not.toBeNull();
  });

  it('renders with error variant color class', () => {
    const { container } = render(Badge, { props: { color: 'error', children: () => {} } });
    expect(container.querySelector('.color-error')).not.toBeNull();
  });

  it('applies size classes', () => {
    const { container: sm } = render(Badge, { props: { size: 'sm', children: () => {} } });
    expect(sm.querySelector('.size-sm')).not.toBeNull();

    const { container: lg } = render(Badge, { props: { size: 'lg', children: () => {} } });
    expect(lg.querySelector('.size-lg')).not.toBeNull();
  });

  it('renders dot variant without content span', () => {
    const { container } = render(Badge, { props: { variant: 'dot' } });
    expect(container.querySelector('.variant-dot')).not.toBeNull();
    expect(container.querySelector('.ds-badge-content')).toBeNull();
  });

  it('renders outline variant', () => {
    const { container } = render(Badge, { props: { variant: 'outline', children: () => {} } });
    expect(container.querySelector('.variant-outline')).not.toBeNull();
  });

  it('renders children text', () => {
    const { container } = render(Badge, { props: { children: () => 'Hello' } });
    expect(container.querySelector('.ds-badge-content')).not.toBeNull();
  });

  it('applies custom class', () => {
    const { container } = render(Badge, { props: { class: 'custom-badge', children: () => {} } });
    expect(container.querySelector('.custom-badge')).not.toBeNull();
  });
});
