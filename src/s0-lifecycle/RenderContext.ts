// S0 Lifecycle — Render Context
// Provides drawing primitives during the render phase.

import type { Rect, Point, Size } from '../p0-primitives/types/geometry';

export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface ClipRegion {
  /** Bounding rectangle for clipping */
  bounds: Rect;
  /** Clip mode */
  mode: 'intersect' | 'replace' | 'none';
}

export interface DrawCommand {
  type: 'rect' | 'text' | 'image' | 'clip' | 'custom';
  zindex?: number;
  clip?: ClipRegion;
  [key: string]: unknown;
}

/**
 * RenderContext is provided during the paint phase.
 * Components issue draw commands to the scene graph.
 */
export interface RenderContext {
  /** Draw a filled rectangle */
  drawRect(rect: Rect, color: string): void;

  /** Draw text at a position with a style */
  drawText(position: Point, text: string, style: TextStyle): void;

  /** Draw an image within bounds */
  drawImage(src: string, bounds: Rect): void;

  /** Push a clip region for subsequent draws */
  pushClip(clip: ClipRegion): void;

  /** Pop the most recent clip region */
  popClip(): void;

  /** Current viewport size */
  readonly viewportSize: Size;

  /** Current scale factor */
  readonly scale: number;

  /** Maximum texture dimension (for GPU-bound contexts) */
  readonly maxTextureDimension: number | null;
}
