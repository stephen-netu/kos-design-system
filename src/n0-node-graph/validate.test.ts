// N0 Node Graph — Validation Tests
// Uses Vitest — deterministic test data only

import { describe, it, expect } from 'vitest';
import { validateGraph } from './validate';
import type { GraphSchema, NodeDefinition, NodeInstance, EdgeDefinition } from './types';

// Deterministic test data factories — no Math.random() or Date.now()

function createMinimalNodeDefinition(): NodeDefinition {
  return {
    kind: 'test:task',
    label: 'Task Node',
    description: 'A test task node',
    ports: [
      {
        id: 'input',
        label: 'Input',
        type: 'app:test:task' as const,
        direction: 'input' as const,
        required: false,
        maxConnections: 1,
      },
      {
        id: 'output',
        label: 'Output',
        type: 'app:test:task' as const,
        direction: 'output' as const,
        required: false,
        maxConnections: Infinity,
      },
    ],
    metadata: {},
  };
}

function createMinimalNodeInstance(id: string, kind: string = 'test:task'): NodeInstance {
  return {
    id,
    kind,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 50 },
    data: {},
    collapsed: false,
  };
}

function createMinimalEdge(
  id: string,
  sourceNodeId: string,
  sourcePortId: string,
  targetNodeId: string,
  targetPortId: string
): EdgeDefinition {
  return {
    id,
    sourceNodeId,
    sourcePortId,
    targetNodeId,
    targetPortId,
    metadata: {},
  };
}

function createValidGraph(): GraphSchema {
  const nodeDef = createMinimalNodeDefinition();
  return {
    id: 'graph-001',
    name: 'Valid Test Graph',
    version: '1.0.0',
    nodeDefinitions: [nodeDef],
    nodes: [
      createMinimalNodeInstance('node-1'),
      createMinimalNodeInstance('node-2'),
    ],
    edges: [
      createMinimalEdge('edge-1', 'node-1', 'output', 'node-2', 'input'),
    ],
  };
}

// === Valid Graph Tests ===

describe('validateGraph — valid graphs', () => {
  it('passes for a valid minimal graph', () => {
    const graph = createValidGraph();
    const result = validateGraph(graph);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes for an empty graph', () => {
    const graph: GraphSchema = {
      id: 'empty-graph',
      name: 'Empty Graph',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [],
      edges: [],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes for a single node with no edges', () => {
    const graph: GraphSchema = {
      id: 'single-node-graph',
      name: 'Single Node Graph',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [createMinimalNodeInstance('node-1')],
      edges: [],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes for disconnected subgraphs (multiple node groups without edges)', () => {
    const graph: GraphSchema = {
      id: 'disconnected-graph',
      name: 'Disconnected Graph',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [
        createMinimalNodeInstance('node-1'),
        createMinimalNodeInstance('node-2'),
        createMinimalNodeInstance('node-3'),
        createMinimalNodeInstance('node-4'),
      ],
      // Only connect node-1 to node-2, leaving 3 and 4 disconnected
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'output', 'node-2', 'input'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// === Rule 1: Node kind references ===

describe('validateGraph — Rule 1: Node kind must reference registered definition', () => {
  it('fails when node kind is not registered', () => {
    const graph: GraphSchema = {
      id: 'invalid-kind-graph',
      name: 'Invalid Kind Graph',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [
        {
          id: 'node-1',
          kind: 'nonexistent:kind',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
          data: {},
          collapsed: false,
        },
      ],
      edges: [],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_NODE_KIND',
        message: expect.stringContaining('nonexistent:kind'),
        nodeId: 'node-1',
      })
    );
  });
});

// === Rule 2: Edge connections ===

describe('validateGraph — Rule 2: Edges must connect existing nodes and port', () => {
  it('fails when edge references non-existent source node', () => {
    const graph: GraphSchema = {
      id: 'invalid-source-node',
      name: 'Invalid Source Node',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [createMinimalNodeInstance('node-1')],
      edges: [
        createMinimalEdge('edge-1', 'nonexistent-node', 'output', 'node-1', 'input'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_SOURCE_NODE',
      })
    );
  });

  it('fails when edge references non-existent target node', () => {
    const graph: GraphSchema = {
      id: 'invalid-target-node',
      name: 'Invalid Target Node',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [createMinimalNodeInstance('node-1')],
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'output', 'nonexistent-node', 'input'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_TARGET_NODE',
      })
    );
  });

  it('fails when edge references non-existent source port', () => {
    const graph: GraphSchema = {
      id: 'invalid-source-port',
      name: 'Invalid Source Port',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [
        createMinimalNodeInstance('node-1'),
        createMinimalNodeInstance('node-2'),
      ],
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'nonexistent-port', 'node-2', 'input'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_SOURCE_PORT',
      })
    );
  });

  it('fails when edge references non-existent target port', () => {
    const graph: GraphSchema = {
      id: 'invalid-target-port',
      name: 'Invalid Target Port',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [
        createMinimalNodeInstance('node-1'),
        createMinimalNodeInstance('node-2'),
      ],
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'output', 'node-2', 'nonexistent-port'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_TARGET_PORT',
      })
    );
  });
});

