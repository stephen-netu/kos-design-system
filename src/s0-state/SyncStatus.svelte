<script lang="ts" module>
  /**
   * SyncStatus — Synchronization status with recovery actions
   * 
   * A generalized version of NNJAS RecoveryUI for the LEAP design system.
   * Shows sync state, errors, and provides recovery actions.
   * 
   * @example
   * <SyncStatus 
   *   status="error"
   *   error="Connection lost"
   *   pendingCount={5}
   *   onRetry={() => reconnect()}
   *   onExport={() => exportPending()}
   * />
   */
  export type SyncStatusState = 'synced' | 'syncing' | 'pending' | 'error' | 'offline';

  export interface SyncStatusAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }
</script>

<script lang="ts">
  interface Props {
    status: SyncStatusState;
    lastSync?: number | null;
    pendingCount?: number;
    error?: string | null;
    actions?: SyncStatusAction[];
    class?: string;
  }

  let {
    status,
    lastSync = null,
    pendingCount = 0,
    error = null,
    actions = [],
    class: className = ''
  }: Props = $props();

  let lastSyncText = $derived.by(() => {
    if (!lastSync) return 'Never';
    const diff = Date.now() - lastSync;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  });

  let statusConfig = $derived.by(() => {
    switch (status) {
      case 'synced':
        return {
          icon: 'check',
          color: 'var(--color-success, #27ae60)',
          label: 'Synced',
          message: `Last synced ${lastSyncText}`
        };
      case 'syncing':
        return {
          icon: 'sync',
          color: 'var(--color-accent, #b87333)',
          label: 'Syncing...',
          message: pendingCount > 0 ? `${pendingCount} items pending` : 'Synchronizing changes'
        };
      case 'pending':
        return {
          icon: 'clock',
          color: 'var(--color-warning, #f39c12)',
          label: 'Pending',
          message: `${pendingCount} item${pendingCount === 1 ? '' : 's'} waiting to sync`
        };
      case 'error':
        return {
          icon: 'alert',
          color: 'var(--color-error, #c0392b)',
          label: 'Sync Error',
          message: error || 'Synchronization failed'
        };
      case 'offline':
        return {
          icon: 'offline',
          color: 'var(--color-text-muted, #666)',
          label: 'Offline',
          message: 'Working offline - changes will sync when connected'
        };
    }
  });

  function getIconPath(icon: string): string {
    switch (icon) {
      case 'check':
        return 'M20 6L9 17l-5-5';
      case 'sync':
        return 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15';
      case 'clock':
        return 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z';
      case 'alert':
        return 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 17v-2M12 9v4';
      case 'offline':
        return 'M1 1l22 22M9 9l3 3m-3 0l3-3m-3-3l-5.3 5.3M16.7 6.7L12 12m-3-3l-5.3-5.3';
      default:
        return '';
    }
  }

  function getActionClass(variant: string): string {
    switch (variant) {
      case 'primary':
        return 'action-primary';
      case 'danger':
        return 'action-danger';
      default:
        return 'action-secondary';
    }
  }
</script>

<div class="sync-status sync-status--{status} {className}" role="status" aria-live="polite">
  <div class="sync-header">
    <div class="sync-indicator" style="color: {statusConfig.color}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class:spin={status === 'syncing'}>
        <path d={getIconPath(statusConfig.icon)} />
      </svg>
    </div>
    
    <div class="sync-info">
      <span class="sync-label" style="color: {statusConfig.color}">
        {statusConfig.label}
      </span>
      <span class="sync-message">{statusConfig.message}</span>
    </div>
  </div>

  {#if actions.length > 0}
    <div class="sync-actions">
      {#each actions as action (action.label)}
        <button 
          class="sync-action {getActionClass(action.variant || 'secondary')}"
          onclick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sync-status {
    background: var(--color-bg-panel, #222);
    border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
    border-radius: var(--radius-md, 4px);
    overflow: hidden;
  }

  .sync-status--error {
    border-color: var(--color-error, #c0392b);
  }

  .sync-status--syncing {
    border-color: var(--color-accent, #b87333);
  }

  .sync-status--offline {
    border-color: var(--color-text-muted, #666);
  }

  .sync-header {
    display: flex;
    align-items: center;
    gap: var(--space-3, 0.75rem);
    padding: var(--space-3, 0.75rem);
  }

  .sync-indicator {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }

  .sync-indicator svg {
    width: 100%;
    height: 100%;
  }

  .spin {
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .sync-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1, 0.25rem);
    flex: 1;
    min-width: 0;
  }

  .sync-label {
    font-size: var(--text-sm, 0.875rem);
    font-weight: 600;
  }

  .sync-message {
    font-size: var(--text-xs, 0.75rem);
    color: var(--color-text-secondary, #888);
  }

  .sync-actions {
    display: flex;
    gap: var(--space-2, 0.5rem);
    padding: 0 var(--space-3, 0.75rem) var(--space-3, 0.75rem);
    border-top: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .sync-action {
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
    border-radius: var(--radius-md, 4px);
    font-size: var(--text-sm, 0.875rem);
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }

  .action-primary {
    background: var(--color-accent, #b87333);
    color: var(--color-bg-app, #141414);
    border-color: var(--color-accent, #b87333);
  }

  .action-primary:hover {
    background: var(--color-accent-hover, #d4956a);
  }

  .action-secondary {
    background: transparent;
    color: var(--color-text-secondary, #888);
    border-color: var(--color-border-default, #333);
  }

  .action-secondary:hover {
    background: var(--color-bg-hover, rgba(255, 255, 255, 0.03));
    color: var(--color-text-primary, #e8e8e8);
  }

  .action-danger {
    background: var(--color-error-subtle, rgba(192, 57, 43, 0.15));
    color: var(--color-error, #c0392b);
    border-color: var(--color-error, #c0392b);
  }

  .action-danger:hover {
    background: var(--color-error, #c0392b);
    color: var(--color-bg-app, #141414);
  }
</style>
