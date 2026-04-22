<script lang="ts" module>
  /**
   * LockIndicator — Collaborative lock state indicator
   * 
   * A generalized version of NNJAS SectionLock for the LEAP design system.
   * Shows who is currently editing a shared resource.
   * 
   * @example
   * <LockIndicator 
   *   user={{ name: 'Alice', color: '#ff0000' }}
   *   since={Date.now() - 60000}
   *   onRequestAccess={() => showToast('Waiting for Alice...')}
   * />
   */
  export interface LockUser {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  }

  export type LockState = 'locked' | 'requesting' | 'available';
</script>

<script lang="ts">
  interface Props {
    state?: LockState;
    user?: LockUser | null;
    since?: number | null;
    onRequestAccess?: () => void;
    class?: string;
  }

  let {
    state = 'available',
    user = null,
    since = null,
    onRequestAccess,
    class: className = ''
  }: Props = $props();

  let duration = $derived.by(() => {
    if (!since) return '';
    const diff = Date.now() - since;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  });

  function handleClick() {
    if (state === 'locked' && onRequestAccess) {
      onRequestAccess();
    }
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
</script>

<div 
  class="lock-indicator lock-indicator--{state} {className}"
  role="status"
  aria-live="polite"
>
  {#if state === 'locked' && user}
    <div class="lock-content">
      {#if user.avatar}
        <img src={user.avatar} alt="" class="lock-avatar" />
      {:else}
        <div 
          class="lock-avatar lock-avatar--initials"
          style="background-color: {user.color}"
        >
          {getInitials(user.name)}
        </div>
      {/if}
      
      <div class="lock-info">
        <span class="lock-user">{user.name}</span>
        <span class="lock-status">editing for {duration}</span>
      </div>
      
      {#if onRequestAccess}
        <button 
          class="lock-request-btn"
          onclick={handleClick}
          type="button"
        >
          Request Access
        </button>
      {/if}
    </div>
    
    <div class="lock-bar" style="background-color: {user.color}"></div>
  {:else if state === 'requesting'}
    <div class="lock-content">
      <div class="lock-spinner" aria-hidden="true"></div>
      <span class="lock-message">Requesting access...</span>
    </div>
  {:else if state === 'available'}
    <div class="lock-content lock-content--available">
      <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span class="lock-message">Available for editing</span>
    </div>
  {/if}
</div>

<style>
  .lock-indicator {
    position: relative;
    background: var(--color-bg-panel, #222);
    border-radius: var(--radius-md, 4px);
    overflow: hidden;
  }

  .lock-indicator--locked {
    border: 1px solid var(--color-border-default, #333);
  }

  .lock-indicator--requesting {
    background: var(--color-accent-subtle, rgba(184, 115, 51, 0.15));
    border: 1px solid var(--color-accent, #b87333);
  }

  .lock-indicator--available {
    background: var(--color-success-subtle, rgba(39, 174, 96, 0.15));
    border: 1px solid var(--color-success, #27ae60);
    opacity: 0.7;
  }

  .lock-content {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
  }

  .lock-avatar {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full, 9999px);
    flex-shrink: 0;
  }

  .lock-avatar--initials {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xs, 0.75rem);
    font-weight: 600;
    color: var(--color-bg-app, #141414);
  }

  .lock-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .lock-user {
    font-size: var(--text-sm, 0.875rem);
    font-weight: 500;
    color: var(--color-text-primary, #e8e8e8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lock-status {
    font-size: var(--text-xs, 0.75rem);
    color: var(--color-text-muted, #666);
  }

  .lock-request-btn {
    padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
    background: var(--color-accent-subtle, rgba(184, 115, 51, 0.15));
    color: var(--color-accent, #b87333);
    border: 1px solid var(--color-accent, #b87333);
    border-radius: var(--radius-sm, 2px);
    font-size: var(--text-xs, 0.75rem);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .lock-request-btn:hover {
    background: var(--color-accent, #b87333);
    color: var(--color-bg-app, #141414);
  }

  .lock-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 0 0 var(--radius-sm, 2px) var(--radius-sm, 2px);
  }

  .lock-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-accent, #b87333);
    border-top-color: transparent;
    border-radius: var(--radius-full, 9999px);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .lock-message {
    font-size: var(--text-sm, 0.875rem);
    color: var(--color-text-secondary, #888);
  }

  .lock-content--available {
    color: var(--color-success, #27ae60);
  }

  .lock-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
</style>
