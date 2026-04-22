<script lang="ts" module>
  /**
   * ConnectionHealth — Network connection quality indicator with latency graph
   * 
   * A generalized version of NNJAS ConnectionQuality for the LEAP design system.
   * Displays real-time connection metrics with a historical latency graph.
   * 
   * @example
   * <ConnectionHealth 
   *   metrics={qualityMetrics}
   *   showGraph={true}
   *   onRetry={handleReconnect}
   * />
   */
  export interface QualityMetrics {
    latency: number | null;
    jitter: number | null;
    lossRate: number;
    quality: QualityLevel;
    history: QualitySample[];
  }

  export interface QualitySample {
    timestamp: number;
    latency: number | null;
    lost: boolean;
  }

  export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

  export function getQualityColor(quality: QualityLevel): string {
    switch (quality) {
      case 'excellent': return 'var(--color-success, #27ae60)';
      case 'good': return 'var(--color-success, #27ae60)';
      case 'fair': return 'var(--color-warning, #f39c12)';
      case 'poor': return 'var(--color-error, #c0392b)';
      case 'disconnected': return 'var(--color-text-muted, #666)';
    }
  }

  export function getQualityLabel(quality: QualityLevel): string {
    switch (quality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      case 'disconnected': return 'Disconnected';
    }
  }
</script>

