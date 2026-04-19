<script lang="ts">
  /** Mirrors ClarificationSession from @kos/agent — kept local to avoid a design-system→agent dep. */
  interface ClarificationSession {
    sessionId: string;
    question: string;
    contextHints: string[];
    step: number;
    totalSteps: number;
    scaffoldKind: string;
  }

  interface Props {
    session: ClarificationSession;
    onSubmit: (reply: string) => void;
    onDismiss: () => void;
    submitting?: boolean;
  }

  const { session, onSubmit, onDismiss, submitting = false }: Props = $props();

  let reply = $state('');

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && reply.trim()) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      onDismiss();
    }
  }

  function submit() {
    if (!reply.trim() || submitting) return;
    onSubmit(reply.trim());
    reply = '';
  }
</script>

<div class="clarification-overlay" role="dialog" aria-modal="true" aria-labelledby="clarification-heading">
  <div class="clarification-panel">
    <header class="clarification-header">
      <div class="scaffold-badge">{session.scaffoldKind}</div>
      {#if session.totalSteps > 1}
        <span class="step-indicator">Step {session.step} of {session.totalSteps}</span>
      {/if}
      <button class="dismiss-btn" onclick={onDismiss} aria-label="Dismiss clarification">✕</button>
    </header>

    <div class="clarification-body">
      <p id="clarification-heading" class="question">{session.question}</p>

      {#if session.contextHints.length > 0}
        <div class="context-hints">
          {#each session.contextHints as hint}
            <span class="hint-chip">{hint}</span>
          {/each}
        </div>
      {/if}

      <div class="reply-area">
        <textarea
          class="reply-input"
          bind:value={reply}
          onkeydown={handleKeydown}
          placeholder="Your answer…"
          rows={3}
          disabled={submitting}
          autofocus
        ></textarea>
        <button
          class="submit-btn"
          onclick={submit}
          disabled={!reply.trim() || submitting}
        >
          {submitting ? '…' : 'Continue →'}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .clarification-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 200;
    padding-bottom: 80px; /* Above CommandBar */
  }

  .clarification-panel {
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    width: min(640px, calc(100vw - 32px));
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .clarification-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid #3a3a3a;
  }

  .scaffold-badge {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #b87333;
    background: rgba(184, 115, 51, 0.15);
    border: 1px solid rgba(184, 115, 51, 0.3);
    border-radius: 3px;
    padding: 2px 6px;
  }

  .step-indicator {
    font-size: 11px;
    color: #a09880;
    margin-right: auto;
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: #a09880;
    cursor: pointer;
    font-size: 14px;
    padding: 2px 4px;
    margin-left: auto;
    line-height: 1;
  }

  .dismiss-btn:hover {
    color: #e8e0d0;
  }

  .clarification-body {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .question {
    font-size: 14px;
    color: #e8e0d0;
    line-height: 1.5;
    margin: 0;
  }

  .context-hints {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .hint-chip {
    font-size: 11px;
    color: #a09880;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #3a3a3a;
    border-radius: 3px;
    padding: 2px 6px;
  }

  .reply-area {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .reply-input {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    color: #e8e0d0;
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    padding: 8px 10px;
    resize: none;
    line-height: 1.5;
  }

  .reply-input:focus {
    outline: none;
    border-color: #b87333;
  }

  .reply-input:disabled {
    opacity: 0.5;
  }

  .submit-btn {
    background: #b87333;
    border: none;
    border-radius: 4px;
    color: #1a1a1a;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 14px;
    white-space: nowrap;
  }

  .submit-btn:hover:not(:disabled) {
    background: #c98340;
  }

  .submit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
