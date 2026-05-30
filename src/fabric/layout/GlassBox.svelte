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

  let { active, reason, taskId, description, ondone, onabandon, children }: Props = $props();

  function reasonLabel(r: string | null): string {
    switch (r) {
      case 'Captcha': return 'A CAPTCHA IS BLOCKING THE AGENT.';
      case 'AuthWall': return 'A LOGIN WALL IS BLOCKING THE AGENT.';
      case 'PaymentRequired': return 'PAYMENT IS REQUIRED TO CONTINUE.';
      case 'ConsentGate': return 'A CONSENT OR AGE GATE IS BLOCKING THE AGENT.';
      case 'InteractiveForm': return description || 'AN INTERACTIVE FORM REQUIRES YOUR INPUT.';
      default: return 'THE AGENT NEEDS YOUR HELP TO CONTINUE.';
    }
  }
</script>

{#if active}
  <div class="glass-box-overlay scanlines" role="dialog" aria-modal="true" aria-label="Agent handoff required">
    <div class="glass-box-panel">
      <div class="glass-box-header">
        <span class="glass-box-icon">⬡</span>
        <span class="glass-box-title">AGENT NEEDS YOU</span>
        {#if taskId}
          <span class="glass-box-task-id">{taskId}</span>
        {/if}
      </div>

      <p class="glass-box-reason">{reasonLabel(reason)}</p>

      {#if description && reason !== 'InteractiveForm'}
        <p class="glass-box-description">{description}</p>
      {/if}

      <div class="glass-box-viewport">
        {@render children?.()}
      </div>

      <div class="glass-box-actions">
        <button
          class="glass-box-abandon"
          onclick={() => onabandon?.()}
        >
          ABANDON RESEARCH
        </button>
        <button
          class="glass-box-done"
          onclick={() => ondone?.()}
        >
          DONE — CONTINUE →
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .glass-box-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9000;
  }

  .glass-box-panel {
    width: min(720px, 90vw);
    max-height: 80vh;
    background: var(--color-bg-panel);
    border: 2px solid var(--color-accent);
    border-radius: 0; /* Military sharp edges */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--shadow-accent-glow);
  }

  .glass-box-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-bottom: 2px solid var(--border-default);
    background: var(--color-bg-panel-elevated);
  }

  .glass-box-icon {
    color: var(--color-accent);
    font-size: 16px;
  }

  .glass-box-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    flex: 1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .glass-box-task-id {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-secondary);
    background: var(--color-bg-canvas);
    padding: 2px 8px;
    border-radius: 0;
  }

  .glass-box-reason {
    margin: 14px 18px 6px;
    font-size: 13px;
    color: var(--color-text-primary);
    line-height: 1.5;
  }

  .glass-box-description {
    margin: 0 18px 14px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .glass-box-viewport {
    flex: 1;
    overflow: auto;
    margin: 0 18px;
    background: var(--color-bg-canvas);
    border: 2px solid var(--border-default);
    border-radius: 0;
    min-height: 200px;
  }

  .glass-box-actions {
    display: flex;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 2px solid var(--border-default);
    gap: 10px;
  }

  .glass-box-abandon {
    padding: 8px 16px;
    background: transparent;
    border: 2px solid var(--border-default);
    border-radius: 0;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }

  .glass-box-abandon:hover {
    border-color: var(--color-error);
    color: var(--color-error);
    background: rgba(248, 81, 73, 0.1);
  }

  .glass-box-done {
    padding: 8px 20px;
    background: var(--color-accent);
    border: 2px solid var(--color-accent);
    border-radius: 0;
    color: #0d1117;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: background 0.15s;
  }

  .glass-box-done:hover {
    background: var(--color-accent-hover);
    border-color: var(--color-accent-hover);
  }

  @media (prefers-reduced-motion: reduce) {
    .glass-box-panel { transition: none; }
    .glass-box-abandon:hover { background: none; }
    .glass-box-done:hover { background: none; }
  }
</style>