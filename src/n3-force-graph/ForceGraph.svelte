<script lang="ts">
  // N3 ForceGraph — Canvas 2D force-directed graph wrapper (vasturiano/force-graph)
  // wt-797: Accepts ForceGraphData, renders with health-aware node/edge callbacks
  //
  // S-02: No Math.random in rendering. Pulse tick is deterministic counter.
  // S-05: Force simulation has cooldownTicks + cooldownTime bounds.
  //       Component destroys graph instance on unmount.

  import { onMount, onDestroy } from 'svelte';
  import type { ForceGraphData, ForceGraphNode, ForceGraphLink, HealthNodeConfig, AnimatedEdgeConfig, TooltipPosition } from './types.js';
  import { createHealthNodeRenderer, createHealthNodeAreaPaint, advancePulseTick } from './health-node.js';
  import { createAnimatedEdgeRenderer } from './animated-edge.js';

  // ── Props ────────────────────────────────────────────────────────────────────

  interface Props {
    /** Graph data: nodes + links */
    data: ForceGraphData;
    /** Container width. Default 800. */
    width?: number;
    /** Container height. Default 600. */
    height?: number;
    /** Health node rendering config */
    nodeConfig?: HealthNodeConfig;
    /** Animated edge rendering config */
    edgeConfig?: AnimatedEdgeConfig;
    /** Background color. Default '#1a1a1a'. */
    backgroundColor?: string;
    /** Callback when a node is clicked */
    onNodeClick?: (node: ForceGraphNode) => void;
    /** Callback when a node is hovered (null = hover left) */
    onNodeHover?: (node: ForceGraphNode | null, position: TooltipPosition) => void;
    /** Callback when a link is clicked */
    onLinkClick?: (link: ForceGraphLink) => void;
    /** Force simulation cooldown ticks. Default 300. S-05: bounded. */
    cooldownTicks?: number;
    /** D3 force charge strength. Default -120. */
    chargeStrength?: number;
    /** D3 force link distance. Default 80. */
    linkDistance?: number;
  }

  let {
    data,
    width = 800,
    height = 600,
    nodeConfig,
    edgeConfig,
    backgroundColor = '#1a1a1a',
    onNodeClick,
    onNodeHover,
    onLinkClick,
    cooldownTicks = 300,
    chargeStrength = -120,
    linkDistance = 80,
  }: Props = $props();

  // ── Internal state ──────────────────────────────────────────────────────────

  let container: HTMLDivElement;
  let graph: any = null; // ForceGraph instance (untyped — library uses chainable API)

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  onMount(async () => {
    // Dynamic import: force-graph requires DOM
    const ForceGraphLib = (await import('force-graph')).default;

    // force-graph ships class-style TS types but is actually a factory function
    graph = (ForceGraphLib as unknown as () => (el: HTMLElement) => any)()(container)
      .width(width)
      .height(height)
      .backgroundColor(backgroundColor)
      // Node rendering
      .nodeCanvasObject(createHealthNodeRenderer(nodeConfig))
      .nodeCanvasObjectMode(() => 'replace')
      .nodePointerAreaPaint(createHealthNodeAreaPaint(nodeConfig))
      // Edge rendering
      .linkCanvasObject(createAnimatedEdgeRenderer(edgeConfig))
      .linkCanvasObjectMode(() => 'replace')
      // Link identifiers
      .linkSource('source')
      .linkTarget('target')
      // Force parameters
      .cooldownTicks(cooldownTicks)
      // Interaction
      .onNodeClick((node: ForceGraphNode) => {
        onNodeClick?.(node);
      })
      .onNodeHover((node: ForceGraphNode | null) => {
        // Change cursor
        container.style.cursor = node ? 'pointer' : 'default';
        // Emit hover with position
        if (onNodeHover) {
          const pos: TooltipPosition = node
            ? { x: (node.x ?? 0), y: (node.y ?? 0), visible: true }
            : { x: 0, y: 0, visible: false };
          onNodeHover(node, pos);
        }
      })
      .onLinkClick((link: ForceGraphLink) => onLinkClick?.(link))
      // Drag to pin
      .onNodeDragEnd((node: ForceGraphNode) => {
        node.fx = node.x;
        node.fy = node.y;
      });

    // Configure d3 forces after graph creation
    graph.d3Force('charge')?.strength(chargeStrength);
    graph.d3Force('link')?.distance(linkDistance);

    // Engine tick hook for pulse animation
    graph.onEngineTick(() => advancePulseTick());

    // Initial data
    graph.graphData({
      nodes: data.nodes,
      links: data.links,
    });
  });

  onDestroy(() => {
    if (graph) {
      graph._destructor();
      graph = null;
    }
  });

  // ── Reactive updates ───────────────────────────────────────────────────────

  $effect(() => {
    if (!graph) return;
    graph.graphData({
      nodes: data.nodes,
      links: data.links,
    });
  });

  $effect(() => {
    if (!graph) return;
    graph.width(width).height(height);
  });

  // ── Public API (exposed via bind:this on wrapper) ──────────────────────────

  export function zoomToFit(duration = 400, padding = 40) {
    graph?.zoomToFit(duration, padding);
  }

  export function centerAt(x: number, y: number, duration = 400) {
    graph?.centerAt(x, y, duration);
  }

  export function zoom(factor: number, duration = 400) {
    graph?.zoom(factor, duration);
  }

  export function reheat() {
    graph?.d3ReheatSimulation();
  }
</script>

<div
  bind:this={container}
  class="n3-force-graph"
  style:width="{width}px"
  style:height="{height}px"
></div>

<style>
  .n3-force-graph {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-md, 8px);
  }

  .n3-force-graph :global(canvas) {
    border-radius: var(--radius-md, 8px);
  }
</style>
