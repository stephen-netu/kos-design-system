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
  interface Props {
    /** App name to display */
    appName: string;
    /** Current mode/view label */
    modeLabel?: string;
    /** Callback when vault selector clicked */
    onselectvault?: () => void;
    /** Callback when keybind settings clicked */
    onopenkeybindsettings?: () => void;
  }

  const props: Props = $props();
</script>

<header class="command-bar">
  <span class="app-name">{props.appName}</span>
  <div class="spacer"></div>
  <button class="cmd-btn" onclick={props.onselectvault}>Select Vault</button>
  <button class="cmd-btn" onclick={props.onopenkeybindsettings}>Shortcuts</button>
  {#if props.modeLabel}
    <span class="mode-label">{props.modeLabel}</span>
  {/if}
</header>

<style>
  .command-bar {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 12px;
    background: var(--color-bg-canvas, #1a1a1a);
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    gap: 12px;
  }

  .app-name {
    font-weight: 600;
    color: var(--color-text-primary, #f2efe9);
    font-size: 14px;
  }

  .spacer {
    flex: 1;
  }

  .cmd-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary, #a09880);
    cursor: pointer;
    font-size: 13px;
    padding: 4px 8px;
    border-radius: var(--radius-sm, 0.25rem);
    transition: color 0.15s, background 0.15s;
  }

  .cmd-btn:hover {
    color: var(--color-text-primary, #f2efe9);
    background: rgba(255, 255, 255, 0.05);
  }

  .mode-label {
    font-size: 12px;
    color: var(--color-text-tertiary, #706858);
    padding: 2px 8px;
    background: var(--color-bg-panel, #222222);
    border-radius: var(--radius-sm, 0.25rem);
  }
</style>
