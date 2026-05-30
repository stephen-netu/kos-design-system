// BspTilingSimulation — BSP zone tiling layout Lifecycle class
// Extracts the layout algorithm from BspTilingCanvas.svelte into a
// reusable $state-reactive Lifecycle implementation.

import type { Lifecycle } from '../s0-lifecycle/Lifecycle.js';
import type { ConstraintContext, SizeConstraints } from '../s0-lifecycle/ConstraintContext.js';
import type { LayoutContext } from '../s0-lifecycle/LayoutContext.js';
import type { InteractionContext, EventOutcome } from '../s0-lifecycle/InteractionContext.js';
import type { RenderContext } from '../s0-lifecycle/RenderContext.js';

export interface TilingCardInput {
  id: string;
  minWidth?: number;
  minHeight?: number;
}

export interface ZonePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cardId: string;
}

export interface ZoneDivider {
  orientation: 'vertical' | 'horizontal';
  x: number;
  y: number;
  width: number;
  height: number;
}

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

const DEFAULT_MIN_ZONE_SIZE = 120;
const DIVIDER_THICKNESS = 6;

export class BspTilingSimulation implements Lifecycle {
  // Reactive state — consumers can read this
  positions: ZonePosition[] = $state([]);
  dividers: ZoneDivider[] = $state([]);

  private cards: TilingCardInput[];
  private containerWidth: number;
  private containerHeight: number;
  private minZoneSize: number;

  constructor(
    cards: TilingCardInput[],
    containerWidth: number,
    containerHeight: number,
    minZoneSize?: number
  ) {
    this.cards = cards;
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
    this.minZoneSize = minZoneSize ?? DEFAULT_MIN_ZONE_SIZE;
  }

  constrain(_ctx: ConstraintContext): SizeConstraints {
    const totalMinWidth = this.cards.reduce(
      (sum, c) => sum + (c.minWidth ?? this.minZoneSize),
      0
    );
    const maxCardMinHeight = this.cards.reduce(
      (max, c) => Math.max(max, c.minHeight ?? this.minZoneSize),
      0
    );

    return {
      width: {
        min: Math.max(this.containerWidth, totalMinWidth),
        preferred: this.containerWidth,
        max: Infinity,
      },
      height: {
        min: Math.max(this.containerHeight, maxCardMinHeight),
        preferred: this.containerHeight,
        max: Infinity,
      },
    };
  }

  layout(ctx: LayoutContext): void {
    const bounds = ctx.bounds;
    const root = this.buildBspTree(
      this.cards,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height
    );

    if (root) {
      const flat = this.flattenBsp(root);
      this.positions = flat.map((node) => ({
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        cardId: node.cardId!,
      }));
    } else {
      this.positions = [];
    }
    this.dividers = this.computeDividers(this.positions);
  }

  interact(ctx: InteractionContext): EventOutcome {
    const pos = ctx.event.position;
    if (!pos) return 'propagated';

    for (const zone of this.positions) {
      if (
        pos.x >= zone.x &&
        pos.x <= zone.x + zone.width &&
        pos.y >= zone.y &&
        pos.y <= zone.y + zone.height
      ) {
        return 'consumed';
      }
    }
    return 'propagated';
  }

  render(ctx: RenderContext): void {
    const zoneFillColor = 'var(--color-surface-alpha, rgba(42, 38, 32, 0.6))';
    const dividerColor = 'var(--color-border, #333333)';

    // Draw zone fills
    for (const zone of this.positions) {
      ctx.drawRect(
        { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
        zoneFillColor
      );
    }

    // Draw divider lines between adjacent zones
    for (const d of this.dividers) {
      ctx.drawRect(
        { x: d.x, y: d.y, width: d.width, height: d.height },
        dividerColor
      );
    }
  }

  private computeDividers(positions: ZonePosition[]): ZoneDivider[] {
    const dividers: ZoneDivider[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i];
      const b = positions[i + 1];

      // Check vertical adjacency (a is left of b)
      if (Math.abs(a.x + a.width - b.x) < 3) {
        const yStart = Math.min(a.y, b.y);
        const yEnd = Math.max(a.y + a.height, b.y + b.height);
        dividers.push({
          orientation: 'vertical',
          x: a.x + a.width,
          y: yStart,
          width: DIVIDER_THICKNESS,
          height: yEnd - yStart,
        });
      }

      // Check horizontal adjacency (a is above b)
      if (Math.abs(a.y + a.height - b.y) < 3) {
        const xStart = Math.min(a.x, b.x);
        const xEnd = Math.max(a.x + a.width, b.x + b.width);
        dividers.push({
          orientation: 'horizontal',
          x: xStart,
          y: a.y + a.height,
          width: xEnd - xStart,
          height: DIVIDER_THICKNESS,
        });
      }
    }
    return dividers;
  }

  // ── BSP tree construction ──────────────────────────────────────────────────

  private buildBspTree(
    cards: TilingCardInput[],
    x: number,
    y: number,
    w: number,
    h: number
  ): BspNode | undefined {
    if (cards.length === 0) return undefined;

    // Sort by content area descending (use minWidth*minHeight as proxy)
    const sorted = [...cards].sort((a, b) => {
      const areaA = (a.minWidth ?? this.minZoneSize) * (a.minHeight ?? this.minZoneSize);
      const areaB = (b.minWidth ?? this.minZoneSize) * (b.minHeight ?? this.minZoneSize);
      return areaB - areaA;
    });

    return this.buildNode(sorted, x, y, w, h);
  }

  private buildNode(
    cardList: TilingCardInput[],
    x: number,
    y: number,
    w: number,
    h: number
  ): BspNode | undefined {
    if (cardList.length === 0) return undefined;

    const [first, ...rest] = cardList;

    if (rest.length === 0) {
      return {
        id: `leaf-${first.id}`,
        cardId: first.id,
        x, y,
        width: w,
        height: h,
      };
    }

    const split: 'horizontal' | 'vertical' = w > h ? 'vertical' : 'horizontal';
    const dividerThickness = DIVIDER_THICKNESS;

    // Calculate ratio based on first card's preferred size
    let ratio: number;
    if (split === 'vertical') {
      const idealW = Math.min(
        (first.minWidth ?? this.minZoneSize) + 24,
        w * 0.6
      );
      ratio = idealW / (w - dividerThickness);
    } else {
      const idealH = Math.min(
        (first.minHeight ?? this.minZoneSize) + 24,
        h * 0.6
      );
      ratio = idealH / (h - dividerThickness);
    }

    // Clamp ratio 0.2–0.8
    ratio = Math.max(0.2, Math.min(0.8, ratio));

    let firstRect: { x: number; y: number; w: number; h: number };
    let secondRect: { x: number; y: number; w: number; h: number };

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
      first: this.buildNode([first], firstRect.x, firstRect.y, firstRect.w, firstRect.h),
      second: this.buildNode(rest, secondRect.x, secondRect.y, secondRect.w, secondRect.h),
    };
  }

  private flattenBsp(node: BspNode): BspNode[] {
    if (node.cardId) {
      return [node];
    }
    const results: BspNode[] = [];
    if (node.first) results.push(...this.flattenBsp(node.first));
    if (node.second) results.push(...this.flattenBsp(node.second));
    return results;
  }
}
