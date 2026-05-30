import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import Modal from './Modal.svelte';
import { tick } from 'svelte';

afterEach(() => {
  cleanup();
});

describe('Modal', () => {
  it('renders dialog when open', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Test', children: () => 'body' });
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
  });

  it('sets aria-modal="true"', () => {
    const { container } = render(Modal, { isOpen: true, children: () => 'body' });
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
  });

  it('has aria-labelledby when title is provided', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Titled', children: () => 'body' });
    const dialog = container.querySelector('[role="dialog"]')!;
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
  });

  it('renders close button when showCloseButton is true', () => {
    const { container } = render(Modal, {
      isOpen: true,
      title: 'Test',
      children: () => 'body',
      showCloseButton: true,
    });
    expect(container.querySelector('.modal-close-btn')).not.toBeNull();
  });

  it('does not render close button when showCloseButton is false', () => {
    const { container } = render(Modal, {
      isOpen: true,
      title: 'Test',
      children: () => 'body',
      showCloseButton: false,
    });
    expect(container.querySelector('.modal-close-btn')).toBeNull();
  });

  it('applies custom class', () => {
    const { container } = render(Modal, { isOpen: true, class: 'my-modal', children: () => 'body' });
    expect(container.querySelector('.my-modal')).not.toBeNull();
  });

  it('applies z-index style from prop', () => {
    const { container } = render(Modal, { isOpen: true, zIndex: 5000, children: () => 'body' });
    const modalContainer = container.querySelector('.modal-container') as HTMLElement;
    expect(modalContainer?.style.zIndex).toBe('5000');
  });

  it('calls onClose callback when close button is clicked', async () => {
    let closed = false;
    const { container } = render(Modal, {
      isOpen: true,
      title: 'Test',
      children: () => 'body',
      onClose: () => { closed = true; },
      showCloseButton: true,
    });
    const closeBtn = container.querySelector('.modal-close-btn') as HTMLElement;
    await fireEvent.click(closeBtn);
    expect(closed).toBe(true);
  });

  it('applies open class when isOpen is true', () => {
    const { container } = render(Modal, { isOpen: true, children: () => 'body' });
    expect(container.querySelector('.modal-container')?.classList.contains('open')).toBe(true);
  });

  it('does not apply open class when isOpen is false', () => {
    const { container } = render(Modal, { isOpen: false, children: () => 'body' });
    expect(container.querySelector('.modal-container')?.classList.contains('open')).toBe(false);
  });

  it('contains a focusable close button for focus trap when open', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Test', children: () => 'body', showCloseButton: true });
    const closeBtn = container.querySelector('.modal-close-btn');
    expect(closeBtn).not.toBeNull();
    closeBtn?.focus();
    expect(document.activeElement).toBe(closeBtn);
  });

  it('close button has aria-label', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Test', children: () => 'body', showCloseButton: true });
    const closeBtn = container.querySelector('.modal-close-btn');
    expect(closeBtn?.getAttribute('aria-label')).toBeTruthy();
  });

  it('container renders when closed', () => {
    const { container } = render(Modal, { isOpen: false, children: () => 'body' });
    const modalContainer = container.querySelector('.modal-container');
    expect(modalContainer).not.toBeNull();
    expect(modalContainer?.classList.contains('open')).toBe(false);
  });

  it('has an overlay element', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Test', children: () => 'body' });
    expect(container.querySelector('.modal-overlay')).not.toBeNull();
  });
});
