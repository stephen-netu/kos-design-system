<script lang="ts">
  import { computeTreemap, formatBytes, TIER_COLORS } from './storage-map-types';
  import type { StorageNode, StorageMapConfig, TreemapCell } from './storage-map-types';

  interface Props {
    nodes: StorageNode[];
    width?: number;
    height?: number;
    config?: StorageMapConfig;
    onnodeclick?: (node: StorageNode) => void;
  }

  let {
    nodes,
    width = 600,
    height = 400,
    config = {},
    onnodeclick,
  }: Props = $props();

  let layout = $derived(computeTreemap(nodes, width, height, config));
  let totalLabel = $derived(formatBytes(layout.totalBytes));

  function tierStyle(cell: TreemapCell): string {
    const c = TIER_COLORS[cell.ownerTier];
    return `left:${cell.x}px;top:${cell.y}px;width:${cell.width}px;height:${cell.height}px;background:${c.fill};border-color:${c.stroke};`;
  }

  function tierClasses(cell: TreemapCell): string {
    return `sm-cell sm-cell--${cell.ownerTier}`;
  }

  function handleClick(cell: TreemapCell) {
    const node = nodes.find((n) => n.path === cell.path);
    if (node && onnodeclick) {
      onnodeclick(node);
    }
  }
</script>

<div class="sm-root" style="width: {width}px; height: {height}px;">
  {#if layout.cells.length === 0}
    <div class="sm-empty">No storage data to display</div>
  {:else}
    <div class="sm-header">
      <span class="sm-total">{totalLabel}</span>
      <div class="sm-legend">
        <span class="sm-legend-item">
          <span class="sm-swatch sm-swatch--kos"></span>
          KOS
        </span>
        <span class="sm-legend-item">
          <span class="sm-swatch sm-swatch--external"></span>
          External
        </span>
        <span class="sm-legend-item">
          <span class="sm-swatch sm-swatch--unknown"></span>
          Unknown
        </span>
      </div>
    </div>
    <div class="sm-canvas">
      {#each layout.cells as cell (cell.path)}
        <div
          class={tierClasses(cell)}
          style={tierStyle(cell)}
          role="button"
          tabindex="0"
          aria-label="{cell.label}: {formatBytes(cell.bytes)}"
          onclick={() => handleClick(cell)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(cell); }}
          title="{cell.path} — {formatBytes(cell.bytes)}"
        >
          {#if cell.width > 60 && cell.height > 30}
            <span class="sm-label">{cell.label}</span>
          {/if}
          {#if cell.width > 80 && cell.height > 44}
            <span class="sm-size">{formatBytes(cell.bytes)}</span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sm-root {
    position: relative;
    background: var(--color-bg-surface, #222);
    border: 1px solid var(--color-accent-subtle, rgba(184, 115, 51, 0.15));
    border-radius: var(--radius-lg, 8px);
    overflow: hidden;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .sm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--color-bg-elevated, #2a2a2a);
    border-bottom: 1px solid var(--color-border-subtle, rgba(184, 115, 51, 0.1));
  }

  .sm-total {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary, #e8e0d0);
  }

  .sm-legend {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: var(--color-text-secondary, #a09880);
  }

  .sm-legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sm-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  .sm-swatch--kos { background: var(--color-accent, #b87333); }
  .sm-swatch--external { background: #a09880; }
  .sm-swatch--unknown { background: #5a5245; }

  .sm-canvas {
    position: relative;
    width: 100%;
    height: calc(100% - 37px);
  }

  .sm-cell {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    cursor: pointer;
    transition: opacity 0.15s ease;
    border: 1px solid transparent;
  }

  .sm-cell:hover {
    opacity: 0.85;
    border-color: var(--color-accent, #b87333);
  }

  .sm-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-primary, #e8e0d0);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90%;
    text-align: center;
  }

  .sm-size {
    font-size: 10px;
    color: var(--color-text-muted, #706858);
  }

  .sm-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-muted, #5a5245);
    font-size: 13px;
  }
</style>
