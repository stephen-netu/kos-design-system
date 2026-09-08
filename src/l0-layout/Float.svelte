<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ElementState } from './state-map.svelte';
  import { useLayout } from './useLayout';
  import { computePosition, offset, flip, shift, type Placement } from '@floating-ui/dom';

  export interface TransitionConfig {
    enter?: { duration: number; easing: (t: number) => number };
    leave?: { duration: number; easing: (t: number) => number };
  }

  interface Props {
    attachTo: string;
    placement?: Placement;
    offset?: number;
    zIndex?: number;
    open?: boolean;
    transition?: TransitionConfig;
    children?: Snippet<[ElementState]>;
  }

  let {
    attachTo,
    placement = 'bottom',
    offset: offsetDistance = 0,
    zIndex = 200,
    open = $bindable(true),
    transition: transitionConfig,
    children,
  }: Props = $props();

  const layout = useLayout(attachTo);

  let everSeen = $state(false);
  let mounted = $state(false);
  let floatNode: HTMLDivElement | undefined = $state();

  let x = $state(0);
  let y = $state(0);

  const isHidden = $derived(!everSeen || !open);

  function cssEasing(fn: (t: number) => number): string {
    const steps = 4;
    const values: number[] = [];
    for (let i = 0; i <= steps; i++) {
      values.push(fn(i / steps));
    }
    return `cubic-bezier(${values[0].toFixed(3)}, ${values[1].toFixed(3)}, ${values[2].toFixed(3)}, ${values[3].toFixed(3)})`;
  }

  const transitionStyle = $derived.by(() => {
    const cfg = mounted ? transitionConfig?.enter : transitionConfig?.leave;
    if (!cfg) return '';
    const easing = cssEasing(cfg.easing);
    return `opacity ${cfg.duration}ms ${easing}, transform ${cfg.duration}ms ${easing}`;
  });

  async function updatePosition() {
    if (!floatNode) return;
    const box = layout.box;
    if (box.width === 0 && box.height === 0) return;

    const virtualReference = {
      getBoundingClientRect() {
        return new DOMRect(box.x, box.y, box.width, box.height);
      },
    };

    const { x: nx, y: ny } = await computePosition(virtualReference, floatNode, {
      strategy: 'fixed',
      placement,
      middleware: [offset(offsetDistance), flip(), shift({ padding: 5 })],
    });

    x = nx;
    y = ny;
  }

  $effect(() => {
    const box = layout.box;
    if (box.width > 0 || box.height > 0) {
      everSeen = true;
    }
    if (everSeen) {
      void updatePosition();
    }
  });

  $effect(() => {
    if (open && everSeen) {
      mounted = true;
    } else {
      mounted = false;
    }
  });
</script>

{#if everSeen}
  <div
    bind:this={floatNode}
    class="float"
    class:is-hidden={isHidden}
    style:--float-x="{x}px"
    style:--float-y="{y}px"
    style:--float-z={zIndex}
    style:transition={transitionStyle}
  >
    {@render children?.(layout)}
  </div>
{/if}
