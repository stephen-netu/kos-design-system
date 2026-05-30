// Entity Graph View — SOVEREIGN Entity Graph Visualization Types
// Maps m0-primitives entity types to LEAP visualization components
//
// IMPORTANT: These types match the serde serialization output from Rust.
// Rust uses snake_case fields and externally tagged enum variants by default.

import type { GraphSchema, NodeInstance, NodeDefinition, EdgeDefinition } from '../n0-node-graph/types';
import type { MetricCardProps, TimelineEntry } from '../d0-data-viz/types';

// === Serde-compatible SOVEREIGN Entity Types ===
//
// Rust newtype wrappers (EntityId, EdgeId) serialize as plain strings.
// Rust enums serialize as externally tagged: { "Custom": "foo" }, { "Active": null }
// Rust BTreeMap serializes as plain JSON object, not TS Map.
// Rust BTreeSet serializes as JSON array.
// Rust u64 serializes as JSON number.

export type EntityId = string;
export type EdgeId = string;

// Enums — externally tagged per serde default
export type EntityType = { Custom: string };
export type RelationshipType = { Custom: string };
export type MetricType = { Custom: string };

export type EntityState =
  | { Active: null }
  | { Inactive: null }
  | { Degraded: null }
  | { Critical: null }
  | { Pending: null }
  | { Resolved: null }
  | { Custom: string };

export type MetricValue =
  | { Scalar: number }
  | { Distribution: number[] }
  | { TimeSeries: [number, number][] };

// === Core Domain Structs (snake_case matches Rust) ===

export interface WorldEntity {
  id: EntityId;
  entity_type: EntityType;
  canonical_name: string;
  display_name: string;
  properties: Record<string, unknown>;
  state: EntityState;
  created_sequence: number;
  updated_sequence: number;
  tags: string[];
}

export interface WorldEdge {
  id: EdgeId;
  source: EntityId;
  target: EntityId;
  relationship: RelationshipType;
  properties: Record<string, unknown>;
  weight: number;
  created_sequence: number;
}

export interface WorldMetric {
  entity_id: EntityId;
  metric_type: MetricType;
  value: MetricValue;
  unit: string;
  timestamp_sequence: number;
  source: string;
}

export interface StateTransition {
  entity_id: EntityId;
  from_state: EntityState;
  to_state: EntityState;
  trigger: string;
  sequence: number;
  metadata: Record<string, unknown>;
}

export interface WorldSnapshot {
  sequence: number;
  // BTreeMap serializes as plain JSON object
  entities: Record<EntityId, WorldEntity>;
  edges: Record<EdgeId, WorldEdge>;
  // BTreeMap<EntityId, BTreeMap<String, Vec<WorldMetric>>>
  metrics: Record<EntityId, Record<string, WorldMetric[]>>;
  transitions: StateTransition[];
}

// === Delta / Anomaly / MetricDelta (for streaming updates) ===

/** The delta between two snapshots — used for incremental updates. */
export interface WorldDelta {
  since_sequence: number;
  until_sequence: number;
  added_entities: EntityId[];
  modified_entities: EntityId[];
  removed_entities: EntityId[];
  added_edges: EdgeId[];
  removed_edges: EdgeId[];
  // BTreeMap<EntityId, Vec<WorldMetric>>
  new_metrics: Record<EntityId, WorldMetric[]>;
  new_transitions: StateTransition[];
}

/** A detected anomaly on an entity metric. */
export interface Anomaly {
  entity_id: EntityId;
  metric_type: MetricType;
  description: string;
  severity: number;
  sequence: number;
}

/** The change in a metric over a window. */
export interface MetricDelta {
  entity_id: EntityId;
  metric_type: MetricType;
  start_value: number;
  end_value: number;
  absolute_change: number;
  percent_change: number;
  window_start: number;
  window_end: number;
}

// === Enum Extractors ===

/** Extract string value from externally-tagged EntityType */
export function entityTypeStr(t: EntityType): string {
  return t.Custom;
}

/** Extract string value from externally-tagged RelationshipType */
export function relationshipTypeStr(t: RelationshipType): string {
  return t.Custom;
}

/** Extract string value from externally-tagged MetricType */
export function metricTypeStr(t: MetricType): string {
  return t.Custom;
}

/** Extract state string from externally-tagged EntityState */
export function entityStateStr(s: EntityState): string {
  if ('Active' in s) return 'active';
  if ('Inactive' in s) return 'inactive';
  if ('Degraded' in s) return 'degraded';
  if ('Critical' in s) return 'critical';
  if ('Pending' in s) return 'pending';
  if ('Resolved' in s) return 'resolved';
  if ('Custom' in s) return s.Custom;
  return 'unknown';
}

/** Extract scalar value from MetricValue, if scalar */
export function metricValueScalar(v: MetricValue): number | null {
  if ('Scalar' in v) return v.Scalar;
  return null;
}

/** Extract latest value from MetricValue */
export function metricValueLatest(v: MetricValue): number | null {
  if ('Scalar' in v) return v.Scalar;
  if ('Distribution' in v) {
    const d = v.Distribution;
    return d.length > 0 ? d[d.length - 1] : null;
  }
  if ('TimeSeries' in v) {
    const ts = v.TimeSeries;
    return ts.length > 0 ? ts[ts.length - 1][1] : null;
  }
  return null;
}

// === State Color Map ===

export const STATE_COLORS: Record<string, string> = {
  active: '#22c55e',
  inactive: '#6b7280',
  degraded: '#f59e0b',
  critical: '#ef4444',
  pending: '#3b82f6',
  resolved: '#10b981',
};

// === Adapters ===

/**
 * Convert WorldEntity to NodeInstance for n0-node-graph.
 * EntityId is a string, so id maps directly.
 */
