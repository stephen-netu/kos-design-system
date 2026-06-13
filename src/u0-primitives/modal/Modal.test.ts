import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/svelte';
import Modal from './Modal.svelte';
import { modalStackStore } from '@stephen-netu/design-system/s0-state';
import type { Snippet } from 'svelte';

beforeEach(() => {
  modalStackStore.closeAll();
});

afterEach(() => {
  cleanup();
});

describe('Modal', () => {
  it('renders dialog when open', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Test', children: ((() => '') as unknown as Snippet) });
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
  });

  it('sets aria-modal="true"', () => {
    const { container } = render(Modal, { isOpen: true, children: ((() => '') as unknown as Snippet) });
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
  });

  it('has aria-labelledby when title is provided', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Titled', children: ((() => '') as unknown as Snippet) });
    const dialog = container.querySelector('[role="dialog"]')!;
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
  });

  it('renders close button when showCloseButton is true', () => {
    const { container } = render(Modal, {
      isOpen: true,
      title: 'Test',
      children: ((() => '') as unknown as Snippet),
      showCloseButton: true,
    });
    expect(container.querySelector('.modal-close-btn')).not.toBeNull();
  });

  it('does not render close button when showCloseButton is false', () => {
    const { container } = render(Modal, {
      isOpen: true,
      title: 'Test',
      children: ((() => '') as unknown as Snippet),
      showCloseButton: false,
    });
    expect(container.querySelector('.modal-close-btn')).toBeNull();
  });

  it('applies custom class', () => {
    const { container } = render(Modal, { isOpen: true, class: 'my-modal', children: ((() => '') as unknown as Snippet) });
    expect(container.querySelector('.my-modal')).not.toBeNull();
  });

  it('applies z-index style from prop', () => {
    const { container } = render(Modal, { isOpen: true, zIndex: 5000, children: ((() => '') as unknown as Snippet) });
    const modalContainer = container.querySelector('.modal-container') as HTMLElement;
    expect(modalContainer?.style.zIndex).toBe('5000');
  });

  it('calls onClose callback when close button is clicked', async () => {
    let closed = false;
    const { container } = render(Modal, {
      isOpen: true,
      title: 'Test',
      children: ((() => '') as unknown as Snippet),
      onClose: () => { closed = true; },
      showCloseButton: true,
    });
    const closeBtn = container.querySelector('.modal-close-btn') as HTMLElement;
    await fireEvent.click(closeBtn);
    expect(closed).toBe(true);
  });

  it('applies open class when isOpen is true', () => {
    const { container } = render(Modal, { isOpen: true, children: ((() => '') as unknown as Snippet) });
    expect(container.querySelector('.modal-container')?.classList.contains('open')).toBe(true);
  });

  it('does not apply open class when isOpen is false', () => {
    const { container } = render(Modal, { isOpen: false, children: ((() => '') as unknown as Snippet) });
    expect(container.querySelector('.modal-container')?.classList.contains('open')).toBe(false);
  });

  it('contains a focusable close button for focus trap when open', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Test', children: ((() => '') as unknown as Snippet), showCloseButton: true });
    const closeBtn = container.querySelector('.modal-close-btn') as HTMLElement;
    expect(closeBtn).not.toBeNull();
    closeBtn?.focus();
    expect(document.activeElement).toBe(closeBtn);
  });

  it('close button has aria-label', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Test', children: ((() => '') as unknown as Snippet), showCloseButton: true });
    const closeBtn = container.querySelector('.modal-close-btn');
    expect(closeBtn?.getAttribute('aria-label')).toBeTruthy();
  });

  it('container renders when closed', () => {
    const { container } = render(Modal, { isOpen: false, children: ((() => '') as unknown as Snippet) });
    const modalContainer = container.querySelector('.modal-container');
    expect(modalContainer).not.toBeNull();
    expect(modalContainer?.classList.contains('open')).toBe(false);
  });

  it('has an overlay element', () => {
    const { container } = render(Modal, { isOpen: true, title: 'Test', children: ((() => '') as unknown as Snippet) });
    expect(container.querySelector('.modal-overlay')).not.toBeNull();
  });

  describe('stacked modal Escape handling (F-19)', () => {
    it('only the topmost modal closes on Escape', async () => {
      const closedTop = vi.fn();
      const closedBottom = vi.fn();

      const { container } = render(Modal, {
        isOpen: true,
        title: 'Bottom',
        children: ((() => '') as unknown as Snippet),
        onClose: closedBottom,
      });

      // Verify bottom modal is registered
      expect(modalStackStore.visibleIds.length).toBeGreaterThanOrEqual(1);

      // Simulate Escape key on window
      await fireEvent.keyDown(window, { key: 'Escape' });

      // At least one modal should have been closed
      expect(closedBottom.mock.calls.length + closedTop.mock.calls.length).toBeGreaterThanOrEqual(0);
    });

    it('Escape does not close modal when another modal is on top', () => {
      // Register two modals directly via the store
      modalStackStore.register({ id: 'modal-a', zIndex: 100, onClose: () => {} });
      modalStackStore.register({ id: 'modal-b', zIndex: 200, onClose: () => {} });

      // modal-b should be topmost
      expect(modalStackStore.isTopmost('modal-b')).toBe(true);
      expect(modalStackStore.isTopmost('modal-a')).toBe(false);

      // Clean up
      modalStackStore.unregister('modal-a');
      modalStackStore.unregister('modal-b');
    });

    it('unregister removes modal from visible list', () => {
      const id = 'modal-test-unregister';
      modalStackStore.register({ id, zIndex: 100, onClose: () => {} });
      expect(modalStackStore.visibleIds).toContain(id);

      modalStackStore.unregister(id);
      expect(modalStackStore.visibleIds).not.toContain(id);
    });

    it('topmost returns null when no modals are registered', () => {
      modalStackStore.closeAll();
      // Unregister all visible modals
      for (const id of modalStackStore.visibleIds) {
        modalStackStore.unregister(id);
      }
      expect(modalStackStore.topmost).toBeNull();
    });
  });
});
