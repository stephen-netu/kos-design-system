<script lang="ts">
  import type { DataSeries } from './types';

  interface BarChartProps {
    series: DataSeries[];
    width?: number;
    height?: number;
    orientation?: 'vertical' | 'horizontal';
    showLabels?: boolean;
    showGrid?: boolean;
  }

  let {
    series,
    width = 400,
    height = 300,
    orientation = 'vertical',
    showLabels = true,
    showGrid = true,
  }: BarChartProps = $props();

  const PADDING = { top: 16, right: 16, bottom: 32, left: 48 };
  const GRID_LINES = 5;

  let allPoints = $derived(series.flatMap((s) => s.data));

  let maxValue = $derived(
    allPoints.length > 0 ? Math.max(...allPoints.map((p) => p.value)) : 0
  );

  let chartWidth = $derived(width - PADDING.left - PADDING.right);
  let chartHeight = $derived(height - PADDING.top - PADDING.bottom);

  let gridValues = $derived(
    Array.from({ length: GRID_LINES + 1 }, (_, i) =>
      maxValue > 0 ? (maxValue / GRID_LINES) * i : 0
    )
  );

  /** Flatten all points across series for bar layout. */
  let flatBars = $derived.by(() => {
    const bars: Array<{
      label: string;
      value: number;
      color: string | undefined;
      seriesIndex: number;
      pointIndex: number;
    }> = [];
    for (let si = 0; si < series.length; si++) {
      const s = series[si];
      const seriesColor = s.color ?? undefined;
      for (let pi = 0; pi < s.data.length; pi++) {
        const pt = s.data[pi];
        bars.push({
          label: pt.label,
          value: pt.value,
          color: pt.color ?? seriesColor,
          seriesIndex: si,
          pointIndex: pi,
        });
      }
    }
    return bars;
  });

  let barGap = $derived(flatBars.length > 0
    ? (orientation === 'vertical'
        ? chartWidth / flatBars.length
        : chartHeight / flatBars.length)
    : 0
  );

  let barWidth = $derived(Math.max(barGap * 0.7, 2));

  function barGeometry(index: number, value: number) {
    const ratio = maxValue > 0 ? value / maxValue : 0;
    if (orientation === 'vertical') {
      const barH = chartHeight * ratio;
      return {
        x: PADDING.left + index * barGap + (barGap - barWidth) / 2,
        y: PADDING.top + chartHeight - barH,
        w: barWidth,
        h: barH,
      };
    }
    const barW = chartWidth * ratio;
    return {
      x: PADDING.left,
      y: PADDING.top + index * barGap + (barGap - barWidth) / 2,
      w: barW,
      h: barWidth,
    };
  }
</script>

<svg
  class="d0-bar-chart"
  viewBox="0 0 {width} {height}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="Bar chart"
>
  <!-- Background -->
  <rect
    class="d0-chart-bg"
    x={0}
    y={0}
    width={width}
    height={height}
    rx={6}
    ry={6}
  />

  <!-- Grid lines -->
  {#if showGrid}
    {#each gridValues as gv, i}
      {#if orientation === 'vertical'}
        {@const gy = PADDING.top + chartHeight - (maxValue > 0 ? (gv / maxValue) * chartHeight : 0)}
        <line
          class="d0-grid-line"
          x1={PADDING.left}
          y1={gy}
          x2={PADDING.left + chartWidth}
          y2={gy}
        />
        {#if showLabels}
          <text
            class="d0-axis-label"
            x={PADDING.left - 6}
            y={gy + 4}
            text-anchor="end"
          >
            {Math.round(gv)}
          </text>
        {/if}
      {:else}
        {@const gx = PADDING.left + (maxValue > 0 ? (gv / maxValue) * chartWidth : 0)}
        <line
          class="d0-grid-line"
          x1={gx}
          y1={PADDING.top}
          x2={gx}
          y2={PADDING.top + chartHeight}
        />
        {#if showLabels}
          <text
            class="d0-axis-label"
            x={gx}
            y={PADDING.top + chartHeight + 16}
            text-anchor="middle"
          >
            {Math.round(gv)}
          </text>
        {/if}
      {/if}
    {/each}
  {/if}

  <!-- Bars -->
  {#each flatBars as bar, idx (idx)}
    {@const geo = barGeometry(idx, bar.value)}
    <rect
      class="d0-bar"
      x={geo.x}
      y={geo.y}
      width={geo.w}
      height={geo.h}
      fill={bar.color ?? undefined}
      rx={2}
      ry={2}
    >
      <title>{bar.label}: {bar.value}</title>
    </rect>

    <!-- Bar labels -->
    {#if showLabels}
      {#if orientation === 'vertical'}
        <text
          class="d0-bar-label"
          x={geo.x + geo.w / 2}
          y={PADDING.top + chartHeight + 16}
          text-anchor="middle"
        >
          {bar.label}
        </text>
      {:else}
        <text
          class="d0-bar-label"
          x={PADDING.left - 6}
          y={geo.y + geo.h / 2 + 4}
          text-anchor="end"
        >
          {bar.label}
        </text>
      {/if}
    {/if}
  {/each}
</svg>

<style>
  .d0-bar-chart {
    display: block;
    width: 100%;
    height: auto;
  }

  .d0-chart-bg {
    fill: var(--d0-chart-bg, #222);
  }

  .d0-grid-line {
    stroke: var(--d0-chart-grid, rgba(184, 115, 51, 0.1));
    stroke-width: 1;
  }

  .d0-axis-label {
    fill: var(--d0-chart-text, #a09880);
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 10px;
  }

  .d0-bar {
    fill: var(--d0-chart-accent, #b87333);
    transition: opacity 150ms ease;
  }

  .d0-bar:hover {
    opacity: 0.8;
  }

  .d0-bar-label {
    fill: var(--d0-chart-text, #a09880);
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 10px;
  }
</style>
