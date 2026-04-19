// N0 Node Graph — Schema Layer Types
// Pure TypeScript — no Svelte, no DOM dependencies

// === Scoped Port Types ===

export type PortScope = 'realm' | 'grove' | 'accord' | 'system' | 'app';

// scope:id:type — globally unique, no ambiguity
export type ScopedPortType = `${PortScope}:${string}:${string}`;

export type PortDirection = 'input' | 'output';

// === Port ===

export interface PortDefinition {
  id: string;
  label: string;
  type: ScopedPortType;
  direction: PortDirection;
  required: boolean;
  maxConnections: number;
}

// === Node ===

export interface NodeDefinition {
  kind: string;
  label: string;
  description: string;
  ports: PortDefinition[];
  metadata: Record<string, unknown>;
}

export interface NodeInstance {
  id: string;
  kind: string;
  position: Point;
  size: Size;
  data: Record<string, unknown>;
  collapsed: boolean;
}

// === Edge ===

export interface EdgeDefinition {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  metadata: Record<string, unknown>;
}

// === Graph Schema ===

export interface GraphSchema {
  id: string;
  name: string;
  version: string;
  nodeDefinitions: NodeDefinition[];
  nodes: NodeInstance[];
  edges: EdgeDefinition[];
}

// === Validation ===

export interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  portId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// === Geometry ===

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface Size {
  width: number;
  height: number;
}
