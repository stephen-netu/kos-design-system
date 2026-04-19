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

  interface Props {
    toasts: Toast[];
    ondismiss: (id: string) => void;
    /** S-05: Maximum visible toasts */
    maxVisible?: number;
  }

  const props: Props = $props();

  // S-05: Bound toasts to maxVisible (default 5)
  const MAX_TOASTS = $derived(Math.min(props.toasts.length, props.maxVisible ?? 5));
  const visibleToasts = $derived(props.toasts.slice(0, MAX_TOASTS));

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: '#27ae60',
    error: '#c0392b',
    info: '#2980b9',
    warning: '#f39c12',
  };
</script>

<div class="toast-container" role="region" aria-label="Notifications">
  {#each visibleToasts as toast (toast.id)}
    {@const Icon = icons[toast.type]}
    <div
      class="toast toast-{toast.type}"
      style="--toast-color: {colors[toast.type]}"
      transition:fly={{ y: 20, duration: 200 }}
      role="alert"
    >
      <Icon size={20} />
      <span class="message">{toast.message}</span>
      <button class="dismiss" onclick={() => props.ondismiss(toast.id)} aria-label="Dismiss notification">
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
    gap: 8px;
    z-index: 9999;
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-bg-panel, #222222);
    border: 1px solid var(--toast-color);
    border-radius: var(--radius-lg, 0.5rem);
    box-shadow: var(--shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.3));
    min-width: 300px;
    max-width: 500px;
  }

  .toast :global(svg) {
    color: var(--toast-color);
    flex-shrink: 0;
  }

  .message {
    flex: 1;
    color: var(--color-text-primary, #f2efe9);
    font-size: 14px;
  }

  .dismiss {
    background: none;
    border: none;
    color: var(--color-text-tertiary, #706858);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm, 0.25rem);
    transition: color 0.15s, background 0.15s;
  }

  .dismiss:hover {
    color: var(--color-text-primary, #f2efe9);
    background: rgba(255, 255, 255, 0.1);
  }
</style>
