<script lang="ts">
  import type { TimelineEntry } from './types';

  interface TimelineComponentProps {
    entries: TimelineEntry[];
    orientation?: 'horizontal' | 'vertical';
    'aria-label'?: string;
  }

  let {
    entries,
    orientation = 'vertical',
    'aria-label': ariaLabel = 'Timeline',
  }: TimelineComponentProps = $props();

  const DOT_RADIUS = 6;
  const VERTICAL_SPACING = 80;
  const HORIZONTAL_SPACING = 160;
  const PADDING = 24;

  let svgWidth = $derived(
    orientation === 'horizontal'
      ? PADDING * 2 + entries.length * HORIZONTAL_SPACING
      : 320
  );

  let svgHeight = $derived(
    orientation === 'vertical'
      ? PADDING * 2 + entries.length * VERTICAL_SPACING
      : 120
  );
</script>

<svg
  class="d0-timeline"
  class:horizontal={orientation === 'horizontal'}
  viewBox="0 0 {svgWidth} {svgHeight}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={ariaLabel}
>
  <!-- Connecting line -->
  {#if entries.length > 1}
    {#if orientation === 'vertical'}
      <line
        class="d0-timeline-line"
        x1={PADDING + DOT_RADIUS}
        y1={PADDING}
        x2={PADDING + DOT_RADIUS}
        y2={PADDING + (entries.length - 1) * VERTICAL_SPACING}
      />
    {:else}
      <line
        class="d0-timeline-line"
        x1={PADDING}
        y1={PADDING + DOT_RADIUS + 20}
        x2={PADDING + (entries.length - 1) * HORIZONTAL_SPACING}
        y2={PADDING + DOT_RADIUS + 20}
      />
    {/if}
  {/if}

  <!-- Entries -->
  {#each entries as entry, i (entry.id)}
    {#if orientation === 'vertical'}
      {@const cy = PADDING + i * VERTICAL_SPACING}
      {@const cx = PADDING + DOT_RADIUS}

      <!-- Dot -->
      <circle
        class="d0-timeline-dot"
        cx={cx}
        cy={cy}
        r={DOT_RADIUS}
        fill={entry.color ?? undefined}
      >
        <title>{entry.timestamp}</title>
      </circle>

      <!-- Label -->
      <text
        class="d0-timeline-label"
        x={cx + DOT_RADIUS + 12}
        y={cy - 4}
        dominant-baseline="auto"
      >
        {entry.label}
      </text>

      <!-- Timestamp -->
      <text
        class="d0-timeline-timestamp"
        x={cx + DOT_RADIUS + 12}
        y={cy + 14}
        dominant-baseline="auto"
      >
        {entry.timestamp}
      </text>

      <!-- Description -->
      {#if entry.description}
        <text
          class="d0-timeline-desc"
          x={cx + DOT_RADIUS + 12}
          y={cy + 30}
          dominant-baseline="auto"
        >
          {entry.description}
        </text>
      {/if}
    {:else}
      {@const cx = PADDING + i * HORIZONTAL_SPACING}
      {@const cy = PADDING + DOT_RADIUS + 20}

      <!-- Dot -->
      <circle
        class="d0-timeline-dot"
        cx={cx}
        cy={cy}
        r={DOT_RADIUS}
        fill={entry.color ?? undefined}
      >
        <title>{entry.timestamp}</title>
      </circle>

      <!-- Label (above line) -->
      <text
        class="d0-timeline-label"
        x={cx}
        y={cy - DOT_RADIUS - 8}
        text-anchor="middle"
      >
        {entry.label}
      </text>

      <!-- Timestamp (below line) -->
      <text
        class="d0-timeline-timestamp"
        x={cx}
        y={cy + DOT_RADIUS + 18}
        text-anchor="middle"
      >
        {entry.timestamp}
      </text>
    {/if}
  {/each}
</svg>

<style>
  .d0-timeline {
    display: block;
    width: 100%;
    height: auto;
  }

  .d0-timeline-line {
    stroke: var(--d0-timeline-line, rgba(184, 115, 51, 0.3));
    stroke-width: 2;
  }

  .d0-timeline-dot {
    fill: var(--d0-timeline-dot, #b87333);
    transition: r 150ms ease;
  }

  .d0-timeline-dot:hover {
    r: 8;
  }

  .d0-timeline-label {
    fill: var(--color-text-primary, #e8e0d0);
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 13px;
    font-weight: 500;
  }

  .d0-timeline-timestamp {
    fill: var(--d0-chart-text, #a09880);
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 10px;
  }

  .d0-timeline-desc {
    fill: var(--d0-chart-text, #a09880);
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 11px;
  }
</style>
