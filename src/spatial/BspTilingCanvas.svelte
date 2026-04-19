<script lang="ts">
  // BspTilingCanvas — Amethyst/i3-style tiling with content-adaptive cards
  // Cards size to their own content, snap together via BSP tree
  
  import type { BlockMetrics } from '../x0-enchanted-blocks/core/block-layout.js';
  
  interface TilingCard {
    id: string;
    metrics: BlockMetrics;
    minWidth?: number;
    minHeight?: number;
  }
  
  interface Position {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  interface Props {
    cards: TilingCard[];
    containerWidth: number;
    containerHeight: number;
    children: import('svelte').Snippet<[Position]>;  
  }
  
  let { 
    cards, 
    containerWidth, 
    containerHeight,
    children 
  }: Props = $props();
  
  // ── BSP Layout Engine ──────────────────────────────────────────────────────
  
  interface BspNode {
    id: string;
    cardId?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    split?: 'horizontal' | 'vertical';
    ratio?: number;
    first?: BspNode;
    second?: BspNode;
  }
  
  /** Build BSP tree that fits cards like Amethyst/i3 tiling WM */
  function buildBspLayout(
    cards: TilingCard[],
    containerW: number,
    containerH: number
  ): BspNode[] {
    if (cards.length === 0) return [];
    
    // Sort cards by content area (largest first for better packing)
    const sorted = [...cards].sort((a, b) => {
      const areaA = a.metrics.idealWidth * a.metrics.height;
      const areaB = b.metrics.idealWidth * b.metrics.height;
      return areaB - areaA;
    });
    
    // Build BSP tree recursively
    function buildNode(
      cardList: TilingCard[],
      x: number,
      y: number,
      w: number,
      h: number
    ): BspNode | undefined {
      if (cardList.length === 0) return undefined;
      
      const [first, ...rest] = cardList;
      
      if (rest.length === 0) {
        // Leaf node - single card fills remaining space
        return {
          id: `leaf-${first.id}`,
          cardId: first.id,
          x, y,
          width: w,
          height: h,
        };
      }
      
      // Internal node - split space
      const split = w > h ? 'vertical' : 'horizontal';
      const dividerThickness = 6;
      
      // Calculate ratio based on first card's preferred size vs remaining space
      let ratio: number;
      if (split === 'vertical') {
        const idealW = Math.min(first.metrics.idealWidth + 24, w * 0.6);
        ratio = idealW / (w - dividerThickness);
      } else {
        const idealH = Math.min(first.metrics.height + 24, h * 0.6);
        ratio = idealH / (h - dividerThickness);
      }
      
      // Clamp ratio
      ratio = Math.max(0.2, Math.min(0.8, ratio));
      
      let firstRect, secondRect;
      if (split === 'vertical') {
        const splitX = x + (w - dividerThickness) * ratio;
        firstRect = { x, y, w: splitX - x, h };
        secondRect = { x: splitX + dividerThickness, y, w: x + w - splitX - dividerThickness, h };
      } else {
        const splitY = y + (h - dividerThickness) * ratio;
        firstRect = { x, y, w, h: splitY - y };
        secondRect = { x, y: splitY + dividerThickness, w, h: y + h - splitY - dividerThickness };
      }
      
      return {
        id: `split-${first.id}`,
        x, y, width: w, height: h,
        split, ratio,
        first: buildNode([first], firstRect.x, firstRect.y, firstRect.w, firstRect.h),
        second: buildNode(rest, secondRect.x, secondRect.y, secondRect.w, secondRect.h),
      };
    }
    
    const root = buildNode(sorted, 0, 0, containerW, containerH);
    return root ? flattenBsp(root) : [];
  }
  
  /** Flatten BSP tree to card positions */
  function flattenBsp(node: BspNode): BspNode[] {
    if (node.cardId) {
      return [node];
    }
    const results: BspNode[] = [];
    if (node.first) results.push(...flattenBsp(node.first));
    if (node.second) results.push(...flattenBsp(node.second));
    return results;
  }
  
  // ── Derived Layout ──────────────────────────────────────────────────────────
  const layout = $derived(buildBspLayout(cards, containerWidth, containerHeight));
  
  function getPosition(id: string) {
    const node = layout.find(n => n.cardId === id);
    if (!node) return { x: 0, y: 0, width: 200, height: 100 };
    return { x: node.x, y: node.y, width: node.width, height: node.height };
  }
</script>

<div class="bsp-tiling-canvas" style:width="{containerWidth}px" style:height="{containerHeight}px">
  {#each cards as card (card.id)}
    {@const pos = getPosition(card.id)}
    <div
      class="tiling-slot"
      style:left="{pos.x}px"
      style:top="{pos.y}px"
      style:width="{pos.width}px"
      style:height="{pos.height}px"
    >
      {@render children({ id: card.id, ...pos })}
    </div>
  {/each}
  
  <!-- Divider lines (visual only) -->
  {#each layout as node, i}
    {#if i < layout.length - 1}
      {@const next = layout[i + 1]}
      {#if Math.abs(node.x + node.width - next.x) < 3}
        <!-- Vertical divider -->
        <div
          class="divider vertical"
          style:left="{node.x + node.width}px"
          style:top="{Math.min(node.y, next.y)}px"
          style:height="{Math.max(node.y + node.height, next.y + next.height) - Math.min(node.y, next.y)}px"
        ></div>
      {:else if Math.abs(node.y + node.height - next.y) < 3}
        <!-- Horizontal divider -->
        <div
          class="divider horizontal"
          style:left="{Math.min(node.x, next.x)}px"
          style:top="{node.y + node.height}px"
          style:width="{Math.max(node.x + node.width, next.x + next.width) - Math.min(node.x, next.x)}px"
        ></div>
      {/if}
    {/if}
  {/each}
</div>

<style>
  .bsp-tiling-canvas {
    position: relative;
    overflow: hidden;
  }
  
  .tiling-slot {
    position: absolute;
    overflow: auto;
    /* Subtle border for card separation */
    box-shadow: inset 0 0 0 1px var(--color-border, #333);
  }
  
  .tiling-slot::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  .tiling-slot::-webkit-scrollbar-thumb {
    background: var(--color-text-muted, #706858);
    border-radius: 2px;
  }
  
  .divider {
    position: absolute;
    background: var(--color-border, #333);
    z-index: 10;
  }
  
  .divider.vertical {
    width: 6px;
    cursor: col-resize;
  }
  
  .divider.horizontal {
    height: 6px;
    cursor: row-resize;
  }
  
  .divider:hover {
    background: var(--color-accent, #b87333);
  }
</style>
