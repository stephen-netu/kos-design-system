<script lang="ts">
  import type { MetricCardProps } from './types';

  let {
    label,
    value,
    unit,
    trend,
    trendValue,
    size = 'default',
  }: MetricCardProps = $props();

  let trendArrow = $derived(
    trend === 'up' ? '\u25B2' : trend === 'down' ? '\u25BC' : trend === 'flat' ? '\u2192' : ''
  );
</script>

{#if size === 'inline'}
  <span class="d0-metric-inline">
    <span class="d0-metric-inline__label">{label}</span>
    <span class="d0-metric-inline__value">{value}</span>
    {#if unit}<span class="d0-metric-inline__unit">{unit}</span>{/if}
    {#if trend && trendValue}
      <span
        class="d0-metric-inline__trend"
        class:trend-up={trend === 'up'}
        class:trend-down={trend === 'down'}
        class:trend-flat={trend === 'flat'}
      >{trendArrow} {trendValue}</span>
    {/if}
  </span>
{:else}
  <div class="d0-metric-card">
    <span class="d0-metric-label">{label}</span>
    <div class="d0-metric-value-row">
      <span class="d0-metric-value">{value}</span>
      {#if unit}
        <span class="d0-metric-unit">{unit}</span>
      {/if}
    </div>
    {#if trend}
      <span
        class="d0-metric-trend"
        class:trend-up={trend === 'up'}
        class:trend-down={trend === 'down'}
        class:trend-flat={trend === 'flat'}
        aria-label={trend === 'up' ? 'trending up' : trend === 'down' ? 'trending down' : 'stable'}
      >
        {trendArrow}
        {#if trendValue}
          <span class="d0-metric-trend-value">{trendValue}</span>
        {/if}
      </span>
    {/if}
  </div>
{/if}

<style>
  .d0-metric-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    background: var(--d0-chart-bg, #222);
    border: 1px solid var(--color-accent-subtle, rgba(184, 115, 51, 0.15));
    border-radius: var(--radius-lg, 8px);
    min-width: 120px;
  }

  .d0-metric-label {
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 11px;
    font-weight: 500;
    color: var(--d0-chart-text, #a09880);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .d0-metric-value-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .d0-metric-value {
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 28px;
    font-weight: 600;
    color: var(--color-text-primary, #e8e0d0);
    line-height: 1;
  }

  .d0-metric-unit {
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 13px;
    color: var(--d0-chart-text, #a09880);
  }

  .d0-metric-trend {
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .d0-metric-trend.trend-up {
    color: var(--d0-metric-trend-up, #27ae60);
  }

  .d0-metric-trend.trend-down {
    color: var(--d0-metric-trend-down, #c0392b);
  }

  .d0-metric-trend.trend-flat {
    color: var(--d0-chart-text, #a09880);
  }

  .d0-metric-trend-value {
    font-size: 12px;
  }

  /* ── Inline variant ───────────────────────────────────────────────────── */

  .d0-metric-inline {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .d0-metric-inline__label {
    font-size: 10px;
    font-weight: 500;
    color: var(--color-text-muted, #5a5245);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .d0-metric-inline__value {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #f2efe9);
    line-height: 1;
  }

  .d0-metric-inline__unit {
    font-size: 11px;
    color: var(--color-text-secondary, #a09880);
  }

  .d0-metric-inline__trend {
    font-size: 11px;
  }

  .d0-metric-inline__trend.trend-up   { color: var(--color-success, #27ae60); }
  .d0-metric-inline__trend.trend-down { color: var(--color-error, #c0392b); }
  .d0-metric-inline__trend.trend-flat { color: var(--color-text-muted, #5a5245); }
</style>
