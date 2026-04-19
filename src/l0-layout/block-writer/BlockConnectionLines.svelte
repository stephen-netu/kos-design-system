<script lang="ts">
  import type { BlockConnection } from './block-writer-types.js';
  import type { ZoneRect } from '../../spatial/zone-tiler-types.js';

  interface Props {
    connections: BlockConnection[];
    zones: ZoneRect[];
    focusedBlockId?: string;
  }

  let { connections, zones, focusedBlockId = '' }: Props = $props();

  interface LineSegment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    isActive: boolean;
    label?: string;
  }

  const lines = $derived.by((): LineSegment[] => {
    const zoneMap = new Map(zones.map(z => [z.id, z]));
    const result: LineSegment[] = [];

    for (const conn of connections) {
      const from = zoneMap.get(conn.fromId);
      const to = zoneMap.get(conn.toId);
      if (!from || !to) continue;

      result.push({
        x1: from.x + from.width / 2,
        y1: from.y + from.height,
        x2: to.x + to.width / 2,
        y2: to.y,
        isActive: conn.fromId === focusedBlockId || conn.toId === focusedBlockId,
        label: conn.label,
      });
    }

    return result;
  });
</script>

{#if lines.length > 0}
  <svg class="ds-block-connections" xmlns="http://www.w3.org/2000/svg">
    {#each lines as line (`${line.x1},${line.y1}-${line.x2},${line.y2}`)}
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        class:ds-block-conn-active={line.isActive}
        class="ds-block-conn-line"
      />
      {#if line.label}
        <text
          x={(line.x1 + line.x2) / 2}
          y={(line.y1 + line.y2) / 2 - 4}
          class="ds-block-conn-label"
        >{line.label}</text>
      {/if}
    {/each}
  </svg>
{/if}

<style>
  .ds-block-connections {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
  }

  .ds-block-conn-line {
    stroke: var(--color-accent, #b87333);
    stroke-opacity: 0.35;
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
    transition: stroke-opacity 0.15s ease, stroke-width 0.15s ease;
  }

  .ds-block-conn-active {
    stroke-opacity: 0.7;
    stroke-width: 2;
  }

  .ds-block-conn-label {
    fill: var(--color-text-muted, #a09880);
    font-size: 10px;
    font-family: var(--font-mono, monospace);
    text-anchor: middle;
    pointer-events: none;
  }
</style>
