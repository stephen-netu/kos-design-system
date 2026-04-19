<script lang="ts">
  import type { ExpertIdentity } from '../../epistemic/types.js';

  interface Props {
    expert: ExpertIdentity;
    size?: 'sm' | 'md';
    showName?: boolean;
    class?: string;
  }

  let {
    expert,
    size = 'md',
    showName = true,
    class: className = '',
  }: Props = $props();

  const EXPERT_ICONS: Record<ExpertIdentity['name'], string> = {
    Atelier: '◈',
    Agora: '◇',
    Ryu: '◆',
    SOVEREIGN: '●',
    Agent: '◎',
  };

  const EXPERT_COLOR_VARS: Record<ExpertIdentity['name'], string> = {
    Atelier: 'var(--expert-atelier)',
    Agora: 'var(--expert-agora)',
    Ryu: 'var(--expert-ryu)',
    SOVEREIGN: 'var(--expert-sovereign)',
    Agent: 'var(--expert-agent)',
  };

  const icon = $derived(EXPERT_ICONS[expert.name] ?? '○');
  const color = $derived(EXPERT_COLOR_VARS[expert.name] ?? 'var(--color-text-secondary)');
  const displayName = $derived(
    expert.name === 'Agent' && expert.agentId
      ? `Agent:${expert.agentId.slice(0, 6)}`
      : expert.name
  );
  const titleText = $derived(`${expert.name} — ${expert.domain}`);
</script>

<span
  class="ds-expert-badge size-{size} {className}"
  style="--badge-color: {color};"
  title={titleText}
  aria-label="Expert: {displayName}"
>
  <span class="icon">{icon}</span>
  {#if showName && size !== 'sm'}
    <span class="name">{displayName}</span>
  {/if}
</span>

<style>
  .ds-expert-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 2px var(--space-2);
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--badge-color) 30%, transparent);
    background: color-mix(in srgb, var(--badge-color) 8%, transparent);
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--badge-color);
    white-space: nowrap;
    cursor: default;
    line-height: 1.4;
  }

  .size-sm {
    padding: 2px;
    border: none;
    background: transparent;
    font-size: var(--text-sm);
  }

  .icon {
    font-size: 0.9em;
    line-height: 1;
  }

  .name {
    font-weight: 500;
    font-size: var(--text-xs);
  }
</style>
