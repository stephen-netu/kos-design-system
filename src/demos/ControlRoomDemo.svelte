<script lang="ts">
  // Control Room Demo — Telemetry Panel Aesthetic
  // Demonstrates the brutalist/Palantir design language
  
  interface SystemMetric {
    id: string;
    label: string;
    value: string;
    unit: string;
    status: 'nominal' | 'caution' | 'critical' | 'offline';
    trend?: 'up' | 'down' | 'stable';
  }
  
  interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERR' | 'SYS';
    message: string;
    source: string;
  }
  
  let { 
    systemId = 'SOV-ALPHA-01',
    uptime = '47:23:18'
  }: { 
    systemId?: string;
    uptime?: string;
  } = $props();
  
  let activeTab = $state<'metrics' | 'logs' | 'network'>('metrics');
  let systemStatus = $state<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE');
  let currentTime = $state('--:--:--');
  let metrics = $state<SystemMetric[]>([
    { id: 'cpu', label: 'CPU_LOAD', value: '34', unit: '%', status: 'nominal', trend: 'stable' },
    { id: 'mem', label: 'MEM_ALLOC', value: '12.4', unit: 'GB', status: 'nominal', trend: 'up' },
    { id: 'net', label: 'NET_IO', value: '847', unit: 'MB/s', status: 'caution', trend: 'up' },
    { id: 'temp', label: 'CORE_TEMP', value: '67', unit: '°C', status: 'nominal', trend: 'stable' },
    { id: 'pwr', label: 'PWR_DRAW', value: '234', unit: 'W', status: 'nominal', trend: 'down' },
    { id: 'fan', label: 'FAN_RPM', value: '2847', unit: 'RPM', status: 'critical', trend: 'up' },
  ]);
  
  let logs = $state<LogEntry[]>([
    { timestamp: '14:23:47.284', level: 'INFO', message: 'INFERENCE_CYCLE_COMPLETE', source: 'r4-inference' },
    { timestamp: '14:23:45.912', level: 'SYS', message: 'SKILL_ROUTER_REBALANCE', source: 'c1-skill-router' },
    { timestamp: '14:23:12.445', level: 'WARN', message: 'LATENCY_SPIKE_DETECTED', source: 'mcp-server' },
    { timestamp: '14:22:58.001', level: 'ERR', message: 'CONNECTION_DROPPED_NODE_7', source: 'gossip' },
    { timestamp: '14:22:45.338', level: 'INFO', message: 'SIGCHAIN_ANCHOR_WRITTEN', source: 'assay' },
  ]);
  
  // Fix #2: SSR-safe time updates via $effect
  $effect(() => {
    const updateTime = () => {
      currentTime = new Date().toISOString().split('T')[1].split('.')[0];
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  });
  
  // Fix #7: Live data simulation
  $effect(() => {
    const interval = setInterval(() => {
      // Update metrics with simulated fluctuations
      metrics = metrics.map((m: SystemMetric) => {
        const val = parseFloat(m.value);
        const noise = (Math.random() - 0.5) * val * 0.1;
        const newVal = Math.max(0, val + noise).toFixed(m.id === 'cpu' || m.id === 'temp' ? 0 : 1);
        return { ...m, value: newVal };
      });
      
      // Add occasional log entry
      if (Math.random() > 0.7) {
        const now = new Date();
        const ts = now.toISOString().split('T')[1].split('.')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
        const newLog: LogEntry = {
          timestamp: ts,
          level: Math.random() > 0.8 ? 'WARN' : 'INFO',
          message: `METRIC_UPDATE_CYCLE_${Math.floor(Math.random() * 9999)}`,
          source: 'telemetry'
        };
        logs = [newLog, ...logs].slice(0, 50);
      }
    }, 2000);
    return () => clearInterval(interval);
  });
  
  // Fix #6: Tight function typing
  function getStatusColor(status: SystemMetric['status'] | LogEntry['level'] | typeof systemStatus): string {
    // Fix #4: Use CSS custom properties instead of hardcoded hex
    switch (status) {
      case 'nominal':
      case 'ONLINE':
        return 'var(--color-status-active)';
      case 'caution':
      case 'DEGRADED':
        return 'var(--color-status-busy)';
      case 'critical':
      case 'ERR':
      case 'OFFLINE':
        return 'var(--color-status-alert)';
      case 'WARN':
        return 'var(--color-status-warn)';
      default:
        return 'var(--color-text-tertiary)';
    }
  }
  
  function getTrendArrow(trend?: SystemMetric['trend']): string {
    switch (trend) {
      case 'up': return '▲';
      case 'down': return '▼';
      default: return '◆';
    }
  }
  
  // Fix #3: Defensive CSS width calculation
  function getStatusWidth(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return '0%';
    return `${Math.min(num / 2, 100)}%`;
  }
</script>

<div class="telemetry-panel" data-theme="control-room">
  <!-- HEADER: System Identity -->
  <header class="panel-header">
    <div class="header-left">
      <div class="system-id">{systemId}</div>
      <div class="status-line">
        <span class="status-indicator" style="color: {getStatusColor(systemStatus)}">
          ● {systemStatus}
        </span>
        <span class="uptime">UPTIME: {uptime}</span>
      </div>
    </div>
    <div class="header-right">
      <div class="coord-display">
        <div>LOC: 40.7128°N, 74.0060°W</div>
        <div>TS: {currentTime}</div>
      </div>
    </div>
  </header>

  <!-- HAZARD STRIPE DIVIDER -->
  <div class="hazard-divider hazard-stripes"></div>

  <!-- TAB NAVIGATION -->
  <nav class="tab-bar">
      {#each [['metrics', 'METRICS'], ['logs', 'EVENT_LOG'], ['network', 'NETWORK']] as [tab, label]}
      <button 
        role="tab"
        aria-selected={activeTab === tab}
        aria-controls="{tab}-panel"
        class="tab-btn"
        class:active={activeTab === tab}
        onclick={() => activeTab = tab as typeof activeTab}
      >
        {activeTab === tab ? '■' : '□'} {label}
      </button>
    {/each}
    <div class="tab-spacer"></div>
    <div class="hazard-badge">CLASS: OPERATOR</div>
  </nav>

  <!-- MAIN CONTENT AREA -->
  <main class="content-area">
    {#if activeTab === 'metrics'}
      <div class="metrics-grid">
        {#each metrics as metric}
          <div class="metric-card" class:critical={metric.status === 'critical'}>
            <div class="metric-header">
              <span class="metric-label">{metric.label}</span>
              <span class="metric-trend" style="color: {getStatusColor(metric.status)}">
                {getTrendArrow(metric.trend)}
              </span>
            </div>
            <div class="metric-value" style="color: {getStatusColor(metric.status)}">
              {metric.value}<span class="metric-unit">{metric.unit}</span>
            </div>
            <div class="metric-status-bar">
              <div 
                class="status-fill" 
                style="width: {getStatusWidth(metric.value)}; background: {getStatusColor(metric.status)}"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    
    {:else if activeTab === 'logs'}
      <div id="logs-panel" role="tabpanel" aria-labelledby="logs-tab">
      <div class="log-container">
        <div class="log-header">
          <span>TIMESTAMP</span>
          <span>LVL</span>
          <span>SOURCE</span>
          <span>MESSAGE</span>
        </div>
        {#each logs as log}
          <div class="log-row">
            <span class="log-ts">{log.timestamp}</span>
            <span class="log-level" style="color: {getStatusColor(log.level)}">{log.level}</span>
            <span class="log-source">{log.source}</span>
            <span class="log-msg">{log.message}</span>
          </div>
        {/each}
      </div>
    
    </div>
    {:else}
      <div id="network-panel" role="tabpanel" aria-labelledby="network-tab" class="network-view">
        <div class="network-node">
          <div class="node-id">SOVEREIGN-CORE</div>
          <div class="node-conn active">● ACTIVE</div>
          <div class="node-lat">2.4ms</div>
        </div>
        <div class="network-link"></div>
        <div class="network-node">
          <div class="node-id">LEAP-MIDDLEWARE</div>
          <div class="node-conn active">● ACTIVE</div>
          <div class="node-lat">8.1ms</div>
        </div>
        <div class="network-link warning"></div>
        <div class="network-node warning">
          <div class="node-id">AGORA-CHANNEL</div>
          <div class="node-conn degraded">● DEGRADED</div>
          <div class="node-lat degraded">147ms</div>
        </div>
      </div>
    {/if}
  </main>

  <!-- FOOTER: Metadata -->
  <footer class="panel-footer">
    <div class="footer-left">
      <span class="hex-dump">HEX: 0x7F3A9E2D • 0x4B8C1F00 • 0x9E5D2A11</span>
    </div>
    <div class="footer-right">
      <span>BUILD: v2.4.1-RC1</span>
      <span>HASH: a7f3d9e</span>
    </div>
  </footer>
</div>

<style>
  /* --- PANEL CONTAINER ---
   * Uses theme tokens from control-room.css
   * Layout only — all colors from CSS vars
   */
  .telemetry-panel {
    width: 100%;
    max-width: 900px;
    background: var(--color-bg-app);
    border: var(--border-default);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    color: var(--color-text-primary);
    display: flex;
    flex-direction: column;
    clip-path: var(--clip-corner-md);
  }

  /* --- HEADER --- */
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--space-2);
    background: var(--color-bg-canvas);
    border-bottom: var(--border-default);
  }

  .system-id {
    font-size: var(--text-2xl);
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .status-line {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-1);
    font-size: var(--text-sm);
  }

  .status-indicator {
    font-weight: 500;
  }

  .uptime {
    color: var(--color-text-tertiary);
  }

  .coord-display {
    text-align: right;
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    line-height: 1.6;
  }

  /* --- HAZARD STRIPE ---
   * Uses theme .hazard-stripes utility class in markup,
   * this is component-specific sizing only
   */
  .hazard-divider {
    height: var(--size-hazard-divider-height);
    /* Background comes from theme .hazard-stripes class */
  }

  /* --- TAB BAR --- */
  .tab-bar {
    display: flex;
    gap: 0;
    background: var(--color-bg-inset);
    border-bottom: var(--border-subtle);
  }

  .tab-btn {
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: none;
    border-right: var(--border-subtle);
    color: var(--color-text-tertiary);
    font-family: inherit;
    font-size: var(--text-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: var(--transition-fast);
  }

  .tab-btn:hover {
    background: var(--color-bg-canvas);
    color: var(--color-text-secondary);
  }

  .tab-btn.active {
    background: var(--color-bg-app);
    color: var(--color-accent);
    border-bottom: var(--border-width-thick) solid var(--color-accent);
    margin-bottom: -1px;
  }

  .tab-spacer {
    flex: 1;
  }

  .hazard-badge {
    padding: var(--space-2) var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-status-busy);
    border-left: var(--border-subtle);
    display: flex;
    align-items: center;
  }

  /* --- CONTENT AREA --- */
  .content-area {
    flex: 1;
    padding: var(--space-2);
    background: var(--color-bg-app);
    min-height: 300px;
  }

  /* --- METRICS GRID --- */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--size-grid-gap-subtle);
    background: var(--divider-color);
    border: var(--border-subtle);
  }

  .metric-card {
    background: var(--color-card-bg);
    padding: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .metric-card.critical {
    background: repeating-linear-gradient(
      -45deg,
      var(--color-card-bg),
      var(--color-card-bg) var(--hazard-alt-stripe-band),
      var(--color-status-alert-10) var(--hazard-alt-stripe-band),
      var(--color-status-alert-10) var(--hazard-alt-stripe-width)
    );
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .metric-label {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    letter-spacing: 0.1em;
  }

  .metric-trend {
    font-size: var(--text-sm);
  }

  .metric-value {
    font-size: var(--text-3xl);
    font-weight: 600;
    font-family: var(--font-data);
  }

  .metric-unit {
    font-size: var(--text-sm);
    color: var(--color-text-tertiary);
    margin-left: 0.25rem;
  }

  .metric-status-bar {
    height: var(--size-status-bar-height);
    background: var(--divider-color);
    margin-top: auto;
  }

  .status-fill {
    height: 100%;
    transition: var(--transition-normal);
  }

  /* --- LOGS --- */
  .log-container {
    font-size: var(--text-sm);
    line-height: 1.8;
  }

  .log-header {
    display: grid;
    grid-template-columns: 100px 50px 150px 1fr;
    gap: var(--space-2);
    padding: var(--space-1) 0;
    border-bottom: var(--border-subtle);
    color: var(--color-text-tertiary);
    font-size: var(--text-xs);
    letter-spacing: 0.1em;
  }

  .log-row {
    display: grid;
    grid-template-columns: 100px 50px 150px 1fr;
    gap: var(--space-2);
    padding: var(--space-1) 0;
    border-bottom: var(--border-subtle);
  }

  .log-row:hover {
    background: var(--color-bg-canvas);
  }

  .log-ts {
    color: var(--color-text-muted);
  }

  .log-level {
    font-weight: 600;
  }

  .log-source {
    color: var(--color-text-tertiary);
  }

  .log-msg {
    color: var(--color-text-secondary);
  }

  /* --- NETWORK VIEW --- */
  .network-view {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: var(--space-2);
  }

  .network-node {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--color-bg-canvas);
    border: var(--border-subtle);
    border-left: var(--size-border-left-heavy) solid var(--color-status-active);
  }

  .network-node.warning {
    border-left-color: var(--color-status-warn);
  }

  .node-id {
    width: 200px;
    font-weight: 500;
    letter-spacing: 0.05em;
  }

  .node-conn {
    font-size: var(--text-sm);
    color: var(--color-text-tertiary);
  }

  .node-conn.active {
    color: var(--color-status-active);
  }

  .node-conn.degraded,
  .node-lat.degraded {
    color: var(--color-status-warn);
  }

  .node-lat {
    margin-left: auto;
    font-family: var(--font-data);
    color: var(--color-status-active);
  }

  .network-link {
    width: var(--size-network-link-width);
    height: var(--size-network-link-height);
    background: var(--color-status-active);
    margin-left: var(--space-2);
    position: relative;
  }

  .network-link::before {
    content: '▼';
    position: absolute;
    left: calc(var(--space-1) * -1);
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--text-2xs);
    color: var(--color-status-active);
  }

  .network-link.warning {
    background: var(--color-status-warn);
  }

  .network-link.warning::before {
    color: var(--color-status-warn);
  }

  /* --- FOOTER --- */
  .panel-footer {
    display: flex;
    justify-content: space-between;
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-inset);
    border-top: var(--border-subtle);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .footer-right {
    display: flex;
    gap: var(--space-2);
  }

  .hex-dump {
    font-family: var(--font-data);
    letter-spacing: 0.1em;
  }
</style>
