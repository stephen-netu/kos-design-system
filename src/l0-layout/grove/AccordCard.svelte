<script lang="ts">
  import Card from '../../u0-primitives/card/Card.svelte';
  import Badge from '../../u0-primitives/badge/Badge.svelte';

  interface Props {
    accordId: string;
    domains: string[];
    participantCount: number;
    expiresAt: number;
    groveId?: string;
    class?: string;
  }

  let {
    accordId,
    domains,
    participantCount,
    expiresAt,
    groveId,
    class: className = ''
  }: Props = $props();

  let now = $state(Date.now());

  $effect(() => {
    const id = setInterval(() => { now = Date.now(); }, 60_000);
    return () => clearInterval(id);
  });

  let timeRemaining = $derived.by(() => {
    const diff = expiresAt - now;
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  });

  let isExpired = $derived(expiresAt <= now);
  let isExpiringSoon = $derived(!isExpired && (expiresAt - now) < 1000 * 60 * 60 * 24);
</script>

<Card variant="elevated" class="ds-accord-card {className}">
  <div class="ds-accord-inner">
    <div class="ds-accord-header">
      <h3 class="ds-accord-name" title={accordId}>{accordId}</h3>
      {#if groveId}
        <span class="ds-accord-grove" title="Linked grove: {groveId}">{groveId}</span>
      {/if}
    </div>

    <div class="ds-accord-domains">
      {#each domains as domain}
        <Badge variant="outline" color="accent" size="sm">{domain}</Badge>
      {/each}
    </div>

    <div class="ds-accord-footer">
      <span class="ds-accord-stat">
        <span class="ds-accord-stat-value">{participantCount}</span>
        <span class="ds-accord-stat-label">{participantCount === 1 ? 'realm' : 'realms'}</span>
      </span>

      <span
        class="ds-accord-expiry"
        class:is-expired={isExpired}
        class:is-expiring-soon={isExpiringSoon}
        title="Expires: {new Date(expiresAt).toLocaleString()}"
      >
        {timeRemaining}
      </span>
    </div>
  </div>
</Card>

<style>
  .ds-accord-inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    font-family: var(--font-sans);
  }

  .ds-accord-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .ds-accord-name {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .ds-accord-grove {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    flex-shrink: 0;
  }

  .ds-accord-domains {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .ds-accord-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-2);
    border-top: 1px solid var(--border-subtle);
  }

  .ds-accord-stat {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .ds-accord-stat-value {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    font-family: var(--font-mono);
  }

  .ds-accord-stat-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .ds-accord-expiry {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
  }

  .ds-accord-expiry.is-expiring-soon {
    color: var(--color-warning);
  }

  .ds-accord-expiry.is-expired {
    color: var(--color-error);
  }
</style>
