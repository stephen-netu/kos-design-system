// P0 Primitives — Geometry types
// Foundation types for spatial reasoning across all design system layers.
// These are the canonical definitions — other layers should import from here.

/** 2D point in pixel coordinates */
export interface Point {
  x: number;
  y: number;
}

/** 2D size in pixels */
export interface Size {
  width: number;
  height: number;
}

/** Axis-aligned rectangle in pixel coordinates */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