// === Rule 3: Port direction ===

describe('validateGraph — Rule 3: Port direction (output → input only)', () => {
  it('fails when edge goes from input to output', () => {
    const nodeDef: NodeDefinition = {
      kind: 'test:task',
      label: 'Task Node',
      description: 'A test task node',
      ports: [
        {
          id: 'input',
          label: 'Input',
          type: 'app:test:task' as const,
          direction: 'input' as const,
          required: false,
          maxConnections: 1,
        },
        {
          id: 'output',
          label: 'Output',
          type: 'app:test:task' as const,
          direction: 'output' as const,
          required: false,
          maxConnections: Infinity,
        },
      ],
      metadata: {},
    };
    
    const graph: GraphSchema = {
      id: 'wrong-direction',
      name: 'Wrong Direction',
      version: '1.0.0',
      nodeDefinitions: [nodeDef],
      nodes: [
        createMinimalNodeInstance('node-1'),
        createMinimalNodeInstance('node-2'),
      ],
      edges: [
        // Trying to connect input to output — wrong direction
        createMinimalEdge('edge-1', 'node-1', 'input', 'node-2', 'output'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_PORT_DIRECTION',
      })
    );
  });

  it('fails when edge goes from output to output', () => {
    const nodeDef: NodeDefinition = {
      kind: 'test:task',
      label: 'Task Node',
      description: 'A test task node',
      ports: [
        {
          id: 'input',
          label: 'Input',
          type: 'app:test:task' as const,
          direction: 'input' as const,
          required: false,
          maxConnections: 1,
        },
        {
          id: 'output',
          label: 'Output',
          type: 'app:test:task' as const,
          direction: 'output' as const,
          required: false,
          maxConnections: Infinity,
        },
      ],
      metadata: {},
    };
    
    const graph: GraphSchema = {
      id: 'wrong-direction-2',
      name: 'Wrong Direction 2',
      version: '1.0.0',
      nodeDefinitions: [nodeDef],
      nodes: [
        createMinimalNodeInstance('node-1'),
        createMinimalNodeInstance('node-2'),
      ],
      edges: [
        // Both are output ports — wrong direction
        createMinimalEdge('edge-1', 'node-1', 'output', 'node-2', 'output'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_PORT_DIRECTION',
      })
    );
  });
});

// === Rule 4: Type compatibility ===

describe('validateGraph — Rule 4: Port type compatibility (exact match)', () => {
  it('fails when source and target port types do not match', () => {
    const nodeDef1: NodeDefinition = {
      kind: 'test:task',
      label: 'Task Node',
      description: 'A test task node',
      ports: [
        {
          id: 'output',
          label: 'Output',
          type: 'app:test:task' as const,
          direction: 'output' as const,
          required: false,
          maxConnections: Infinity,
        },
      ],
      metadata: {},
    };
    
    const nodeDef2: NodeDefinition = {
      kind: 'test:signal',
      label: 'Signal Node',
      description: 'A test signal node',
      ports: [
        {
          id: 'input',
          label: 'Input',
          type: 'app:test:signal' as const,
          direction: 'input' as const,
          required: false,
          maxConnections: 1,
        },
      ],
      metadata: {},
    };
    
    const graph: GraphSchema = {
      id: 'type-mismatch',
      name: 'Type Mismatch',
      version: '1.0.0',
      nodeDefinitions: [nodeDef1, nodeDef2],
      nodes: [
        { ...createMinimalNodeInstance('node-1', 'test:task'), ports: undefined } as NodeInstance,
        { ...createMinimalNodeInstance('node-2', 'test:signal'), ports: undefined } as NodeInstance,
      ],
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'output', 'node-2', 'input'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'TYPE_MISMATCH',
        message: expect.stringMatching(/app:test:(task|signal)/),
      })
    );
  });
});

