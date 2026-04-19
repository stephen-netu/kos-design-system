// N0 Node Graph — Validation
// Pure TypeScript — no side effects, no mutations

import type {
  GraphSchema,
  NodeInstance,
  EdgeDefinition,
  PortDefinition,
  NodeDefinition,
  ValidationError,
  ValidationResult,
} from './types';

// Helper: Get a node definition by kind
function getNodeDefinition(
  nodeDefinitions: NodeDefinition[],
  kind: string
): NodeDefinition | undefined {
  return nodeDefinitions.find((def) => def.kind === kind);
}

// Helper: Get a node instance by id
function getNodeInstance(
  nodes: NodeInstance[],
  id: string
): NodeInstance | undefined {
  return nodes.find((node) => node.id === id);
}

// Helper: Get a port definition from a node definition
function getPortDefinition(
  nodeDefinition: NodeDefinition,
  portId: string
): PortDefinition | undefined {
  return nodeDefinition.ports.find((port) => port.id === portId);
}

// Helper: Count connections to a specific port
function countConnectionsToPort(
  edges: EdgeDefinition[],
  nodeId: string,
  portId: string,
  direction: 'source' | 'target'
): number {
  return edges.filter((edge) => {
    if (direction === 'source') {
      return edge.sourceNodeId === nodeId && edge.sourcePortId === portId;
    }
    return edge.targetNodeId === nodeId && edge.targetPortId === portId;
  }).length;
}

// Helper: Check if an edge is a duplicate
function isDuplicateEdge(
  edges: EdgeDefinition[],
  edge: EdgeDefinition
): boolean {
  return edges.some((existing) =>
    existing.id !== edge.id &&
    existing.sourceNodeId === edge.sourceNodeId &&
    existing.sourcePortId === edge.sourcePortId &&
    existing.targetNodeId === edge.targetNodeId &&
    existing.targetPortId === edge.targetPortId
  );
}

// Validation Rule 1: NodeInstance.kind must reference a registered NodeDefinition.kind
function validateNodeKindReferences(
  schema: GraphSchema
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const node of schema.nodes) {
    const definition = getNodeDefinition(schema.nodeDefinitions, node.kind);
    if (!definition) {
      errors.push({
        code: 'INVALID_NODE_KIND',
        message: `Node instance "${node.id}" references undefined kind "${node.kind}"`,
        nodeId: node.id,
      });
    }
  }
  
  return errors;
}

// Validation Rule 2: Every edge must connect existing nodes and existing ports
function validateEdgeConnections(
  schema: GraphSchema
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const edge of schema.edges) {
    // Check source node exists
    const sourceNode = getNodeInstance(schema.nodes, edge.sourceNodeId);
    if (!sourceNode) {
      errors.push({
        code: 'INVALID_SOURCE_NODE',
        message: `Edge "${edge.id}" references non-existent source node "${edge.sourceNodeId}"`,
        edgeId: edge.id,
      });
      continue;
    }
    
    // Check target node exists
    const targetNode = getNodeInstance(schema.nodes, edge.targetNodeId);
    if (!targetNode) {
      errors.push({
        code: 'INVALID_TARGET_NODE',
        message: `Edge "${edge.id}" references non-existent target node "${edge.targetNodeId}"`,
        edgeId: edge.id,
      });
      continue;
    }
    
    // Get node definitions
    const sourceDef = getNodeDefinition(schema.nodeDefinitions, sourceNode.kind);
    const targetDef = getNodeDefinition(schema.nodeDefinitions, targetNode.kind);
    
    if (!sourceDef) {
      errors.push({
        code: 'INVALID_SOURCE_NODE_KIND',
        message: `Source node "${sourceNode.id}" has no registered definition`,
        edgeId: edge.id,
        nodeId: sourceNode.id,
      });
      continue;
    }
    
    if (!targetDef) {
      errors.push({
        code: 'INVALID_TARGET_NODE_KIND',
        message: `Target node "${targetNode.id}" has no registered definition`,
        edgeId: edge.id,
        nodeId: targetNode.id,
      });
      continue;
    }
    
    // Check source port exists
    const sourcePort = getPortDefinition(sourceDef, edge.sourcePortId);
    if (!sourcePort) {
      errors.push({
        code: 'INVALID_SOURCE_PORT',
        message: `Edge "${edge.id}" references non-existent source port "${edge.sourcePortId}" on node "${sourceNode.id}"`,
        edgeId: edge.id,
        portId: edge.sourcePortId,
      });
    }
    
    // Check target port exists
    const targetPort = getPortDefinition(targetDef, edge.targetPortId);
    if (!targetPort) {
      errors.push({
        code: 'INVALID_TARGET_PORT',
        message: `Edge "${edge.id}" references non-existent target port "${edge.targetPortId}" on node "${targetNode.id}"`,
        edgeId: edge.id,
        portId: edge.targetPortId,
      });
    }
  }
  
  return errors;
}

