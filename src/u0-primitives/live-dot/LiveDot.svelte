<script lang="ts">
  export interface Props {
    variant?: 'cleared' | 'blocked' | 'pending' | 'degraded';
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
    class?: string;
    'aria-label'?: string;
  }

  let {
    variant = 'cleared',
    size = 'md',
    pulse = true,
    class: className = '',
    'aria-label': ariaLabel
  }: Props = $props();
</script>

<span
  class="ds-live-dot variant-{variant} size-{size} {className}"
  class:is-pulsing={pulse}
  role="status"
  aria-label={ariaLabel ?? variant}
></span>

<style>
  .ds-live-dot {
    display: inline-block;
    flex-shrink: 0;
    border-radius: var(--radius-full);
  }

  .size-sm { width: 0.375rem; height: 0.375rem; }
  .size-md { width: 0.5rem; height: 0.5rem; }
  .size-lg { width: 0.625rem; height: 0.625rem; }

  .variant-cleared { background: var(--epistemic-cleared); }
  .variant-blocked { background: var(--epistemic-blocked); }
  .variant-pending { background: var(--epistemic-pending); }
  .variant-degraded { background: var(--epistemic-degraded); }

  .is-pulsing.variant-cleared { animation: ds-live-dot-pulse 2s ease-out infinite; --pulse-glow: var(--epistemic-cleared-glow); }
  .is-pulsing.variant-blocked { animation: ds-live-dot-pulse 2s ease-out infinite; --pulse-glow: var(--epistemic-blocked-glow); }
  .is-pulsing.variant-pending { animation: ds-live-dot-pulse 2s ease-out infinite; --pulse-glow: var(--epistemic-pending-glow); }
  .is-pulsing.variant-degraded { animation: ds-live-dot-pulse 2s ease-out infinite; --pulse-glow: var(--epistemic-degraded-glow); }

  @keyframes ds-live-dot-pulse {
    0% { box-shadow: 0 0 0 0 var(--pulse-glow); }
    70% { box-shadow: 0 0 0 6px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  @media (prefers-reduced-motion: reduce) {
    .is-pulsing { animation: none; }
  }
</style>
