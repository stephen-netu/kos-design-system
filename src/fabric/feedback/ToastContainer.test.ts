import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import ToastContainer from './ToastContainer.svelte';

describe('ToastContainer', () => {
  afterEach(() => cleanup());

  it('renders empty container when toasts array is empty', () => {
    const { container } = render(ToastContainer, {
      toasts: [],
      ondismiss: vi.fn(),
    });
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region!.querySelectorAll('[role="alert"]').length).toBe(0);
  });

  it('renders toast for each item in toasts array', () => {
    const toasts = [
      { id: '1', message: 'First', type: 'info' as const },
      { id: '2', message: 'Second', type: 'success' as const },
    ];
    const { container } = render(ToastContainer, {
      toasts,
      ondismiss: vi.fn(),
    });
    expect(container.querySelectorAll('[role="alert"]').length).toBe(2);
  });

  it('renders toast with correct message text', () => {
    const toasts = [{ id: '1', message: 'Operation complete', type: 'success' as const }];
    const { container } = render(ToastContainer, {
      toasts,
      ondismiss: vi.fn(),
    });
    expect(container.textContent).toContain('Operation complete');
  });

  it('renders toast with correct type class (toast-success, toast-error, etc.)', () => {
    const toasts = [
      { id: '1', message: 'A', type: 'success' as const },
      { id: '2', message: 'B', type: 'error' as const },
      { id: '3', message: 'C', type: 'info' as const },
      { id: '4', message: 'D', type: 'warning' as const },
    ];
    const { container } = render(ToastContainer, {
      toasts,
      ondismiss: vi.fn(),
    });
    expect(container.querySelector('.toast-success')).not.toBeNull();
    expect(container.querySelector('.toast-error')).not.toBeNull();
    expect(container.querySelector('.toast-info')).not.toBeNull();
    expect(container.querySelector('.toast-warning')).not.toBeNull();
  });

  it('calls ondismiss with toast id when dismiss button is clicked', async () => {
    const ondismiss = vi.fn();
    const toasts = [{ id: 'abc', message: 'Dismiss me', type: 'info' as const }];
    const { container } = render(ToastContainer, { toasts, ondismiss });
    await fireEvent.click(container.querySelector('[aria-label="Dismiss notification"]')!);
    expect(ondismiss).toHaveBeenCalledTimes(1);
    expect(ondismiss).toHaveBeenCalledWith('abc');
  });

  it('limits visible toasts to maxVisible', () => {
    const toasts = [
      { id: '1', message: 'A', type: 'info' as const },
      { id: '2', message: 'B', type: 'info' as const },
      { id: '3', message: 'C', type: 'info' as const },
    ];
    const { container } = render(ToastContainer, {
      toasts,
      ondismiss: vi.fn(),
      maxVisible: 2,
    });
    expect(container.querySelectorAll('[role="alert"]').length).toBe(2);
  });

  it('renders all 4 toast types', () => {
    const toasts = [
      { id: '1', message: 'Saved', type: 'success' as const },
      { id: '2', message: 'Failed', type: 'error' as const },
      { id: '3', message: 'FYI', type: 'info' as const },
      { id: '4', message: 'Careful', type: 'warning' as const },
    ];
    const { container } = render(ToastContainer, {
      toasts,
      ondismiss: vi.fn(),
    });
    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts.length).toBe(4);
  });
});
