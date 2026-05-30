<script lang="ts">
  /**
   * CommandBar - Fabric Component
   * 
   * Application header with vault selection and shortcuts.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @kos/design-system/fabric/input
   * @adr 2026-04-12-leap-substrate-refactor-001
   */
  export interface Props {
    /** App name to display */
    appName: string;
    /** Current mode/view label */
    modeLabel?: string;
    /** Callback when vault selector clicked */
    onselectvault?: () => void;
    /** Callback when keybind settings clicked */
    onopenkeybindsettings?: () => void;
  }

  let { appName, modeLabel, onselectvault, onopenkeybindsettings }: Props = $props();
</script>

<header class="command-bar scanlines">
  <span class="app-name">{appName}</span>
  <div class="spacer"></div>
  <button class="cmd-btn" onclick={onselectvault}>SELECT VAULT</button>
  <button class="cmd-btn" onclick={onopenkeybindsettings}>SHORTCUTS</button>
  {#if modeLabel}
    <span class="mode-label">{modeLabel.toUpperCase()}</span>
  {/if}
</header>

<style>
  .command-bar {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 12px;
    background: var(--color-bg-canvas);
    border-top: 2px solid var(--border-default);
    border-bottom: 2px solid var(--border-default);
    gap: var(--space-3);
  }

  .app-name {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 14px;
    font-family: var(--font-mono);
    letter-spacing: 0.05em;
  }

  .spacer {
    flex: 1;
  }

  .cmd-btn {
    background: transparent;
    border: 2px solid var(--border-subtle);
    border-radius: 0; /* Military sharp edges */
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 13px;
    padding: 4px 8px;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .cmd-btn:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-panel);
    border-color: var(--border-hover);
  }

  .mode-label {
    font-size: 12px;
    color: var(--color-text-tertiary);
    padding: 2px 8px;
    background: var(--color-bg-panel);
    border: 2px solid var(--border-subtle);
    border-radius: 0;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  @media (prefers-reduced-motion: reduce) {
    .command-bar { transition: none; }
  }
</style>