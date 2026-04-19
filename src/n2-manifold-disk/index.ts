// N2 Manifold Disk — Poincaré disk projection wrapping n1-flow-canvas
// κ = 1.0 fixed (standard Poincaré disk, no prop)

export { default as ManifoldDisk } from './ManifoldDisk.svelte';
export { mobiusTransform, projectToDisk, poincareDistance, quaternionToDisk } from './poincare.js';
export type { GraphStateApi, GraphSnapshot } from '../n1-flow-canvas/types.js';
