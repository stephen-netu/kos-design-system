<script lang="ts">
  interface SparkLineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
    'aria-label'?: string;
  }

  let {
    data,
    width = 120,
    height = 32,
    color,
    strokeWidth = 2,
    'aria-label': ariaLabel = 'Sparkline',
  }: SparkLineProps = $props();

  let pathD = $derived.by(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = strokeWidth;
    const drawH = height - padY * 2;
    const stepX = width / (data.length - 1);

    return data
      .map((v, i) => {
        const x = i * stepX;
        const y = padY + drawH - ((v - min) / range) * drawH;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  });
</script>

<svg
  class="d0-sparkline"
  viewBox="0 0 {width} {height}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={ariaLabel}
>
  <path
    class="d0-sparkline-path"
    d={pathD}
    fill="none"
    stroke={color ?? undefined}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>

<style>
  .d0-sparkline {
    display: inline-block;
    vertical-align: middle;
  }

  .d0-sparkline-path {
    stroke: var(--d0-chart-accent, #b87333);
  }
</style>
