// S0 Lifecycle — Layout Context
// Provides bounds and position information after constraint resolution.

import type { Rect, Size } from '../p0-primitives/types/geometry';

export type { Rect, Size } from '../p0-primitives/types/geometry';

/**
 * LayoutContext is provided after the constraint phase resolves.
 * Components learn their final bounds and can request repaints.
 */
export interface LayoutContext {
  /** The resolved bounds for this component */
  readonly bounds: Rect;

  /** Request a repaint of this component (marks dirty) */
  requestRepaint(): void;

  /** Request a repaint after a specific delay (for animations) */
  requestRepaintAt(delayMs: number): void;

  /** Get the bounds of a child by key */
  childBounds(key: string): Rect | undefined;

  /** Window/viewport size */
  readonly viewportSize: Size;
}
