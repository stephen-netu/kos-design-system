<script lang="ts">
  import type { Snippet } from 'svelte';
  import type {
    GraphSchema,
    NodeInstance,
    NodeDefinition,
    EdgeDefinition,
    ValidationResult,
    Transform,
  } from './types';
  import type { PortDragDetail, PortDropDetail } from './node-port-types';
  import { validateGraph } from './validate';
  import NodeCanvas from './NodeCanvas.svelte';
  import Node from './Node.svelte';
  import NodeEdge from './NodeEdge.svelte';

  interface GraphEditorProps {
    schema: GraphSchema;
    readonly?: boolean;
    snapToGrid?: boolean;
    gridSize?: number;
    nodeContent?: Snippet<[NodeInstance, NodeDefinition]>;
    onchange?: (schema: GraphSchema) => void;
    onselect?: (nodeIds: string[]) => void;
    onvalidate?: (result: ValidationResult) => void;
  }

  let {
    schema,
    readonly = false,
    snapToGrid = false,
    gridSize = 20,
    nodeContent,
    onchange,
    onselect,
    onvalidate,
  }: GraphEditorProps = $props();

  // --- Interaction state ---
  let selectedNodeIds = $state<Set<string>>(new Set());
  let selectedEdgeIds = $state<Set<string>>(new Set());
  let transform = $state<Transform>({ x: 0, y: 0, scale: 1 });

  // Edge creation state
  let creatingEdge = $state<{
    sourceNodeId: string;
    sourcePortId: string;
    sourceType: string;
    sourcePosition: { x: number; y: number };
    cursorPosition: { x: number; y: number };
  } | null>(null);

  // --- Derived: port positions for edge rendering ---
  const HEADER_HEIGHT = 32;
  const PORT_SPACING = 24;
  const PORT_PADDING = 12;

  function getPortPosition(
    node: NodeInstance,
    def: NodeDefinition,
    portId: string
  ): { x: number; y: number } | undefined {
    const port = def.ports.find(p => p.id === portId);
    if (!port) return undefined;

    const sameDirPorts = def.ports.filter(p => p.direction === port.direction);
    const idx = sameDirPorts.findIndex(p => p.id === portId);

    const x = port.direction === 'input' ? node.position.x : node.position.x + node.size.width;
    let y: number;
    if (sameDirPorts.length === 1) {
      y = node.position.y + HEADER_HEIGHT + PORT_PADDING + PORT_SPACING / 2;
    } else {
      y = node.position.y + HEADER_HEIGHT + PORT_PADDING + idx * PORT_SPACING;
    }

    return { x, y };
  }

  // Build a lookup: nodeId -> NodeDefinition
  let definitionMap = $derived(
    new Map(schema.nodeDefinitions.map(d => [d.kind, d]))
  );

  function getDefinition(kind: string): NodeDefinition | undefined {
    return definitionMap.get(kind);
  }

  // --- Edge position pairs ---
  interface EdgeWithPositions {
    edge: EdgeDefinition;
    source: { x: number; y: number };
    target: { x: number; y: number };
  }

  let edgesWithPositions = $derived.by((): EdgeWithPositions[] => {
    const result: EdgeWithPositions[] = [];
    for (const edge of schema.edges) {
      const sourceNode = schema.nodes.find(n => n.id === edge.sourceNodeId);
      const targetNode = schema.nodes.find(n => n.id === edge.targetNodeId);
      if (!sourceNode || !targetNode) continue;

      const sourceDef = getDefinition(sourceNode.kind);
      const targetDef = getDefinition(targetNode.kind);
      if (!sourceDef || !targetDef) continue;

      const source = getPortPosition(sourceNode, sourceDef, edge.sourcePortId);
      const target = getPortPosition(targetNode, targetDef, edge.targetPortId);
      if (!source || !target) continue;

      result.push({ edge, source, target });
    }
    return result;
  });

  // --- Emit helpers ---
  function emitChange(newSchema: GraphSchema) {
    const result = validateGraph(newSchema);
    onvalidate?.(result);
    onchange?.(newSchema);
  }

  function emitSelection() {
    onselect?.([...selectedNodeIds]);
  }

  // --- Snap helper ---
  function snap(val: number): number {
    if (!snapToGrid) return val;
    return Math.round(val / gridSize) * gridSize;
  }

  // --- Node interaction handlers ---
  function handleNodeMove(id: string, position: { x: number; y: number }) {
    if (readonly) return;
    const snapped = { x: snap(position.x), y: snap(position.y) };
    const newNodes = schema.nodes.map(n =>
      n.id === id ? { ...n, position: snapped } : n
    );
    emitChange({ ...schema, nodes: newNodes });
  }

  function handleNodeSelect(id: string) {
    selectedEdgeIds = new Set();
    selectedNodeIds = new Set([id]);
    emitSelection();
  }

  // --- Edge interaction handlers ---
  function handleEdgeSelect(edgeId: string) {
    selectedNodeIds = new Set();
    selectedEdgeIds = new Set([edgeId]);
    emitSelection();
  }

  function handleEdgeDelete(edgeId: string) {
    if (readonly) return;
    const newEdges = schema.edges.filter(e => e.id !== edgeId);
    emitChange({ ...schema, edges: newEdges });
  }

  // --- Port drag (edge creation) ---
  function handlePortDragStart(detail: PortDragDetail) {
    if (readonly) return;
    if (detail.direction !== 'output') return;
    creatingEdge = {
      sourceNodeId: detail.nodeId,
      sourcePortId: detail.portId,
      sourceType: detail.type,
      sourcePosition: detail.position,
      cursorPosition: detail.position,
    };
  }

  function handlePortDrop(detail: PortDropDetail) {
    if (!creatingEdge || readonly) return;
    if (detail.direction !== 'input') {
      creatingEdge = null;
      return;
    }
    if (detail.type !== creatingEdge.sourceType) {
      creatingEdge = null;
      return;
    }
    if (detail.nodeId === creatingEdge.sourceNodeId) {
      creatingEdge = null;
      return;
    }

    const newEdge: EdgeDefinition = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceNodeId: creatingEdge.sourceNodeId,
      sourcePortId: creatingEdge.sourcePortId,
      targetNodeId: detail.nodeId,
      targetPortId: detail.portId,
      metadata: {},
    };

    creatingEdge = null;
    emitChange({ ...schema, edges: [...schema.edges, newEdge] });
  }

  // --- Canvas pointer tracking for rubber-band edge ---
  function handleCanvasPointerMove(e: PointerEvent) {
    if (!creatingEdge) return;
    const svg = (e.currentTarget as Element)?.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    creatingEdge = {
      ...creatingEdge,
      cursorPosition: {
        x: (e.clientX - rect.left - transform.x) / transform.scale,
        y: (e.clientY - rect.top - transform.y) / transform.scale,
      },
    };
  }

  function handleCanvasPointerUp() {
    creatingEdge = null;
  }

  function handleCanvasClick() {
    selectedNodeIds = new Set();
    selectedEdgeIds = new Set();
    emitSelection();
  }

  // --- Keyboard shortcuts ---
  function handleKeydown(e: KeyboardEvent) {
    if (readonly) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedNodeIds.size > 0) {
        const newNodes = schema.nodes.filter(n => !selectedNodeIds.has(n.id));
        const newEdges = schema.edges.filter(
          e => !selectedNodeIds.has(e.sourceNodeId) && !selectedNodeIds.has(e.targetNodeId)
        );
        selectedNodeIds = new Set();
        emitChange({ ...schema, nodes: newNodes, edges: newEdges });
      } else if (selectedEdgeIds.size > 0) {
        const newEdges = schema.edges.filter(e => !selectedEdgeIds.has(e.id));
        selectedEdgeIds = new Set();
        emitChange({ ...schema, edges: newEdges });
      }
    }

    if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      selectedNodeIds = new Set(schema.nodes.map(n => n.id));
      emitSelection();
    }

    if (e.key === 'Escape') {
      selectedNodeIds = new Set();
      selectedEdgeIds = new Set();
      creatingEdge = null;
      emitSelection();
    }
  }

  function handleTransform(t: Transform) {
    transform = t;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="n0-graph-editor"
  onkeydown={handleKeydown}
  onpointermove={handleCanvasPointerMove}
  onpointerup={handleCanvasPointerUp}
  tabindex="0"
  role="application"
  aria-label="Graph editor"
>
  <NodeCanvas
    {transform}
    ontransform={handleTransform}
    gridVisible={true}
  >
    {#snippet children()}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <g onclick={handleCanvasClick}>
        <!-- Edges layer (behind nodes) -->
        {#each edgesWithPositions as { edge, source, target } (edge.id)}
          <NodeEdge
            {edge}
            sourcePosition={source}
            targetPosition={target}
            selected={selectedEdgeIds.has(edge.id)}
            onselect={handleEdgeSelect}
            ondelete={handleEdgeDelete}
          />
        {/each}

        <!-- Rubber-band edge during creation -->
        {#if creatingEdge}
          <NodeEdge
            sourcePosition={creatingEdge.sourcePosition}
            targetPosition={creatingEdge.cursorPosition}
            creating={true}
          />
        {/if}

        <!-- Nodes layer -->
        {#each schema.nodes as node (node.id)}
          {@const def = getDefinition(node.kind)}
          {#if def}
            <Node
              {node}
              definition={def}
              selected={selectedNodeIds.has(node.id)}
              onmove={handleNodeMove}
              onselect={handleNodeSelect}
              onportdragstart={handlePortDragStart}
              onportdrop={handlePortDrop}
            >
              {#snippet children()}
                {#if nodeContent}
                  {@render nodeContent(node, def)}
                {/if}
              {/snippet}
            </Node>
          {/if}
        {/each}
      </g>
    {/snippet}
  </NodeCanvas>
</div>

<style>
  .n0-graph-editor {
    width: 100%;
    height: 100%;
    position: relative;
    outline: none;
    overflow: hidden;
  }
</style>
