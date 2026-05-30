// N0 Node Graph — Port interaction types
// Extracted from NodePort.svelte so tsc can resolve them without Svelte type declarations.

import type { PortDirection } from './types';

export interface PortDragDetail {
  nodeId: string;
  portId: string;
  direction: PortDirection;
  type: string;
  position: { x: number; y: number };
}

export interface PortDropDetail {
  nodeId: string;
  portId: string;
  direction: PortDirection;
  type: string;
}