// === Rule 5: Connection limits ===

describe('validateGraph — Rule 5: Connection limits (maxConnections)', () => {
  it('fails when input port maxConnections is exceeded', () => {
    const nodeDef: NodeDefinition = {
      kind: 'test:task',
      label: 'Task Node',
      description: 'A test task node',
      ports: [
        {
          id: 'input',
          label: 'Input',
          type: 'app:test:task' as const,
          direction: 'input' as const,
          required: false,
          maxConnections: 1, // Only allows 1 connection
        },
        {
          id: 'output',
          label: 'Output',
          type: 'app:test:task' as const,
          direction: 'output' as const,
          required: false,
          maxConnections: Infinity,
        },
      ],
      metadata: {},
    };
    
    const graph: GraphSchema = {
      id: 'max-connections',
      name: 'Max Connections',
      version: '1.0.0',
      nodeDefinitions: [nodeDef],
      nodes: [
        createMinimalNodeInstance('node-1'), // Source
        createMinimalNodeInstance('node-2'), // Target 1
        createMinimalNodeInstance('node-3'), // Target 2 - exceeds limit
      ],
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'output', 'node-2', 'input'),
        createMinimalEdge('edge-2', 'node-1', 'output', 'node-2', 'input'), // 2 connections to same port - exceeds maxConnections=1
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'MAX_CONNECTIONS_EXCEEDED',
        message: expect.stringMatching(/(1 connections|maximum allowed is 1)/),
      })
    );
  });
});

// === Rule 6: Required ports ===