// Validation Rule 3: Port direction — edges go from output port to input port only
function validatePortDirection(
  schema: GraphSchema
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const edge of schema.edges) {
    const sourceNode = getNodeInstance(schema.nodes, edge.sourceNodeId);
    const targetNode = getNodeInstance(schema.nodes, edge.targetNodeId);
    
    if (!sourceNode || !targetNode) continue;
    
    const sourceDef = getNodeDefinition(schema.nodeDefinitions, sourceNode.kind);
    const targetDef = getNodeDefinition(schema.nodeDefinitions, targetNode.kind);
    
    if (!sourceDef || !targetDef) continue;
    
    const sourcePort = getPortDefinition(sourceDef, edge.sourcePortId);
    const targetPort = getPortDefinition(targetDef, edge.targetPortId);
    
    if (sourcePort && targetPort) {
      if (sourcePort.direction !== 'output') {
        errors.push({
          code: 'INVALID_PORT_DIRECTION',
          message: `Edge "${edge.id}" must start from an output port, but port "${edge.sourcePortId}" on node "${sourceNode.id}" is "${sourcePort.direction}"`,
          edgeId: edge.id,
          portId: edge.sourcePortId,
        });
      }
      
      if (targetPort.direction !== 'input') {
        errors.push({
          code: 'INVALID_PORT_DIRECTION',
          message: `Edge "${edge.id}" must end at an input port, but port "${edge.targetPortId}" on node "${targetNode.id}" is "${targetPort.direction}"`,
          edgeId: edge.id,
          portId: edge.targetPortId,
        });
      }
    }
  }
  
  return errors;
}

// Validation Rule 4: Port type compatibility — exact match required
function validateTypeCompatibility(
  schema: GraphSchema
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const edge of schema.edges) {
    const sourceNode = getNodeInstance(schema.nodes, edge.sourceNodeId);
    const targetNode = getNodeInstance(schema.nodes, edge.targetNodeId);
    
    if (!sourceNode || !targetNode) continue;
    
    const sourceDef = getNodeDefinition(schema.nodeDefinitions, sourceNode.kind);
    const targetDef = getNodeDefinition(schema.nodeDefinitions, targetNode.kind);
    
    if (!sourceDef || !targetDef) continue;
    
    const sourcePort = getPortDefinition(sourceDef, edge.sourcePortId);
    const targetPort = getPortDefinition(targetDef, edge.targetPortId);
    
    if (sourcePort && targetPort && sourcePort.type !== targetPort.type) {
      errors.push({
        code: 'TYPE_MISMATCH',
        message: `Edge "${edge.id}" connects incompatible types: source port "${edge.sourcePortId}" has type "${sourcePort.type}" but target port "${edge.targetPortId}" has type "${targetPort.type}"`,
        edgeId: edge.id,
      });
    }
  }
  
  return errors;
}

// Validation Rule 5: Connection limits — port.maxConnections not exceeded
function validateConnectionLimits(
  schema: GraphSchema
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const node of schema.nodes) {
    const definition = getNodeDefinition(schema.nodeDefinitions, node.kind);
    if (!definition) continue;
    
    for (const port of definition.ports) {
      const connectionCount = countConnectionsToPort(
        schema.edges,
        node.id,
        port.id,
        port.direction === 'output' ? 'source' : 'target'
      );
      
      if (connectionCount > port.maxConnections) {
        errors.push({
          code: 'MAX_CONNECTIONS_EXCEEDED',
          message: `Port "${port.id}" on node "${node.id}" has ${connectionCount} connections but maximum allowed is ${port.maxConnections}`,
          nodeId: node.id,
          portId: port.id,
        });
      }
    }
  }
  
  return errors;
}

// Validation Rule 6: Required ports — all required:true ports must have at least one connection
function validateRequiredPorts(
  schema: GraphSchema
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const node of schema.nodes) {
    const definition = getNodeDefinition(schema.nodeDefinitions, node.kind);
    if (!definition) continue;
    
    for (const port of definition.ports) {
      if (!port.required) continue;
      
      const connectionCount = countConnectionsToPort(
        schema.edges,
        node.id,
        port.id,
        port.direction === 'output' ? 'source' : 'target'
      );
      
      if (connectionCount === 0) {
        errors.push({
          code: 'REQUIRED_PORT_UNCONNECTED',
          message: `Required port "${port.id}" on node "${node.id}" has no connections`,
          nodeId: node.id,
          portId: port.id,
        });
      }
    }
  }
  
  return errors;
}

// Validation Rule 7: No self-loops (edge source === edge target on same node)
function validateNoSelfLoops(
  schema: GraphSchema
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const edge of schema.edges) {
    if (edge.sourceNodeId === edge.targetNodeId) {
      errors.push({
        code: 'SELF_LOOP',
        message: `Edge "${edge.id}" creates a self-loop on node "${edge.sourceNodeId}"`,
        edgeId: edge.id,
      });
    }
  }
  
  return errors;
}

// Validation Rule 8: No duplicate edges (same source port → same target port)
function validateNoDuplicateEdges(
  schema: GraphSchema
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const edge of schema.edges) {
    if (isDuplicateEdge(schema.edges, edge)) {
      errors.push({
        code: 'DUPLICATE_EDGE',
        message: `Edge "${edge.id}" is a duplicate: same source "${edge.sourceNodeId}:${edge.sourcePortId}" to target "${edge.targetNodeId}:${edge.targetPortId}"`,
        edgeId: edge.id,
      });
    }
  }
  
  return errors;
}

/**
 * Validates a graph schema against all 8 validation rules.
 * 
 * Pure function — no side effects, no mutation of input.
 * 
 * @param schema - The graph schema to validate
 * @returns ValidationResult with valid flag and array of errors
 */
export function validateGraph(schema: GraphSchema): ValidationResult {
  // Collect all errors from all validation rules
  const allErrors: ValidationError[] = [
    ...validateNodeKindReferences(schema),
    ...validateEdgeConnections(schema),
    ...validatePortDirection(schema),
    ...validateTypeCompatibility(schema),
    ...validateConnectionLimits(schema),
    ...validateRequiredPorts(schema),
    ...validateNoSelfLoops(schema),
    ...validateNoDuplicateEdges(schema),
  ];
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
