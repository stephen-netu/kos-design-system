<script lang="ts">
  /**
   * ToastContainer - Fabric Component
   * 
   * Toast notification container with S-05 bounded display.
   * Decoupled from shell stores - parent provides toasts array.
   * 
   * @package @kos/design-system/fabric/feedback
   * @adr 2026-04-12-leap-substrate-refactor-001
   */
  import { fly, fade } from 'svelte/transition';
  import { CheckCircle, XCircle, Info, AlertTriangle, X } from '@lucide/svelte';

  export type ToastType = 'success' | 'error' | 'info' | 'warning';

  interface Toast {
    id: string;
    message: string;
    type: ToastType;
  }

  export interface Props {
    toasts: Toast[];
    ondismiss: (id: string) => void;
    /** S-05: Maximum visible toasts */
    maxVisible?: number;
  }

  let { toasts, ondismiss, maxVisible = 5 }: Props = $props();

  const MAX_TOASTS = $derived(Math.min(toasts.length, maxVisible));
  const visibleToasts = $derived(toasts.slice(0, MAX_TOASTS));

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  };

  // Semantic colors - use our new palette
  const colors = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-info)',
    warning: 'var(--color-warning)',
  };
</script>

<div class="toast-container scanlines" role="region" aria-label="Notifications">
  {#each visibleToasts as toast (toast.id)}
    {@const Icon = icons[toast.type]}
    <div
      class="toast toast-{toast.type}"
      style="--toast-color: {colors[toast.type]}"
      transition:fly={{ y: 20, duration: 200 }}
      role="alert"
    >
      <Icon size={18} />
      <span class="message">{toast.message}</span>
      <button class="dismiss" onclick={() => ondismiss(toast.id)} aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    z-index: 9999;
    pointer-events: none;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 10px 14px;
    background: var(--color-bg-panel);
    border: 2px solid var(--border-default);
    border-radius: 0; /* Military sharp edges */
    box-shadow: none;
    min-width: 280px;
    max-width: 480px;
  }

  .toast :global(svg) {
    color: var(--toast-color);
    flex-shrink: 0;
  }

  .message {
    flex: 1;
    color: var(--color-text-primary);
    font-size: var(--text-sm);
  }

  .dismiss {
    background: transparent;
    border: 2px solid var(--border-subtle);
    color: var(--color-text-tertiary);
    cursor: pointer;
    padding: 2px 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    font-size: var(--text-xs);
    font-weight: 500;
  }

  .dismiss:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-panel-elevated);
    border-color: var(--color-accent);
  }

  /* Variant-specific styling */
  .toast-success {
    border-color: var(--color-success);
    background: rgba(63, 185, 80, 0.1);
  }

  .toast-error {
    border-color: var(--color-error);
    background: rgba(248, 81, 73, 0.1);
  }

  .toast-info {
    border-color: var(--color-info);
    background: rgba(88, 166, 255, 0.1);
  }

  .toast-warning {
    border-color: var(--color-warning);
    background: rgba(210, 153, 34, 0.1);
  }

  @media (prefers-reduced-motion: reduce) {
    .toast { transition: none; }
  }
</style>