<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Layout } from './types';
  import { layoutToStyle } from './layout-to-style';

  interface Props {
    id: string;
    layout?: Layout;
    children?: Snippet;
  }

  let { id, layout, children }: Props = $props();

  const DEFAULT_LAYOUT: Layout = {
    direction: 'row',
    gap: 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    align: 'start',
    childAlignment: 'start',
    sizing: 'fit',
  };

  const style = $derived(layoutToStyle(layout ?? DEFAULT_LAYOUT));
</script>

<div {id} data-layout-id={id} {style}>
  {@render children?.()}
</div>