export function entityToNodeInstance(
  entity: WorldEntity,
  position: { x: number; y: number } = { x: 0, y: 0 }
): NodeInstance {
  return {
    id: entity.id,
    kind: entityTypeStr(entity.entity_type),
    position,
    size: { width: 200, height: 100 },
    data: {
      display_name: entity.display_name,
      canonical_name: entity.canonical_name,
      state: entityStateStr(entity.state),
      tags: entity.tags,
      ...entity.properties,
    },
    collapsed: false,
  };
}

/**
 * Convert WorldEdge to EdgeDefinition for n0-node-graph.
 */
export function edgeToEdgeDefinition(edge: WorldEdge): EdgeDefinition {
  return {
    id: edge.id,
    sourceNodeId: edge.source,
    sourcePortId: 'output',
    targetNodeId: edge.target,
    targetPortId: 'input',
    metadata: {
      relationship: relationshipTypeStr(edge.relationship),
      weight: edge.weight,
      ...edge.properties,
    },
  };
}

/**
 * Generate NodeDefinition for an entity type.
 * One definition per unique entity_type in the snapshot.
 */
export function entityTypeToNodeDefinition(entityType: string): NodeDefinition {
  return {
    kind: entityType,
    label: entityType.charAt(0).toUpperCase() + entityType.slice(1),
    description: `${entityType} entity`,
    ports: [
      { id: 'input', label: 'In', type: 'system:edge:default', direction: 'input', required: false, maxConnections: -1 },
      { id: 'output', label: 'Out', type: 'system:edge:default', direction: 'output', required: false, maxConnections: -1 },
    ],
    metadata: {},
  };
}

/**
 * Convert WorldSnapshot to GraphSchema with ELK-compatible layout hints.
 * Positions are set to 0,0 — use elkjs for layout before rendering.
 */
export function snapshotToGraphSchema(snapshot: WorldSnapshot): GraphSchema {
  // Collect unique entity types for node definitions
  const typeSet = new Set<string>();
  Object.values(snapshot.entities).forEach(e => {
    typeSet.add(entityTypeStr(e.entity_type));
  });
  const nodeDefinitions: NodeDefinition[] = Array.from(typeSet).sort().map(entityTypeToNodeDefinition);

  // Create nodes at origin — layout engine positions them
  const nodes: NodeInstance[] = Object.values(snapshot.entities).map(e =>
    entityToNodeInstance(e, { x: 0, y: 0 })
  );

  // Create edges
  const edges: EdgeDefinition[] = Object.values(snapshot.edges).map(edgeToEdgeDefinition);

  return {
    id: `entity-graph-${snapshot.sequence}`,
    name: `Entity Graph #${snapshot.sequence}`,
    version: '1.0.0',
    nodeDefinitions,
    nodes,
    edges,
  };
}

/**
 * Extract latest scalar metrics as MetricCardProps.
 */
export function snapshotToMetrics(snapshot: WorldSnapshot): MetricCardProps[] {
  const cards: MetricCardProps[] = [];

  for (const [_entityId, metricMap] of Object.entries(snapshot.metrics)) {
    for (const [metricTypeKey, metrics] of Object.entries(metricMap)) {
      if (metrics.length === 0) continue;

      // Find latest by timestamp_sequence
      const sorted = [...metrics].sort((a, b) => a.timestamp_sequence - b.timestamp_sequence);
      const latest = sorted[sorted.length - 1];
      const scalar = metricValueLatest(latest.value);
      if (scalar === null) continue;

      // Compute trend from last two values
      let trend: 'up' | 'down' | 'flat' | undefined;
      if (sorted.length >= 2) {
        const prev = metricValueLatest(sorted[sorted.length - 2].value);
        if (prev !== null) {
          trend = scalar > prev ? 'up' : scalar < prev ? 'down' : 'flat';
        }
      }

      cards.push({
        label: metricTypeKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: scalar.toFixed(2),
        unit: latest.unit,
        trend,
        size: 'default',
      });
    }
  }

  return cards;
}

/**
 * Convert StateTransitions to TimelineEntries.
 */
export function snapshotToTimeline(snapshot: WorldSnapshot): TimelineEntry[] {
  return [...snapshot.transitions]
    .sort((a, b) => a.sequence - b.sequence)
    .map(t => ({
      id: `transition-${t.sequence}-${t.entity_id}`,
      timestamp: `Seq ${t.sequence}`,
      label: `${entityStateStr(t.from_state)} → ${entityStateStr(t.to_state)}`,
      description: `${t.entity_id}: ${t.trigger}`,
      color: STATE_COLORS[entityStateStr(t.to_state)] ?? '#6b7280',
    }));
}

// === Filter ===

export interface EntityFilter {
  entity_types?: string[];
  states?: string[];
  tags_any?: string[];
  tags_all?: string[];
  name_contains?: string;
}

export function filterEntities(entities: WorldEntity[], filter: EntityFilter): WorldEntity[] {
  return entities.filter(entity => {
    if (filter.entity_types?.length && !filter.entity_types.includes(entityTypeStr(entity.entity_type))) {
      return false;
    }
    if (filter.states?.length && !filter.states.includes(entityStateStr(entity.state))) {
      return false;
    }
    if (filter.tags_any?.length && !filter.tags_any.some(t => entity.tags.includes(t))) {
      return false;
    }
    if (filter.tags_all?.length && !filter.tags_all.every(t => entity.tags.includes(t))) {
      return false;
    }
    if (filter.name_contains &&
        !entity.canonical_name.includes(filter.name_contains) &&
        !entity.display_name.includes(filter.name_contains)) {
      return false;
    }
    return true;
  });
}
