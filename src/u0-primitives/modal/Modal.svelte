<script lang="ts">
  /**
   * Modal Component
   *
   * A reusable modal dialog that uses CSS visibility toggling instead of
   * conditional rendering to avoid blank modal issues in Tauri.
   *
   * Usage:
   * <Modal bind:isOpen title="My Modal" onClose={handleClose}>
   *   <p>Modal content here</p>
   * </Modal>
   */

  import { tick } from 'svelte';

  interface Props {
    /** Controls modal visibility */
    isOpen?: boolean;
    /** Modal title (optional) */
    title?: string;
    /** Called when modal is closed */
    onClose?: () => void;
    /** Additional CSS class for the modal container */
    class?: string;
    /** Whether to show the close button (default: true) */
    showCloseButton?: boolean;
    /** Whether to close on overlay click (default: true) */
    closeOnOverlayClick?: boolean;
    /** Whether to close on Escape key (default: true) */
    closeOnEscape?: boolean;
    /** Z-index for the modal (default: 9980) */
    zIndex?: number;
    /** Modal content */
    children?: import('svelte').Snippet;
    /** Additional actions for the header (optional) */
    headerActions?: import('svelte').Snippet;
    /** Footer content (optional) */
    footer?: import('svelte').Snippet;
  }

  let {
    isOpen = $bindable(false),
    title = '',
    onClose = () => {},
    class: className = '',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    zIndex = 9980,
    children,
    headerActions,
    footer
  }: Props = $props();

  let modalElement = $state<HTMLDivElement | undefined>(undefined);
  let previouslyFocusedElement: Element | null = null;
  let isVisible = $state(false);
  const modalId = `modal-${Math.random().toString(36).slice(2, 9)}`;

  // Handle isOpen changes with animation delay
  $effect(() => {
    if (isOpen) {
      // Store previously focused element
      previouslyFocusedElement = document.activeElement;
      // Show modal (triggers CSS transition)
      isVisible = true;
      // Focus management after render
      tick().then(() => {
        modalElement?.focus();
        trapFocus();
      });
    } else {
      // Hide modal (triggers CSS transition)
      isVisible = false;
      // Restore focus after transition
      setTimeout(() => {
        if (previouslyFocusedElement instanceof HTMLElement) {
          previouslyFocusedElement.focus();
        }
      }, 150);
    }
  });

  function handleClose() {
    isOpen = false;
    onClose();
  }

  function handleOverlayClick(e: MouseEvent) {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) return;

    // Close on Escape
    if (closeOnEscape && e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }

    // Trap focus with Tab key
    if (e.key === 'Tab' && modalElement) {
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }

  function trapFocus() {
    // Initial focus on close button if available
    const closeButton = modalElement?.querySelector('.modal-close-btn') as HTMLElement;
    closeButton?.focus();
  }

  // Expose methods for programmatic control
  export function open() {
    isOpen = true;
  }

  export function close() {
    isOpen = false;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Always mounted, visibility toggled via CSS -->
<div
  class="modal-container"
  class:open={isOpen}
  class:visible={isVisible}
  style="z-index: {zIndex}"
  role="presentation"
  inert={!isOpen}
>
  <!-- Overlay -->
  <div
    class="modal-overlay"
    onclick={handleOverlayClick}
    role="presentation"
  ></div>

  <!-- Modal Dialog -->
  <div
    bind:this={modalElement}
    class="modal-dialog {className}"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? `${modalId}-title` : undefined}
  >
    {#if title || showCloseButton || headerActions}
      <header class="modal-header">
        {#if title}
          <h2 id="{modalId}-title" class="modal-title">{title}</h2>
        {:else}
          <div></div>
        {/if}

        <div class="modal-header-actions">
          {#if headerActions}
            {@render headerActions()}
          {/if}
          {#if showCloseButton}
            <button
              class="modal-close-btn"
              onclick={handleClose}
              aria-label="Close"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          {/if}
        </div>
      </header>
    {/if}

    <div class="modal-content">
      {#if children}
        {@render children()}
      {/if}
    </div>

    {#if footer}
      <footer class="modal-footer">
        {@render footer()}
      </footer>
    {/if}
  </div>
</div>

<style>
  .modal-container {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease-out;
  }

  .modal-container.open {
    pointer-events: auto;
    opacity: 1;
  }

  .modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: opacity 0.15s ease-out;
  }

  .modal-container.open .modal-overlay {
    opacity: 1;
  }

  .modal-dialog {
    position: relative;
    background: var(--color-bg-panel-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    z-index: 1;
    outline: none;
    box-shadow: var(--shadow-xl);
    transform: translateY(20px) scale(0.98);
    transition: transform var(--transition-normal), opacity var(--transition-normal);
    opacity: 0;
  }

  .modal-container.open .modal-dialog {
    transform: translateY(0) scale(1);
    opacity: 1;
  }

  .modal-dialog:focus {
    box-shadow: 0 0 0 2px var(--color-accent), var(--shadow-xl);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  .modal-title {
    margin: 0;
    font-size: var(--text-lg);
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-weight: 600;
    font-family: var(--font-sans);
  }

  .modal-header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: var(--space-1);
    display: flex;
    align-items: center;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .modal-close-btn:hover {
    color: var(--color-text-primary);
    background: rgba(255, 255, 255, 0.1);
  }

  .modal-close-btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .modal-content {
    overflow-y: auto;
    padding: var(--space-6);
    flex: 1;
    min-height: 0;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  /* Size variants via data attribute — :global() required since the value is set dynamically */
  :global(.modal-dialog[data-size="small"]) { max-width: 400px; }
  :global(.modal-dialog[data-size="large"]) { max-width: 800px; }
  :global(.modal-dialog[data-size="full"]) { max-width: 95vw; max-height: 95vh; }
</style>
