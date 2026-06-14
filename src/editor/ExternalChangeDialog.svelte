<script lang="ts">
  /**
   * ExternalChangeDialog — shown when the open file is modified on disk outside
   * the editor. The parent owns the open/close state and the reload/keep logic;
   * this component is purely presentational.
   */
  interface Props {
    onReload: () => void;
    onKeepCurrent: () => void;
  }

  let { onReload, onKeepCurrent }: Props = $props();
</script>

<div class="dialog-overlay">
  <div class="dialog">
    <div class="dialog-header">
      <h3>File Changed Externally</h3>
    </div>
    <div class="dialog-body">
      <p>This file has been modified outside of Atelier.</p>
      <p>Would you like to reload it from disk, or keep your current changes?</p>
    </div>
    <div class="dialog-footer">
      <button class="action-btn" onclick={onKeepCurrent}>
        Keep Current
      </button>
      <button class="action-btn primary" onclick={onReload}>
        Reload from Disk
      </button>
    </div>
  </div>
</div>

<style>
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--color-bg-panel, #1a1a1a);
    border: 1px solid var(--border-subtle, #2a2a2a);
    border-radius: var(--radius-lg, 8px);
    min-width: 400px;
    max-width: 500px;
    box-shadow: var(--shadow-lg, 0 10px 40px rgba(0,0,0,0.5));
  }

  .dialog-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary, #f5f2eb);
  }

  .dialog-body {
    padding: 20px;
  }

  .dialog-body p {
    margin: 0 0 12px 0;
    color: var(--color-text-secondary, #a0a0a0);
    font-size: 14px;
    line-height: 1.5;
  }

  .dialog-body p:last-child {
    margin-bottom: 0;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: 16px 20px;
    border-top: 1px solid var(--border-subtle, #2a2a2a);
  }

  /* Button styles mirror MarkdownEditor's .action-btn — scoped styles do not
     cross component boundaries, so the dialog carries its own copy. */
  .action-btn {
    padding: 6px 12px;
    border: 1px solid var(--border-subtle, #2a2a2a);
    background: var(--color-bg-panel-elevated, #252525);
    color: var(--color-text-secondary, #a0a0a0);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: var(--border-subtle);
    color: var(--color-text-primary, #f5f2eb);
  }

  .action-btn.primary {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }

  .action-btn.primary:hover {
    background: var(--color-accent-hover, #c9843d);
  }
</style>
