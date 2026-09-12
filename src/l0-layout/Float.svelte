<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ElementState } from './state-map.svelte';
  import { useLayout } from './useLayout';
  import { computePosition, offset, flip, shift } from '@floating-ui/dom';

  /**
   * Placement of the float relative to its anchor.
   *
   * `top` and `bottom` are centered on the anchor. The `-start` / `-end`
   * variants align the float with the start or end edge of the anchor along
   * the placement axis. `left` and `right` are centered vertically.
   */
  export type FloatPlacement =
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end';

  /**
   * Transition configuration for the float. The float applies a single CSS
   * `transition` declaration on the element; `enter` runs when the float
   * becomes visible, `leave` runs when it hides.
   */
  export interface TransitionConfig {
    enter?: { duration: number; easing: (t: number) => number };
    leave?: { duration: number; easing: (t: number) => number };
  }

  interface Props {
    /**
     * Stable anchor id. The float reads the anchors box reactively through
     * `useLayout`. If the id has never been seen the float stays hidden and
     * renders no throw.
     */
    attachTo: string;
    /** Placement of the float relative to the anchor. Defaults to `bottom`. */
    placement?: FloatPlacement;
    /** Distance between the anchor and the float, in CSS pixels. */
    offset?: number;
    /** z-index applied to the float. Defaults to 200. */
    zIndex?: number;
    /** Two-way bindable open state. Defaults to `true`. */
    open?: boolean;
    /** Declarative enter/leave transition configuration. */
    transition?: TransitionConfig;
    /** Snippet rendered inside the float. Receives the anchors `ElementState`. */
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

  // Layout is reactive and never null in the browser. On the server it returns
  // a frozen stub with a zero box, which keeps the float hidden and never throws.
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

<div
  bind:this={floatNode}
  class="float"
  class:is-hidden={isHidden}
  style:--float-x="{x}px"
  style:--float-y="{y}px"
  style:--float-z={zIndex}
  style:transition={transitionStyle}
>
  {@render children?.(layout as ElementState)}
</div>