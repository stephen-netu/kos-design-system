import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import Avatar from './Avatar.svelte';

describe('Avatar', () => {
  afterEach(() => cleanup());

  it('renders the ds-avatar-wrapper root element', () => {
    const { container } = render(Avatar);
    expect(container.querySelector('.ds-avatar-wrapper')).not.toBeNull();
  });

  it('applies the size-sm class', () => {
    const { container } = render(Avatar, { size: 'sm' });
    expect(container.querySelector('.size-sm')).not.toBeNull();
  });

  it('applies the size-md class by default', () => {
    const { container } = render(Avatar);
    expect(container.querySelector('.size-md')).not.toBeNull();
  });

  it('applies the size-lg class', () => {
    const { container } = render(Avatar, { size: 'lg' });
    expect(container.querySelector('.size-lg')).not.toBeNull();
  });

  it('applies the size-xl class', () => {
    const { container } = render(Avatar, { size: 'xl' });
    expect(container.querySelector('.size-xl')).not.toBeNull();
  });

  it('renders an image when src is provided', () => {
    const { container } = render(Avatar, { src: 'https://example.com/photo.png', name: 'Jane' });
    const img = container.querySelector('.ds-avatar-image');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('https://example.com/photo.png');
  });

  it('renders initials from a two-word name', () => {
    const { container } = render(Avatar, { name: 'Jane Doe' });
    expect(container.querySelector('.ds-avatar-initials')!.textContent).toBe('JD');
  });

  it('renders initials from a single-word name', () => {
    const { container } = render(Avatar, { name: 'Alice' });
    expect(container.querySelector('.ds-avatar-initials')!.textContent).toBe('A');
  });

  it('renders a question mark when name is empty', () => {
    const { container } = render(Avatar);
    expect(container.querySelector('.ds-avatar-initials')!.textContent).toBe('?');
  });

  it('does not render a status dot when status is null', () => {
    const { container } = render(Avatar);
    expect(container.querySelector('.ds-avatar-status')).toBeNull();
  });

  it('renders a status dot with the online class', () => {
    const { container } = render(Avatar, { status: 'online' });
    const status = container.querySelector('.ds-avatar-status');
    expect(status).not.toBeNull();
    expect(status!.classList.contains('status-online')).toBe(true);
  });

  it('renders a status dot with the away class', () => {
    const { container } = render(Avatar, { status: 'away' });
    expect(container.querySelector('.status-away')).not.toBeNull();
  });

  it('renders a status dot with the busy class', () => {
    const { container } = render(Avatar, { status: 'busy' });
    expect(container.querySelector('.status-busy')).not.toBeNull();
  });

  it('renders a status dot with the offline class', () => {
    const { container } = render(Avatar, { status: 'offline' });
    expect(container.querySelector('.status-offline')).not.toBeNull();
  });

  it('renders typing dots when status is typing', () => {
    const { container } = render(Avatar, { status: 'typing' });
    expect(container.querySelectorAll('.typing-dot').length).toBe(3);
  });

  it('switches to initials fallback on image error', async () => {
    const { container } = render(Avatar, {
      src: 'https://example.com/broken.png',
      name: 'Test User',
    });
    const img = container.querySelector('.ds-avatar-image');
    expect(img).not.toBeNull();
    await fireEvent.error(img!);
    expect(container.querySelector('.ds-avatar-initials')).not.toBeNull();
    expect(container.querySelector('.ds-avatar-initials')!.textContent).toBe('TU');
  });
});
