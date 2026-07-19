<script lang="ts">
  import Card from '../../u0-primitives/card/Card.svelte';
  import type { Snippet } from 'svelte';

  export interface Props {
    class?: string;
    children?: Snippet;
  }

  let {
    class: className = '',
    children
  }: Props = $props();
</script>

<div class="ds-stacked-card {className}">
  <div class="ds-stacked-card-sheet sheet-back-2" aria-hidden="true"></div>
  <div class="ds-stacked-card-sheet sheet-back-1" aria-hidden="true"></div>
  <div class="ds-stacked-card-sheet sheet-front">
    <Card variant="elevated">
      {#if children}
        {@render children()}
      {/if}
    </Card>
  </div>
</div>

<style>
  .ds-stacked-card {
    position: relative;
    /* The rotated back sheets are calibrated for a compact card, not a
       full-bleed block — at very wide containers the rotation angle
       translates to a large vertical skew. Cap width by default; override
       via the class prop if a different size is genuinely wanted. */
    max-width: 30rem;
  }

  .ds-stacked-card-sheet {
    border: var(--border-width-thin) solid var(--border-default);
  }

  .sheet-back-1,
  .sheet-back-2 {
    position: absolute;
    inset: 0;
    z-index: 0;
    transition: transform var(--transition-normal);
  }

  .sheet-back-1 {
    background: var(--color-accent-subtle);
    border-color: var(--color-accent-muted);
    transform: rotate(-2deg) translate(10px, 12px);
  }

  .sheet-back-2 {
    background: var(--overlay-white-04);
    transform: rotate(2deg) translate(-8px, 10px);
  }

  .sheet-front {
    position: relative;
    z-index: 1;
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  }

  .ds-stacked-card:hover .sheet-back-1 {
    transform: rotate(-3deg) translate(14px, 16px);
  }

  .ds-stacked-card:hover .sheet-back-2 {
    transform: rotate(3deg) translate(-11px, 14px);
  }

  .ds-stacked-card:hover .sheet-front {
    transform: translateY(-3px);
  }

  @media (prefers-reduced-motion: reduce) {
    .sheet-back-1,
    .sheet-back-2,
    .sheet-front {
      transition: none;
    }
  }
</style>
