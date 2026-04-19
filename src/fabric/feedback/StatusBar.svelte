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

  export type ViewMode = 'spatial' | 'file' | 'graph' | 'kanban' | 'browser' | 'sovereign' | 'agora' | 'atelier' | 'loge' | 'mir';
  export type ConnectionState = 'connected' | 'connecting' | 'failed' | 'reconnecting';

  interface Props {
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

  const props: Props = $props();

  // Default icons
  const modeIcons: Record<ViewMode, IconComponent> = {
    spatial: LayoutGrid,
    file: FileText,
    graph: Network,
    kanban: Columns2,
    browser: Globe,
    sovereign: Cpu,
    agora: Wifi,
    atelier: LayoutGrid,
    loge: Layers,
    mir: Sparkles,
  };

  const modeLabels: Record<ViewMode, string> = {
    spatial: 'Spatial',
    file: 'Editor',
    graph: 'Graph',
    kanban: 'Kanban',
    browser: 'Browser',
    sovereign: 'Sovereign',
    agora: 'Agora',
    atelier: 'Atelier',
    loge: 'Loge',
    mir: 'Mir',
  };

  const ModeIcon = $derived(props.modeIcon || (props.mode ? modeIcons[props.mode] : LayoutGrid));
  const displayModeLabel = $derived(props.modeLabel || (props.mode ? modeLabels[props.mode] : 'Spatial'));
  const displayAppName = $derived(props.appName || 'LEAP');
</script>

<footer class="status-bar">
  <div class="status-left">
    <button 
      class="status-segment status-mode"
      onclick={props.onModeClick}
      disabled={!props.onModeClick}
    >
      <ModeIcon size={11} strokeWidth={1.5} />
      <span>{displayModeLabel}</span>
    </button>

    {#if props.vaultName}
      <span class="status-divider"></span>
      <button 
        class="status-segment status-vault"
        title={props.vaultPath || ''}
        onclick={props.onVaultClick}
        disabled={!props.onVaultClick}
      >
        {props.vaultName}
      </button>
    {/if}
  </div>

  <div class="status-center">
    <span class="status-brand">{displayAppName}</span>
  </div>

  <div class="status-right">
    {#if props.cardCount && props.cardCount > 0}
      <span class="status-segment">
        <Layers size={11} strokeWidth={1.5} />
        <span>{props.cardCount} card{props.cardCount !== 1 ? 's' : ''}</span>
      </span>
      <span class="status-divider"></span>
    {/if}

    <span class="status-segment status-connection" class:failed={props.connectionState === 'failed'}>
      <Wifi size={11} strokeWidth={1.5} />
      <span>{props.connectionLabel || 'LLM'}</span>
    </span>

    {#if props.connectionVisible}
      <span class="status-divider"></span>
      <button
        class="status-substrate-dot"
        class:pulsing={props.connectionState === 'connecting' || props.connectionState === 'reconnecting'}
        class:failed={props.connectionState === 'failed'}
        title={props.connectionFailedReason
          ? `Connection failed: ${props.connectionFailedReason}`
          : props.connectionState === 'connected'
            ? 'Connected'
            : 'Reconnecting…'}
        onclick={props.onConnectionRetry}
        disabled={!props.onConnectionRetry}
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
    background: var(--rail-bg, #161616);
    border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    font-size: 11px;
    color: var(--text-tertiary, #6b6b6b);
    flex-shrink: 0;
    z-index: 40;
    user-select: none;
  }

  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .status-brand {
    font-family: 'Crimson Pro', 'Georgia', serif;
    font-size: 11px;
    font-weight: 400;
    font-style: italic;
    color: var(--text-tertiary, #6b6b6b);
    opacity: 0.4;
    letter-spacing: 0.08em;
  }

  .status-segment {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    line-height: 1;
  }

  .status-mode {
    color: var(--accent-primary, #b87333);
    font-weight: 500;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
  }

  .status-mode:hover:not(:disabled) {
    opacity: 0.8;
  }

  .status-mode:disabled {
    cursor: default;
  }

  .status-vault {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
    color: inherit;
  }

  .status-vault:hover:not(:disabled) {
    color: var(--text-secondary, #a0a0a0);
  }

  .status-vault:disabled {
    cursor: default;
  }

  .status-connection {
    color: var(--color-success, #5a8a6e);
  }

  .status-connection.failed {
    color: var(--color-error, #ef4444);
  }

  .status-divider {
    width: 1px;
    height: 10px;
    background: var(--border-subtle, rgba(255, 255, 255, 0.06));
  }

  /* Connection indicator — brass dot, visible only when not connected. */
  .status-substrate-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #b87333;
    border: none;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
  }

  .status-substrate-dot:hover:not(:disabled) {
    transform: scale(1.2);
  }

  .status-substrate-dot:disabled {
    cursor: default;
  }

  .status-substrate-dot.pulsing {
    animation: substrate-pulse 1.4s ease-in-out infinite;
  }

  .status-substrate-dot.failed {
    background: #c0392b;
    animation: none;
  }

  @keyframes substrate-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
</style>