<script lang="ts">
  interface Props {
    metrics: QualityMetrics | null;
    showGraph?: boolean;
    expanded?: boolean;
    onRetry?: () => void;
    onToggleExpand?: () => void;
    class?: string;
  }

  let { 
    metrics, 
    showGraph = true, 
    expanded = false,
    onRetry,
    onToggleExpand,
    class: className = ''
  }: Props = $props();

  const GRAPH_WIDTH = 120;
  const GRAPH_HEIGHT = 40;
  const GRAPH_POINTS = 12;

  let qualityColor = $derived(metrics ? getQualityColor(metrics.quality) : 'var(--color-text-muted)');
  let qualityLabel = $derived(metrics ? getQualityLabel(metrics.quality) : 'Unknown');

  function generateGraphPath(history: QualitySample[]): string {
    if (history.length === 0) return '';

    const recent = history.slice(-GRAPH_POINTS);
    const maxLatency = Math.max(500, ...recent.filter(s => !s.lost).map(s => s.latency || 0));
    const stepX = GRAPH_WIDTH / (GRAPH_POINTS - 1);

    return recent
      .map((sample, i) => {
        const x = i * stepX;
        if (sample.lost) {
          return `M${x},${GRAPH_HEIGHT - 2} L${x + 2},${GRAPH_HEIGHT - 2}`;
        }
        const y = GRAPH_HEIGHT - ((sample.latency || 0) / maxLatency) * (GRAPH_HEIGHT - 4) + 2;
        return `${i === 0 ? 'M' : 'L'}${x},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function generateLossPath(history: QualitySample[]): string {
    if (history.length === 0) return '';

    const recent = history.slice(-GRAPH_POINTS);
    const stepX = GRAPH_WIDTH / (GRAPH_POINTS - 1);

    return recent
      .map((sample, i) => {
        if (!sample.lost) return '';
        const x = i * stepX;
        return `M${x},0 L${x + 4},0 L${x + 4},${GRAPH_HEIGHT} L${x},${GRAPH_HEIGHT} Z`;
      })
      .filter(Boolean)
      .join(' ');
  }

  function formatLatency(latency: number | null): string {
    if (latency === null) return '—';
    return `${Math.round(latency)}ms`;
  }

  function formatJitter(jitter: number | null): string {
    if (jitter === null) return '—';
    return `±${Math.round(jitter)}ms`;
  }

  function handleRetry() {
    onRetry?.();
  }

  function handleToggle() {
    onToggleExpand?.();
  }
</script>

<div class="connection-health {className}" class:expanded>
  <!-- Header / Compact View -->
  <button 
    class="health-header" 
    onclick={handleToggle}
    type="button"
    aria-expanded={expanded}
  >
    <span class="health-indicator" style="background-color: {qualityColor}"></span>
    <span class="health-label">{qualityLabel}</span>
    
    {#if metrics && !expanded}
      <span class="health-latency">{formatLatency(metrics.latency)}</span>
    {/if}

    {#if showGraph && metrics?.history.length}
      <svg 
        class="health-sparkline" 
        viewBox="0 0 {GRAPH_WIDTH} {GRAPH_HEIGHT}" 
        width="60" 
        height="20"
      >
        <path 
          d={generateLossPath(metrics.history)} 
          fill="var(--color-error, #c0392b)" 
          opacity="0.3"
        />
        <path 
          d={generateGraphPath(metrics.history)} 
          fill="none" 
          stroke={qualityColor}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {/if}

    <span class="expand-icon" aria-hidden="true">
      {expanded ? '▼' : '▶'}
    </span>
  </button>

  <!-- Expanded Details -->
  {#if expanded && metrics}
    <div class="health-details">
      <div class="metrics-grid">
        <div class="metric">
          <span class="metric-value" style="color: {qualityColor}">
            {formatLatency(metrics.latency)}
          </span>
          <span class="metric-label">Latency</span>
        </div>
        <div class="metric">
          <span class="metric-value">{formatJitter(metrics.jitter)}</span>
          <span class="metric-label">Jitter</span>
        </div>
        <div class="metric">
          <span class="metric-value" class:has-loss={metrics.lossRate > 0}>
            {Math.round(metrics.lossRate * 100)}%
          </span>
          <span class="metric-label">Loss</span>
        </div>
      </div>

      {#if showGraph && metrics.history.length > 0}
        <div class="graph-container">
          <svg 
            class="health-graph" 
            viewBox="0 0 {GRAPH_WIDTH} {GRAPH_HEIGHT}" 
            width="100%" 
            height="{GRAPH_HEIGHT}px"
          >
            <defs>
              <linearGradient id="graph-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color={qualityColor} stop-opacity="0.3"/>
                <stop offset="100%" stop-color={qualityColor} stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path 
              d={generateLossPath(metrics.history)} 
              fill="var(--color-error, #c0392b)" 
              opacity="0.2"
            />
            <path 
              d={generateGraphPath(metrics.history)} 
              fill="none" 
              stroke={qualityColor}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="graph-label">Last 60s</span>
        </div>
      {/if}

      {#if metrics.quality === 'poor' || metrics.quality === 'disconnected'}
        <button class="retry-button" onclick={handleRetry} type="button">
          Retry Connection
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .connection-health {
    background: var(--color-bg-panel, #222);
    border: 1px solid var(--color-border-subtle, rgba(255,255,255,0.06));
    border-radius: var(--radius-md, 4px);
    overflow: hidden;
  }

  .health-header {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    width: 100%;
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
    background: transparent;
    border: none;
    color: var(--color-text-secondary, #888);
    font-size: var(--text-sm, 0.875rem);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .health-header:hover {
    background: var(--color-bg-hover, rgba(255,255,255,0.03));
  }

  .health-indicator {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-full, 9999px);
    flex-shrink: 0;
  }

  .health-label {
    font-weight: 500;
    flex: 1;
    text-align: left;
  }

  .health-latency {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs, 0.75rem);
    color: var(--color-text-muted, #666);
  }

  .health-sparkline {
    flex-shrink: 0;
  }

  .expand-icon {
    font-size: 10px;
    color: var(--color-text-muted, #666);
  }

  .health-details {
    padding: var(--space-3, 0.75rem);
    border-top: 1px solid var(--color-border-subtle, rgba(255,255,255,0.06));
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3, 0.75rem);
    margin-bottom: var(--space-3, 0.75rem);
  }

  .metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1, 0.25rem);
  }

  .metric-value {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-lg, 1.125rem);
    font-weight: 600;
    color: var(--color-text-primary, #f2efe9);
  }

  .metric-value.has-loss {
    color: var(--color-error, #c0392b);
  }

  .metric-label {
    font-size: var(--text-xs, 0.75rem);
    color: var(--color-text-muted, #666);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .graph-container {
    position: relative;
    background: var(--color-bg-canvas, #1a1a1a);
    border-radius: var(--radius-sm, 2px);
    padding: var(--space-2, 0.5rem);
    margin-bottom: var(--space-3, 0.75rem);
  }

  .health-graph {
    display: block;
  }

  .graph-label {
    position: absolute;
    bottom: var(--space-1, 0.25rem);
    right: var(--space-2, 0.5rem);
    font-size: var(--text-2xs, 0.625rem);
    color: var(--color-text-muted, #666);
  }

  .retry-button {
    width: 100%;
    padding: var(--space-2, 0.5rem);
    background: var(--color-accent-subtle, rgba(184,115,51,0.15));
    color: var(--color-accent, #b87333);
    border: 1px solid var(--color-accent, #b87333);
    border-radius: var(--radius-md, 4px);
    font-size: var(--text-sm, 0.875rem);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .retry-button:hover {
    background: var(--color-accent, #b87333);
    color: var(--color-bg-app, #141414);
  }
</style>
