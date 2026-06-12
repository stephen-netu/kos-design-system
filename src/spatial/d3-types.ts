import type { ForceCell, ForceLink } from './force-canvas-types';

export interface D3SimulationNode {
  id: string;
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface D3ForceLink<T extends D3SimulationNode = D3SimulationNode> {
  source: T | string;
  target: T | string;
  distance?: number;
}

export interface D3Simulation<T extends D3SimulationNode = D3SimulationNode> {
  force(name: string): unknown;
  force(name: string, force: unknown): this;
  nodes(): T[];
  nodes(nodes: T[]): this;
  alphaDecay(): number;
  alphaDecay(decay: number): this;
  velocityDecay(): number;
  velocityDecay(decay: number): this;
  on(event: string, listener: (() => void) | null): this;
  stop(): void;
}

export function toD3Node(cell: ForceCell): D3SimulationNode {
  return {
    id: cell.id,
    index: cell.index,
    x: cell.x,
    y: cell.y,
    vx: cell.vx,
    vy: cell.vy,
    fx: cell.fx,
    fy: cell.fy,
  };
}

export function toD3Link(link: ForceLink): D3ForceLink {
  return {
    source: link.source,
    target: link.target,
    distance: link.distance,
  };
}
