<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { NodeInstance, NodeDefinition, PortDefinition } from './types';
  import type { PortDragDetail, PortDropDetail } from './node-port-types';
  import NodePort from './NodePort.svelte';

  const HEADER_HEIGHT = 32;
  const PORT_SPACING = 24;
  const PORT_PADDING = 12;

  interface NodeProps {
    node: NodeInstance;
    definition: NodeDefinition;
    selected?: boolean;
    children?: Snippet;
    onmove?: (id: string, position: { x: number; y: number }) => void;
    onselect?: (id: string) => void;
    onportdragstart?: (detail: PortDragDetail) => void;
    onportdrop?: (detail: PortDropDetail) => void;
  }

  let {
    node,
    definition,
    selected = false,
    children,
    onmove,
    onselect,
    onportdragstart,
    onportdrop,
  }: NodeProps = $props();

  // svelte-ignore state_referenced_locally -- intentional: local copy of initial collapsed state
  let collapsed = $state(node.collapsed);
  let dragging = $state(false);
  let dragStart = $state<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);

  let inputPorts = $derived(
    definition.ports.filter((p: PortDefinition) => p.direction === 'input')
  );

  let outputPorts = $derived(
    definition.ports.filter((p: PortDefinition) => p.direction === 'output')
  );

  let bodyHeight = $derived(
    collapsed ? 0 : node.size.height - HEADER_HEIGHT
  );

  let displayHeight = $derived(
    collapsed ? HEADER_HEIGHT : node.size.height
  );

  function portYPosition(index: number, totalPorts: number): number {
    if (totalPorts === 1) {
      return HEADER_HEIGHT + PORT_PADDING + PORT_SPACING / 2;
    }
    return HEADER_HEIGHT + PORT_PADDING + index * PORT_SPACING;
  }

  function handleHeaderPointerDown(e: PointerEvent) {
    if ((e.target as Element)?.closest('.n0-collapse-btn')) return;
    e.stopPropagation();
    dragging = true;
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      nodeX: node.position.x,
      nodeY: node.position.y,
    };
    (e.currentTarget as Element)?.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!dragging || !dragStart) return;
    e.stopPropagation();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    onmove?.(node.id, {
      x: dragStart.nodeX + dx,
      y: dragStart.nodeY + dy,
    });
  }

  function handlePointerUp(e: PointerEvent) {
    if (dragging) {
      dragging = false;
      dragStart = null;
      (e.currentTarget as Element)?.releasePointerCapture?.(e.pointerId);
    }
  }

  function handleClick(e: MouseEvent) {
    if (dragging) return;
    onselect?.(node.id);
  }

  function toggleCollapse(e: MouseEvent) {
    e.stopPropagation();
    collapsed = !collapsed;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<g
  class="n0-node"
  class:selected
  class:dragging
  transform="translate({node.position.x}, {node.position.y})"
  onclick={handleClick}
>
  <!-- Node background -->
  <rect
    class="n0-node-bg"
    width={node.size.width}
    height={displayHeight}
    rx={8}
    ry={8}
  />

  <!-- Header bar -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <rect
    class="n0-node-header"
    width={node.size.width}
    height={HEADER_HEIGHT}
    rx={8}
    ry={8}
    onpointerdown={handleHeaderPointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
  />
  <!-- Square off header bottom corners when not collapsed -->
  {#if !collapsed}
    <rect
      class="n0-node-header"
      x={0}
      y={HEADER_HEIGHT - 8}
      width={node.size.width}
      height={8}
    />
  {/if}

  <!-- Header label -->
  <text
    class="n0-node-label"
    x={28}
    y={HEADER_HEIGHT / 2 + 1}
    dominant-baseline="central"
    onpointerdown={handleHeaderPointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
  >
    {definition.label}
  </text>

  <!-- Collapse toggle -->
  <g
    class="n0-collapse-btn"
    transform="translate(10, {HEADER_HEIGHT / 2})"
    onclick={toggleCollapse}
    role="button"
    tabindex="0"
  >
    <text
      class="n0-collapse-icon"
      text-anchor="middle"
      dominant-baseline="central"
      font-size="10"
    >
      {collapsed ? '\u25B6' : '\u25BC'}
    </text>
  </g>

  <!-- Input ports -->
  {#each inputPorts as port, i (port.id)}
    <NodePort
      nodeId={node.id}
      {port}
      position={{ x: 0, y: portYPosition(i, inputPorts.length) }}
      connected={false}
      {onportdragstart}
      {onportdrop}
    />
  {/each}

  <!-- Output ports -->
  {#each outputPorts as port, i (port.id)}
    <NodePort
      nodeId={node.id}
      {port}
      position={{ x: node.size.width, y: portYPosition(i, outputPorts.length) }}
      connected={false}
      {onportdragstart}
      {onportdrop}
    />
  {/each}

  <!-- Body content via foreignObject -->
  {#if !collapsed && children}
    <foreignObject
      x={0}
      y={HEADER_HEIGHT}
      width={node.size.width}
      height={bodyHeight}
    >
      <div class="n0-node-body" xmlns="http://www.w3.org/1999/xhtml">
        {@render children()}
      </div>
    </foreignObject>
  {/if}
</g>

<style>
  .n0-node {
    cursor: default;
  }

  .n0-node.dragging {
    cursor: grabbing;
  }

  .n0-node-bg {
    fill: var(--n0-node-bg, #222);
    stroke: var(--n0-node-border, rgba(184, 115, 51, 0.2));
    stroke-width: 1.5;
    transition: stroke 150ms ease;
  }

  .n0-node.selected .n0-node-bg {
    stroke: var(--n0-node-border-selected, #b87333);
    stroke-width: 2;
  }

  .n0-node-header {
    fill: var(--n0-node-header-bg, rgba(184, 115, 51, 0.1));
    cursor: grab;
  }

  .n0-node.dragging .n0-node-header {
    cursor: grabbing;
  }

  .n0-node-label {
    fill: var(--color-text, #e8e0d0);
    font-family: system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    pointer-events: none;
    user-select: none;
  }

  .n0-collapse-btn {
    cursor: pointer;
  }

  .n0-collapse-icon {
    fill: var(--color-text-muted, #a09880);
  }

  .n0-node-body {
    overflow: hidden;
    padding: 8px;
    color: var(--color-text, #e8e0d0);
    font-family: system-ui, sans-serif;
    font-size: 13px;
  }
</style>
