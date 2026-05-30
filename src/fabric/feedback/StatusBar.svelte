<script lang="ts">
  /**
   * StatusBar - Fabric Component
   * 
   * App status bar with mode indicator, vault info, and connection status.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @kos/design-system/fabric/feedback
   * @adr 2026-04-12-leap-repo-restructure-003
   */
  import { LayoutGrid, FileText, Network, Columns2, Globe, Cpu, Wifi, Layers, Sparkles } from '@lucide/svelte';
  // Lucide icons are Svelte 4 class components - use permissive typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type IconComponent = any;

  export type ViewMode = 'spatial' | 'file' | 'graph' | 'kanban' | 'browser' | 'exile' | 'research' | 'sovereign' | 'agora' | 'atelier' | 'loge' | 'mir';
  export type ConnectionState = 'connected' | 'connecting' | 'failed' | 'reconnecting';

  export interface Props {
    // Mode/App display
    mode?: ViewMode;
    appName?: string;
    modeLabel?: string;
    
    // Vault info
    vaultName?: string | null;
    vaultPath?: string | null;
    
    // Content stats
    cardCount?: number;
    
    // Connection status
    connectionState?: ConnectionState;
    connectionLabel?: string;
    connectionVisible?: boolean;
    connectionFailedReason?: string | null;
    
    // Callbacks
    onConnectionRetry?: () => void;
    onModeClick?: () => void;
    onVaultClick?: () => void;
    
    // Custom icons (optional)
    modeIcon?: IconComponent;
    appIcon?: IconComponent;
  }

  let { mode, appName, modeLabel, vaultName, vaultPath, cardCount, connectionState, connectionLabel, connectionVisible, connectionFailedReason, onConnectionRetry, onModeClick, onVaultClick, modeIcon, appIcon }: Props = $props();

  // Default icons
  const modeIcons: Record<ViewMode, IconComponent> = {
    spatial: LayoutGrid,
    file: FileText,
    graph: Network,
    kanban: Columns2,
    browser: Globe,
    exile: Cpu,
    research: Sparkles,
    sovereign: Cpu,
    agora: Wifi,
    atelier: LayoutGrid,
    loge: Layers,
    mir: Sparkles,
  };

  const modeLabels: Record<ViewMode, string> = {
    spatial: 'SPATIAL',
    file: 'EDITOR',
    graph: 'GRAPH',
    kanban: 'KANBAN',
    browser: 'BROWSER',
    exile: 'EXILE',
    research: 'RESEARCH',
    sovereign: 'SOVEREIGN',
    agora: 'AGORA',
    atelier: 'ATELIER',
    loge: 'LOGE',
    mir: 'MIR',
  };

  const ModeIcon = $derived(modeIcon || (mode ? modeIcons[mode] : LayoutGrid));
  const displayModeLabel = $derived(modeLabel || (mode ? modeLabels[mode] : 'SPATIAL'));
  const displayAppName = $derived(appName || 'LEAP');
</script>

<footer class="status-bar scanlines">
  <div class="status-left">
    <button 
      class="status-segment status-mode"
      onclick={onModeClick}
      disabled={!onModeClick}
    >
      <ModeIcon size={10} strokeWidth={1} />
      <span>{displayModeLabel}</span>
    </button>

    {#if vaultName}
      <span class="status-divider"></span>
      <button 
        class="status-segment status-vault"
        title={vaultPath || ''}
        onclick={onVaultClick}
        disabled={!onVaultClick}
      >
        {vaultName}
      </button>
    {/if}
  </div>

  <div class="status-center">
    <span class="status-brand">{displayAppName}</span>
  </div>

  <div class="status-right">
    {#if cardCount && cardCount > 0}
      <span class="status-segment">
        <Layers size={10} strokeWidth={1} />
        <span>{cardCount} CARD{cardCount !== 1 ? 'S' : ''}</span>
      </span>
      <span class="status-divider"></span>
    {/if}

    <span class="status-segment status-connection" class:failed={connectionState === 'failed'}>
      <Wifi size={10} strokeWidth={1} />
      <span>{connectionLabel || 'LLM'}</span>
    </span>

    {#if connectionVisible}
      <span class="status-divider"></span>
      <button
        class="status-substrate-dot"
        class:pulsing={connectionState === 'connecting' || connectionState === 'reconnecting'}
        class:failed={connectionState === 'failed'}
        title={connectionFailedReason
          ? `CONNECTION FAILED: ${connectionFailedReason}`
          : connectionState === 'connected'
            ? 'CONNECTED'
            : 'RECONNECTING...'}
        onclick={onConnectionRetry}
        disabled={!onConnectionRetry}
      ></button>
    {/if}
  </div>
</footer>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 24px;
    padding: 0 12px;
    background: var(--color-bg-canvas);
    border-top: 2px solid var(--border-default);
    border-bottom: 2px solid var(--border-default);
    font-size: 10px;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
    z-index: 40;
    user-select: none;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: var(--space-15);
  }

  .status-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .status-brand {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    font-style: normal;
    color: var(--color-text-tertiary);
    opacity: 0.6;
    letter-spacing: 0.08em;
  }

  .status-segment {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    white-space: nowrap;
    line-height: 1;
    padding: 2px 4px;
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: 0;
    cursor: pointer;
  }

  .status-mode {
    color: var(--color-text-primary);
    font-weight: 500;
    background: transparent;
    border: none;
    padding: 0;
    font-size: inherit;
  }

  .status-mode:hover:not(:disabled) {
    background: var(--color-bg-panel);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .status-mode:disabled {
    cursor: default;
    opacity: 0.3;
    border-color: var(--border-subtle);
  }

  .status-vault {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    background: transparent;
    border: 1px solid var(--border-subtle);
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0;
    font-size: inherit;
  }

  .status-vault:hover:not(:disabled) {
    background: var(--color-bg-panel);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .status-vault:disabled {
    cursor: default;
    opacity: 0.3;
    border-color: var(--border-subtle);
  }

  .status-connection {
    color: var(--color-success);
  }

  .status-connection.failed {
    color: var(--color-error);
  }

  .status-divider {
    width: 1px;
    height: 14px;
    background: var(--border-subtle);
    margin: 0 4px;
  }

  /* Connection indicator — substrate dot */
  .status-substrate-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-success);
    border: none;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-fast);
  }

  .status-substrate-dot:hover:not(:disabled) {
    background: var(--color-success);
    transform: scale(1.2);
  }

  .status-substrate-dot:disabled {
    cursor: default;
    opacity: 0.3;
  }

  .status-substrate-dot.pulsing {
    animation: substrate-pulse 1.4s ease-in-out infinite;
  }

  .status-substrate-dot.failed {
    background: var(--color-error);
    animation: none;
  }

  @keyframes substrate-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
</style>