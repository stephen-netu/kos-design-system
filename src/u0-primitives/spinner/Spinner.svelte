<script lang="ts">
  export interface Props {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'accent' | 'muted' | 'white';
    class?: string;
  }

  let {
    size = 'md',
    color = 'accent',
    class: className = ''
  }: Props = $props();
</script>

<div class="ds-spinner-wrapper size-{size} color-{color} {className}" role="status" aria-label="Loading">
  <div class="ds-spinner-ring"></div>
</div>

<style>
  .ds-spinner-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* Mechanical ring — linear, no spring, no glow, no particles.
     Identity comes from the accent edge alone. */
  .ds-spinner-ring {
    position: absolute;
    inset: 0;
    border: 2px solid var(--border-default);
    border-top-color: currentColor;
    border-right-color: currentColor;
    animation: ds-spin 0.7s linear infinite;
  }

  @keyframes ds-spin {
    to { transform: rotate(360deg); }
  }

  /* --- Sizes --- */
  .size-sm { width: 1.25rem; height: 1.25rem; }
  .size-md { width: 2rem; height: 2rem; }
  .size-lg { width: 3rem; height: 3rem; }
  .size-lg .ds-spinner-ring { border-width: 3px; }
  .size-xl { width: 4.5rem; height: 4.5rem; }
  .size-xl .ds-spinner-ring { border-width: 4px; }

  /* Colors — no glow/drop-shadow; depth from the 2-tone border only */
  .color-accent { color: var(--color-accent); }
  .color-muted  { color: var(--color-text-muted); }
  .color-white  { color: var(--color-text-primary); }

  /* Reduced motion — slow the ring to a near-stop */
  @media (prefers-reduced-motion: reduce) {
    .ds-spinner-ring {
      animation: ds-spin 3s linear infinite;
    }
  }
</style>
