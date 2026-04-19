<script lang="ts">
  import type { GovernanceMode } from './grove-types';
  import Card from '../../u0-primitives/card/Card.svelte';
  import Badge from '../../u0-primitives/badge/Badge.svelte';

  interface Props {
    groveId: string;
    governance: GovernanceMode;
    memberCount: number;
    coordinatorName?: string;
    isJoined: boolean;
    epoch: number;
    class?: string;
    onjoin?: () => void;
    onleave?: () => void;
  }

  let {
    groveId,
    governance,
    memberCount,
    coordinatorName,
    isJoined,
    epoch,
    class: className = '',
    onjoin,
    onleave
  }: Props = $props();

  let governanceLabel = $derived(
    governance === 'leader' ? 'Leader'
    : governance === 'peer' ? 'Peer'
    : 'Role-Based'
  );

  let governanceColor = $derived<'accent' | 'info' | 'warning'>(
    governance === 'leader' ? 'accent'
    : governance === 'peer' ? 'info'
    : 'warning'
  );

  function handleAction() {
    if (isJoined) {
      onleave?.();
    } else {
      onjoin?.();
    }
  }
</script>

<Card variant="elevated" class="ds-grove-card {className}">
  <div class="ds-grove-card-inner">
    <div class="ds-grove-header">
      <h3 class="ds-grove-name" title={groveId}>{groveId}</h3>
      <Badge variant="status" color={governanceColor} size="sm">
        {governanceLabel}
      </Badge>
    </div>

    <div class="ds-grove-meta">
      <span class="ds-grove-stat">
        <span class="ds-grove-stat-value">{memberCount}</span>
        <span class="ds-grove-stat-label">{memberCount === 1 ? 'member' : 'members'}</span>
      </span>

      <span class="ds-grove-stat">
        <span class="ds-grove-stat-value">e{epoch}</span>
        <span class="ds-grove-stat-label">epoch</span>
      </span>
    </div>

    {#if coordinatorName}
      <div class="ds-grove-coordinator">
        <span class="ds-grove-coordinator-label">Coordinator:</span>
        <span class="ds-grove-coordinator-name">{coordinatorName}</span>
      </div>
    {/if}

    <div class="ds-grove-footer">
      <button
        class="ds-grove-action"
        class:is-joined={isJoined}
        onclick={handleAction}
        aria-label={isJoined ? 'Leave grove' : 'Join grove'}
      >
        {isJoined ? 'Leave' : 'Join'}
      </button>
    </div>
  </div>
</Card>

<style>
  .ds-grove-card-inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    font-family: var(--font-sans);
  }

  .ds-grove-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .ds-grove-name {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .ds-grove-meta {
    display: flex;
    gap: var(--space-4);
  }

  .ds-grove-stat {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .ds-grove-stat-value {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    font-family: var(--font-mono);
  }

  .ds-grove-stat-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .ds-grove-coordinator {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .ds-grove-coordinator-label {
    color: var(--color-text-muted);
  }

  .ds-grove-coordinator-name {
    color: var(--color-accent);
    font-weight: 500;
  }

  .ds-grove-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--space-2);
    border-top: 1px solid var(--border-subtle);
  }

  .ds-grove-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1) var(--space-4);
    font-size: var(--text-xs);
    font-weight: 600;
    font-family: var(--font-sans);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-accent);
    background: transparent;
    color: var(--color-accent);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .ds-grove-action:hover {
    background: var(--color-accent);
    color: #111;
  }

  .ds-grove-action.is-joined {
    border-color: var(--border-default);
    color: var(--color-text-secondary);
  }

  .ds-grove-action.is-joined:hover {
    border-color: var(--color-error);
    color: var(--color-error);
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
  }
</style>