describe('validateGraph — Rule 6: Required ports must have connections', () => {
  it('fails when required input port has no connections', () => {
    const nodeDef: NodeDefinition = {
      kind: 'test:task',
      label: 'Task Node',
      description: 'A test task node',
      ports: [
        {
          id: 'input',
          label: 'Input',
          type: 'app:test:task' as const,
          direction: 'input' as const,
          required: true, // Required!
          maxConnections: 1,
        },
        {
          id: 'output',
          label: 'Output',
          type: 'app:test:task' as const,
          direction: 'output' as const,
          required: false,
          maxConnections: Infinity,
        },
      ],
      metadata: {},
    };
    
    const graph: GraphSchema = {
      id: 'required-port',
      name: 'Required Port',
      version: '1.0.0',
      nodeDefinitions: [nodeDef],
      nodes: [createMinimalNodeInstance('node-1')],
      edges: [], // No connections to the required input port
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => 
      e.code === 'REQUIRED_PORT_UNCONNECTED' && 
      e.nodeId === 'node-1' &&
      e.portId === 'input'
    )).toBe(true);
  });

  it('passes when required input port has at least one connection', () => {
    const nodeDefRequired: NodeDefinition = {
      kind: 'test:task',
      label: 'Task Node',
      description: 'A test task node',
      ports: [
        {
          id: 'input',
          label: 'Input',
          type: 'app:test:task' as const,
          direction: 'input' as const,
          required: true,
          maxConnections: 1,
        },
        {
          id: 'output',
          label: 'Output',
          type: 'app:test:task' as const,
          direction: 'output' as const,
          required: false,
          maxConnections: Infinity,
        },
      ],
      metadata: {},
    };

    const nodeDefOptional: NodeDefinition = {
      kind: 'test:task-optional',
      label: 'Task Node Optional',
      description: 'A test task node with optional input',
      ports: [
        {
          id: 'input',
          label: 'Input',
          type: 'app:test:task' as const,
          direction: 'input' as const,
          required: false,
          maxConnections: 1,
        },
        {
          id: 'output',
          label: 'Output',
          type: 'app:test:task' as const,
          direction: 'output' as const,
          required: false,
          maxConnections: Infinity,
        },
      ],
      metadata: {},
    };
    
    const graph: GraphSchema = {
      id: 'required-port-ok',
      name: 'Required Port OK',
      version: '1.0.0',
      nodeDefinitions: [nodeDefRequired, nodeDefOptional],
      nodes: [
        createMinimalNodeInstance('node-1', 'test:task-optional'),
        createMinimalNodeInstance('node-2', 'test:task'),
      ],
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'output', 'node-2', 'input'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// === Rule 7: No self-loops ===

describe('validateGraph — Rule 7: No self-loops', () => {
  it('fails when edge connects node to itself', () => {
    const graph: GraphSchema = {
      id: 'self-loop',
      name: 'Self Loop',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [createMinimalNodeInstance('node-1')],
      edges: [
        // Self-loop: source and target are the same node
        createMinimalEdge('edge-1', 'node-1', 'output', 'node-1', 'input'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'SELF_LOOP',
        message: expect.stringContaining('self-loop'),
        edgeId: 'edge-1',
      })
    );
  });
});

// === Rule 8: No duplicate edges ===

describe('validateGraph — Rule 8: No duplicate edges', () => {
  it('fails when duplicate edge exists (same source and target ports)', () => {
    const graph: GraphSchema = {
      id: 'duplicate-edge',
      name: 'Duplicate Edge',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [
        createMinimalNodeInstance('node-1'),
        createMinimalNodeInstance('node-2'),
      ],
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'output', 'node-2', 'input'),
        // Duplicate: same source and target ports
        createMinimalEdge('edge-2', 'node-1', 'output', 'node-2', 'input'),
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_EDGE',
        message: expect.stringContaining('duplicate'),
      })
    );
  });

  it('passes when edges connect different ports on same nodes', () => {
    const graph: GraphSchema = {
      id: 'different-ports',
      name: 'Different Ports',
      version: '1.0.0',
      nodeDefinitions: [
        {
          kind: 'test:multi',
          label: 'Multi Port Node',
          description: 'Node with multiple ports',
          ports: [
            { id: 'input1', label: 'Input 1', type: 'app:test:task' as const, direction: 'input' as const, required: false, maxConnections: 1 },
            { id: 'input2', label: 'Input 2', type: 'app:test:task' as const, direction: 'input' as const, required: false, maxConnections: 1 },
            { id: 'output1', label: 'Output 1', type: 'app:test:task' as const, direction: 'output' as const, required: false, maxConnections: Infinity },
            { id: 'output2', label: 'Output 2', type: 'app:test:task' as const, direction: 'output' as const, required: false, maxConnections: Infinity },
          ],
          metadata: {},
        },
      ],
      nodes: [
        createMinimalNodeInstance('node-1', 'test:multi'),
        createMinimalNodeInstance('node-2', 'test:multi'),
      ],
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'output1', 'node-2', 'input1'),
        createMinimalEdge('edge-2', 'node-1', 'output2', 'node-2', 'input2'), // Different ports, not duplicate
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(true);
  });
});

// === Multiple validation errors ===

describe('validateGraph — multiple errors', () => {
  it('collects all errors from all rules', () => {
    const graph: GraphSchema = {
      id: 'multiple-errors',
      name: 'Multiple Errors',
      version: '1.0.0',
      nodeDefinitions: [createMinimalNodeDefinition()],
      nodes: [
        {
          id: 'node-1',
          kind: 'nonexistent:kind', // Rule 1 error
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
          data: {},
          collapsed: false,
        },
        createMinimalNodeInstance('node-2'),
      ],
      edges: [
        createMinimalEdge('edge-1', 'node-1', 'output', 'node-2', 'input'),
        createMinimalEdge('edge-2', 'node-1', 'output', 'node-1', 'input'), // Rule 7: self-loop
      ],
    };
    const result = validateGraph(graph);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(result.errors.map(e => e.code).sort()).toEqual(
      expect.arrayContaining(['INVALID_NODE_KIND', 'SELF_LOOP'].sort())
    );
  });
});
