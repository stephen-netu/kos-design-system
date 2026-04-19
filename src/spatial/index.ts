// Spatial primitives — BSP zone tiling, force-directed layout, LOD rendering, snap-zoom camera
// Consumed by Loge first; available to Atelier and future apps.

export * from './zone-tiler-types.js';
export * from './force-canvas-types.js';
export * from './lod-types.js';
export * from './camera-types.js';
export * from './content-proportional-bsp.js';

// Components are imported directly:
//   import ZoneTiler from '@kos/design-system/spatial/ZoneTiler.svelte';
//   import ForceCanvas from '@kos/design-system/spatial/ForceCanvas.svelte';
//   import LodRenderer from '@kos/design-system/spatial/LodRenderer.svelte';
//   import SnapZoomCamera from '@kos/design-system/spatial/SnapZoomCamera.svelte';
//   import BspTilingCanvas from '@kos/design-system/spatial/BspTilingCanvas.svelte';
