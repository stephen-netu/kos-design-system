import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import Spinner from './Spinner.svelte';

describe('Spinner', () => {
  afterEach(() => cleanup());

  it('renders a wrapper element', () => {
    const { container } = render(Spinner);
    expect(container.querySelector('.ds-spinner-wrapper')).not.toBeNull();
  });

  it('renders the spinner ring', () => {
    const { container } = render(Spinner);
    expect(container.querySelector('.ds-spinner-ring')).not.toBeNull();
  });

  it('renders the spinner core', () => {
    const { container } = render(Spinner);
    expect(container.querySelector('.ds-spinner-core')).not.toBeNull();
  });

  it('renders dust particles', () => {
    const { container } = render(Spinner);
    const particles = container.querySelectorAll('.ds-spinner-particle');
    expect(particles.length).toBe(3);
  });

  it('applies default size and color classes', () => {
    const { container } = render(Spinner);
    expect(container.querySelector('.size-md')).not.toBeNull();
    expect(container.querySelector('.color-accent')).not.toBeNull();
  });

  it('applies size-sm class', () => {
    const { container } = render(Spinner, { props: { size: 'sm' } });
    expect(container.querySelector('.size-sm')).not.toBeNull();
  });

  it('applies size-lg class', () => {
    const { container } = render(Spinner, { props: { size: 'lg' } });
    expect(container.querySelector('.size-lg')).not.toBeNull();
  });

  it('applies size-xl class', () => {
    const { container } = render(Spinner, { props: { size: 'xl' } });
    expect(container.querySelector('.size-xl')).not.toBeNull();
  });

  it('applies color-muted class', () => {
    const { container } = render(Spinner, { props: { color: 'muted' } });
    expect(container.querySelector('.color-muted')).not.toBeNull();
  });

  it('applies color-white class', () => {
    const { container } = render(Spinner, { props: { color: 'white' } });
    expect(container.querySelector('.color-white')).not.toBeNull();
  });

  it('has role="status" and aria-label', () => {
    const { container } = render(Spinner);
    const wrapper = container.querySelector('.ds-spinner-wrapper')!;
    expect(wrapper.getAttribute('role')).toBe('status');
    expect(wrapper.getAttribute('aria-label')).toBe('Loading');
  });

  it('applies custom class', () => {
    const { container } = render(Spinner, { props: { class: 'my-spinner' } });
    expect(container.querySelector('.my-spinner')).not.toBeNull();
  });
});
