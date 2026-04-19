<script lang="ts">
  import type { MemberInfo } from './grove-types';
  import MemberBadge from './MemberBadge.svelte';

  interface Props {
    members: MemberInfo[];
    maxVisible?: number;
    class?: string;
  }

  let {
    members,
    maxVisible = 5,
    class: className = ''
  }: Props = $props();

  let visibleMembers = $derived(members.slice(0, maxVisible));
  let overflowCount = $derived(Math.max(0, members.length - maxVisible));
</script>

<div class="ds-member-list {className}" role="list" aria-label="Grove members">
  {#each visibleMembers as member (member.realmId)}
    <div class="ds-member-list-item" role="listitem">
      <MemberBadge
        name={member.name}
        trustState={member.trustState}
        isCoordinator={member.isCoordinator}
        size="sm"
      />
    </div>
  {/each}

  {#if overflowCount > 0}
    <span class="ds-member-overflow" title="{overflowCount} more members">
      +{overflowCount} more
    </span>
  {/if}
</div>

<style>
  .ds-member-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-family: var(--font-sans);
  }

  .ds-member-list-item {
    display: flex;
    align-items: center;
  }

  .ds-member-overflow {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    padding-left: calc(0.375rem + var(--space-1));
    cursor: default;
  }
</style>
