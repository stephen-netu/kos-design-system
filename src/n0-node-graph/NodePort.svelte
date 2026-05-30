<script lang="ts" module>
  import type { PortDirection, PortDefinition } from './types';
  import type { PortDragDetail, PortDropDetail } from './node-port-types';

  // Re-export for backward compatibility
  export type { PortDragDetail, PortDropDetail } from './node-port-types';
</script>

<script lang="ts">
  interface NodePortProps {
    nodeId: string;
    port: PortDefinition;
    position: { x: number; y: number };
    connected: boolean;
    onportdragstart?: (detail: PortDragDetail) => void;
    onportdrop?: (detail: PortDropDetail) => void;
  }

  let {
    nodeId,
    port,
    position,
    connected,
    onportdragstart,
    onportdrop,
  }: NodePortProps = $props();

  let hovering = $state(false);
  let incompatible = $state(false);

  function handlePointerDown(e: PointerEvent) {
    e.stopPropagation();
    onportdragstart?.({
      nodeId,
      portId: port.id,
      direction: port.direction,
      type: port.type,
      position: { x: position.x, y: position.y },
    });
  }

  function handlePointerUp(e: PointerEvent) {
    e.stopPropagation();
    onportdrop?.({
      nodeId,
      portId: port.id,
      direction: port.direction,
      type: port.type,
    });
  }

  function handlePointerEnter() {
    hovering = true;
  }

  function handlePointerLeave() {
    hovering = false;
  }

  let fillColor = $derived(
    incompatible
      ? 'var(--n0-port-color-incompatible)'
      : port.direction === 'input'
        ? 'var(--n0-port-color-input)'
        : 'var(--n0-port-color-output)'
  );

  let stateClass = $derived(
    incompatible
      ? 'incompatible'
      : hovering
        ? 'hovering'
        : connected
          ? 'connected'
          : 'default'
  );
</script>

<circle
  class="n0-port {stateClass}"
  cx={position.x}
  cy={position.y}
  r={6}
  fill={fillColor}
  role="button"
  tabindex="-1"
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerenter={handlePointerEnter}
  onpointerleave={handlePointerLeave}
>
  <title>{port.label} ({port.type})</title>
</circle>

<style>
  .n0-port {
    cursor: crosshair;
    stroke: rgba(0, 0, 0, 0.3);
    stroke-width: 1.5;
    transition: transform 150ms ease, stroke-width 150ms ease;
    transform-origin: var(--cx) var(--cy);
    transform-box: fill-box;
  }

  .n0-port.hovering {
    transform: scale(var(--n0-port-hover-scale, 1.3));
    stroke-width: 2;
  }

  .n0-port.connected {
    stroke: rgba(255, 255, 255, 0.3);
    stroke-width: 2;
  }

  .n0-port.incompatible {
    stroke: var(--n0-port-color-incompatible);
    stroke-width: 2;
    opacity: 0.7;
  }

  .n0-port.default {
    opacity: 0.85;
  }

  .n0-port.default:hover {
    opacity: 1;
  }
</style>
