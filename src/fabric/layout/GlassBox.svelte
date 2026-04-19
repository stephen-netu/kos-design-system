<script lang="ts">
  /**
   * GlassBox - Fabric Component
   * 
   * A modal overlay for agent handoff scenarios.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @kos/design-system/fabric/layout
   * @adr 2026-04-12-leap-substrate-refactor-001
   */
  import type { Snippet } from 'svelte';

  interface Props {
    active: boolean;
    reason: string | null;
    taskId?: string | null;
    description?: string;
    ondone?: () => void;
    onabandon?: () => void;
    children?: Snippet;
  }

  const props : Props = $props();

  function reasonLabel(r: string | null): string {
    switch (r) {
      case 'Captcha': return 'A CAPTCHA is blocking the agent.';
      case 'AuthWall': return 'A login wall is blocking the agent.';
      case 'PaymentRequired': return 'Payment is required to continue.';
      case 'ConsentGate': return 'A consent or age gate is blocking the agent.';
      case 'InteractiveForm': return props.description || 'An interactive form requires your input.';
      default: return 'The agent needs your help to continue.';
    }
  }
</script>

{#if props.active}
  <div class="glass-box-overlay" role="dialog" aria-modal="true" aria-label="Agent handoff required">
    <div class="glass-box-panel">
      <div class="glass-box-header">
        <span class="glass-box-icon">⬡</span>
        <span class="glass-box-title">Agent needs you</span>
        {#if props.taskId}
          <span class="glass-box-task-id">{props.taskId}</span>
        {/if}
      </div>

      <p class="glass-box-reason">{reasonLabel(props.reason)}</p>

      {#if props.description && props.reason !== 'InteractiveForm'}
        <p class="glass-box-description">{props.description}</p>
      {/if}

      <div class="glass-box-viewport">
        <!-- Browser interaction rendered here by parent -->
        {@render props.children?.()}
      </div>

      <div class="glass-box-actions">
        <button
          class="glass-box-abandon"
          onclick={() => props.onabandon?.()}
        >
          Abandon research
        </button>
        <button
          class="glass-box-done"
          onclick={() => props.ondone?.()}
        >
          Done — continue →
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .glass-box-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9000;
    backdrop-filter: blur(4px);
  }

  .glass-box-panel {
    width: min(720px, 90vw);
    max-height: 80vh;
    background: var(--color-bg-panel, #222222);
    border: 1px solid var(--color-accent, #b87333);
    border-radius: var(--radius-xl, 0.75rem);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 0 40px rgba(184, 115, 51, 0.2);
  }

  .glass-box-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-default, #333333);
    background: var(--color-bg-panel-elevated, #2a2a2a);
  }

  .glass-box-icon {
    color: var(--color-accent, #b87333);
    font-size: 16px;
  }

  .glass-box-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary, #f2efe9);
    flex: 1;
  }

  .glass-box-task-id {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 11px;
    color: var(--color-text-secondary, #a09880);
    background: var(--color-bg-canvas, #1a1a1a);
    padding: 2px 8px;
    border-radius: var(--radius-sm, 0.25rem);
  }

  .glass-box-reason {
    margin: 14px 18px 6px;
    font-size: 13px;
    color: var(--color-text-primary, #f2efe9);
    line-height: 1.5;
  }

  .glass-box-description {
    margin: 0 18px 14px;
    font-size: 12px;
    color: var(--color-text-secondary, #a09880);
  }

  .glass-box-viewport {
    flex: 1;
    overflow: auto;
    margin: 0 18px;
    background: var(--color-bg-canvas, #1a1a1a);
    border: 1px solid var(--border-default, #333333);
    border-radius: var(--radius-md, 0.375rem);
    min-height: 200px;
  }

  .glass-box-actions {
    display: flex;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 1px solid var(--border-default, #333333);
    gap: 10px;
  }

  .glass-box-abandon {
    padding: 8px 16px;
    background: transparent;
    border: 1px solid var(--border-default, #444);
    border-radius: var(--radius-md, 0.375rem);
    color: var(--color-text-secondary, #a09880);
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .glass-box-abandon:hover {
    border-color: var(--color-error, #c0392b);
    color: var(--color-error, #c0392b);
  }

  .glass-box-done {
    padding: 8px 20px;
    background: var(--color-accent, #b87333);
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    color: white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .glass-box-done:hover {
    background: var(--color-accent-active, #8a5626);
  }
</style>
