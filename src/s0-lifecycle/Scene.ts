// S0 Lifecycle — Scene Graph Types
// Hierarchical composition structure for rendered output.

import type { Rect } from '../p0-primitives/types/geometry';
import type { DrawCommand } from './RenderContext';

/**
 * Z-ordering for scene layers.
 * Higher values render on top of lower values.
 */
export type ZIndex = number;

/**
 * Clip bounds for a scene layer.
 * Controls visibility boundary for child content.
 */
export type ClipBounds =
  | { type: 'none' }
  | { type: 'active-layer' }
  | { type: 'bounded'; bounds: Rect }
  | { type: 'intersected'; bounds: Rect };

/**
 * A renderable layer in the scene graph.
 * Contains draw commands and optional clipping.
 */
export interface SceneLayer {
  /** Z-order for this layer */
  zindex: ZIndex;
  /** Clip bounds for this layer */
  clip: ClipBounds;
  /** Ordered draw commands within this layer */
  commands: DrawCommand[];
  /** Whether pointer events pass through this layer */
  clickThrough: boolean;
}

/**
 * Scene graph — the accumulated output of a render pass.
 * Components paint into the scene during the render phase.
 * The scene is then consumed by the platform renderer.
 */
export class Scene {
  private layers: SceneLayer[] = [];
  private overlayLayers: SceneLayer[] = [];
  private activeZIndex: ZIndex = 0;

  constructor(
    private scale: number = 1,
  ) {}

  /** Push a new layer with optional clip bounds */
  pushLayer(clip: ClipBounds = { type: 'none' }, zindex?: ZIndex): this {
    const zi = zindex ?? this.activeZIndex;
    this.layers.push({
      zindex: zi,
      clip,
      commands: [],
      clickThrough: false,
    });
    return this;
  }

  /** Pop the current layer */
  popLayer(): this {
    // Layers are finalized when popped
    return this;
  }

  /** Add a draw command to the active layer */
  addCommand(command: DrawCommand): this {
    const layer = this.layers[this.layers.length - 1];
    if (layer) {
      layer.commands.push(command);
    }
    return this;
  }

  /** Push an overlay layer (renders above all content layers) */
  pushOverlay(clip: ClipBounds = { type: 'none' }): this {
    this.overlayLayers.push({
      zindex: 9999,
      clip,
      commands: [],
      clickThrough: false,
    });
    return this;
  }

  /** Get all layers in z-order */
  get allLayers(): SceneLayer[] {
    return [...this.layers, ...this.overlayLayers].sort(
      (a, b) => a.zindex - b.zindex
    );
  }

  /** Get the current scale factor */
  get scaleFactor(): number {
    return this.scale;
  }
}
