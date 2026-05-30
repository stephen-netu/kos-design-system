/**
 * Modal Stack Store — Stack-based modal management for @kos/design-system.
 *
 * Manages a stack of modals (not just one). Opening a modal pushes onto the
 * stack; closing pops. Enables "back" navigation when opening modals from
 * within other modals.
 *
 * Adopted from Chronicler's modalStack.ts pattern (2026-05-25 investigation).
 *
 * Usage:
 *   import { modalStackStore } from '@kos/design-system';
 *
 *   // Push a modal
 *   modalStackStore.push({ id: 'confirm-delete', props: { itemId: 'abc' } });
 *
 *   // Pop (returns to previous modal, or closes all if stack is empty)
 *   modalStackStore.pop();
 *
 *   // Close all modals
 *   modalStackStore.closeAll();
 *
 *   // In component:
 *   const activeModal = modalStackStore.active;
 *   const stackDepth = modalStackStore.depth;
 */

export interface ModalData {
  id: string;
  props?: Record<string, unknown>;
  onClose?: () => void;
}

class ModalStackStore {
  private stack: ModalData[] = $state([]);

  get active(): ModalData | null {
    if (this.stack.length === 0) return null;
    return this.stack[this.stack.length - 1];
  }

  get depth(): number {
    return this.stack.length;
  }

  get all(): readonly ModalData[] {
    return this.stack;
  }

  push(modal: ModalData): void {
    this.stack = [...this.stack, modal];
  }

  pop(): void {
    if (this.stack.length === 0) return;
    const closing = this.stack[this.stack.length - 1];
    this.stack = this.stack.slice(0, -1);
    closing.onClose?.();
  }

  closeAll(): void {
    while (this.stack.length > 0) {
      this.pop();
    }
  }

  removeById(id: string): void {
    const idx = this.stack.findIndex(m => m.id === id);
    if (idx === -1) return;
    const removing = this.stack[idx];
    this.stack = this.stack.filter(m => m.id !== id);
    removing.onClose?.();
  }
}

export const modalStackStore = new ModalStackStore();
