<script lang="ts">
  // ZoneTiler — BSP binary space partition zone layout
  // wt-900: Foundational spatial primitive for Loge canvas
  //
  // Renders a recursive BSP tree of zones with draggable dividers.
  // Each zone is a rectangular region that hosts its own content (ForceCanvas, etc.)
  // Keyboard navigation: h/j/k/l to move focus between zones.
  //
  // S-02: No HashMap. Zone lookup via flattenBsp (sorted array).
  // S-05: BSP depth bounded (max 8 levels). No unbounded recursion.

  import type { Snippet } from 'svelte';
  import type {
    BspNode,
    ZoneRect,
    DividerRect,
    ZoneTilerConfig,
    ZoneLeaf,
    SplitDirection,
  } from './zone-tiler-types.js';
  import { flattenBsp } from './zone-tiler-types.js';

  // ── Props ────────────────────────────────────────────────────────────────

  interface Props {
    /** BSP tree defining the zone layout */
    tree: BspNode;
    /** Container width in px */
    width: number;
    /** Container height in px */
    height: number;
    /** Render callback for each zone — receives zone rect */
    zoneContent: Snippet<[ZoneRect]>;
    /** Configuration overrides */
    config?: ZoneTilerConfig;
    /** Currently focused zone id */
    focusedZoneId?: string;
    /** Fired when a divider is dragged and ratio changes */
    onResize?: (tree: BspNode) => void;
    /** Fired when focused zone changes (keyboard nav or click) */
    onFocusChange?: (zoneId: string) => void;
    /** Fired when user requests a zone split (Ctrl+Shift+H/V) */
    onSplitRequest?: (zoneId: string, direction: SplitDirection) => void;
  }

  let {
    tree,
    width,
    height,
    zoneContent,
    config,
    focusedZoneId = $bindable(''),
    onResize,
    onFocusChange,
    onSplitRequest,
  }: Props = $props();

  // ── Config defaults ──────────────────────────────────────────────────────

  const minZoneSize = $derived(config?.minZoneSize ?? 120);
  const dividerThickness = $derived(config?.dividerThickness ?? 6);
  const dividerHitExpand = $derived(config?.dividerHitExpand ?? 4);

  // ── Computed layout ──────────────────────────────────────────────────────

  const layout = $derived(flattenBsp(tree, 0, 0, width, height, dividerThickness));
  const zones = $derived(layout.zones);
  const dividers = $derived(layout.dividers);

  // ── Divider drag state ───────────────────────────────────────────────────

  let activeDivider: DividerRect | null = $state(null);
  let dragStartPos = $state(0);
  let dragStartRatio = $state(0);

  function handleDividerDown(e: PointerEvent, divider: DividerRect) {
    e.preventDefault();
    e.stopPropagation();
    activeDivider = divider;
    dragStartPos = divider.direction === 'horizontal' ? e.clientX : e.clientY;
    dragStartRatio = divider.splitRef.ratio;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleDividerMove(e: PointerEvent) {
    if (!activeDivider) return;

    const { direction, splitRef } = activeDivider;
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - dragStartPos;
    const parentSize = direction === 'horizontal' ? width : height;
    const availableSize = parentSize - dividerThickness;

    if (availableSize <= 0) return;

    const ratioShift = delta / availableSize;
    let newRatio = dragStartRatio + ratioShift;

    // Clamp: ensure both children meet minimum size
    const minRatio = minZoneSize / availableSize;
    const maxRatio = 1 - minRatio;
    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));

    splitRef.ratio = newRatio;
    onResize?.(tree);
  }

  function handleDividerUp() {
    activeDivider = null;
  }

  // ── Zone focus + keyboard navigation ─────────────────────────────────────

  function handleZoneClick(zoneId: string) {
    focusedZoneId = zoneId;
    onFocusChange?.(zoneId);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!focusedZoneId || zones.length < 2) return;

    const focused = zones.find((z) => z.id === focusedZoneId);
    if (!focused) return;

    // hjkl navigation — find nearest zone in direction
    let dx = 0;
    let dy = 0;
    switch (e.key) {
      case 'h': dx = -1; break;
      case 'l': dx = 1; break;
      case 'k': dy = -1; break;
      case 'j': dy = 1; break;
      default: break;
    }

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      const target = findNearestZone(focused, dx, dy);
      if (target) {
        focusedZoneId = target.id;
        onFocusChange?.(target.id);
      }
      return;
    }

    // Ctrl+Shift+H/V: split request
    if (e.ctrlKey && e.shiftKey) {
      if (e.key === 'H' || e.key === 'h') {
        e.preventDefault();
        onSplitRequest?.(focusedZoneId, 'horizontal');
      } else if (e.key === 'V' || e.key === 'v') {
        e.preventDefault();
        onSplitRequest?.(focusedZoneId, 'vertical');
      }
    }
  }

  function findNearestZone(from: ZoneRect, dx: number, dy: number): ZoneRect | null {
    const cx = from.x + from.width / 2;
    const cy = from.y + from.height / 2;

    let best: ZoneRect | null = null;
    let bestDist = Infinity;

    for (const zone of zones) {
      if (zone.id === from.id) continue;

      const zx = zone.x + zone.width / 2;
      const zy = zone.y + zone.height / 2;
      const relX = zx - cx;
      const relY = zy - cy;

      // Filter: must be in the requested direction
      if (dx < 0 && relX >= 0) continue;
      if (dx > 0 && relX <= 0) continue;
      if (dy < 0 && relY >= 0) continue;
      if (dy > 0 && relY <= 0) continue;

      const dist = Math.abs(relX) + Math.abs(relY);
      if (dist < bestDist) {
        bestDist = dist;
        best = zone;
      }
    }

    return best;
  }

  // ── Focus on first zone if none set ──────────────────────────────────────

  $effect(() => {
    if (!focusedZoneId && zones.length > 0) {
      focusedZoneId = zones[0].id;
    }
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="zone-tiler"
  style:width="{width}px"
  style:height="{height}px"
  onkeydown={handleKeydown}
  tabindex="0"
  role="application"
  aria-label="Zone tiler — use h/j/k/l to navigate zones"
>
  <!-- Zone panes -->
  {#each zones as zone (zone.id)}
    <button
      type="button"
      class="zone-pane"
      class:zone-focused={zone.id === focusedZoneId}
      class:zone-scelle={zone.zone.privacyState === 'scelle'}
      style:left="{zone.x}px"
      style:top="{zone.y}px"
      style:width="{zone.width}px"
      style:height="{zone.height}px"
      onclick={() => handleZoneClick(zone.id)}
      data-zone-id={zone.id}
    >
      {@render zoneContent(zone)}
    </button>
  {/each}

  <!-- Dividers (rendered on top of zones) -->
  {#each dividers as divider (divider.path)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="zone-divider"
      class:zone-divider-h={divider.direction === 'horizontal'}
      class:zone-divider-v={divider.direction === 'vertical'}
      class:zone-divider-active={activeDivider?.path === divider.path}
      style:left="{divider.x - dividerHitExpand}px"
      style:top="{divider.y - dividerHitExpand}px"
      style:width="{divider.width + (divider.direction === 'horizontal' ? dividerHitExpand * 2 : 0)}px"
      style:height="{divider.height + (divider.direction === 'vertical' ? dividerHitExpand * 2 : 0)}px"
      onpointerdown={(e) => handleDividerDown(e, divider)}
      onpointermove={handleDividerMove}
      onpointerup={handleDividerUp}
      onpointercancel={handleDividerUp}
    >
      <div class="zone-divider-visual"
        style:left="{divider.direction === 'horizontal' ? dividerHitExpand + 'px' : '0'}"
        style:top="{divider.direction === 'vertical' ? dividerHitExpand + 'px' : '0'}"
        style:width="{divider.direction === 'horizontal' ? dividerThickness + 'px' : '100%'}"
        style:height="{divider.direction === 'vertical' ? dividerThickness + 'px' : '100%'}"
      ></div>
    </div>
  {/each}
</div>

<style>
  .zone-tiler {
    position: relative;
    overflow: hidden;
    outline: none;
    background: var(--color-bg-app, #1a1a1a);
  }

  .zone-pane {
    position: absolute;
    overflow: hidden;
    border-radius: var(--radius-xs, 2px);
    transition: box-shadow 0.15s ease;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: inherit;
  }

  .zone-focused {
    box-shadow: inset 0 0 0 1.5px var(--color-accent, #b87333);
  }

  .zone-scelle {
    /* Scelle zone base treatment — components inside add hazard symbology */
    background: #1c1a1a;
  }

  /* ── Dividers ─────────────────────────────────────────────────────── */

  .zone-divider {
    position: absolute;
    z-index: 10;
    touch-action: none;
  }

  .zone-divider-h {
    cursor: col-resize;
  }

  .zone-divider-v {
    cursor: row-resize;
  }

  .zone-divider-visual {
    position: absolute;
    background: var(--color-border, #333);
    border-radius: var(--radius-xs, 1px);
    transition: background 0.12s ease;
  }

  .zone-divider:hover .zone-divider-visual,
  .zone-divider-active .zone-divider-visual {
    background: var(--color-accent, #b87333);
  }
</style>
