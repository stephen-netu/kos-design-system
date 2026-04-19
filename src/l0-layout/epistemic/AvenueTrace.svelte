<script lang="ts">
  import type { AvenueTraceView, AvenueStepView } from '../../epistemic/types.js';

  interface Props {
    trace: AvenueTraceView;
    expanded?: boolean;
    class?: string;
  }

  let { trace, expanded = false, class: className = '' }: Props = $props();

  let isExpanded: boolean = $state(false);

  $effect(() => {
    isExpanded = expanded;
  });

  const sourceCount = $derived(
    trace.steps.filter((s: AvenueStepView) => s.step_type === 'retrieve').length
  );

  const confidencePct = $derived(`${Math.round(trace.confidence * 100)}%`);

  function stepIcon(stepType: AvenueStepView['step_type']): string {
    switch (stepType) {
      case 'query': return '⊕';
      case 'retrieve': return '⊙';
      case 'filter': return '⊘';
      case 'synthesize': return '⊛';
      case 'contradict': return '⊗';
      case 'verify': return '⊚';
      default: return '○';
    }
  }

  function stepLabel(stepType: AvenueStepView['step_type']): string {
    switch (stepType) {
      case 'query': return 'Query';
      case 'retrieve': return 'Retrieve';
      case 'filter': return 'Filter';
      case 'synthesize': return 'Synthesize';
      case 'contradict': return 'Contradiction';
      case 'verify': return 'Verify';
      default: return stepType;
    }
  }
</script>

<div class="ds-avenue-trace {className}" class:expanded={isExpanded}>

  {#if !isExpanded}
    <!-- Collapsed summary bar -->
    <div class="collapsed-bar">
      <span class="summary">
        {trace.steps.length} step{trace.steps.length !== 1 ? 's' : ''}
        · {sourceCount} source{sourceCount !== 1 ? 's' : ''}
        · {confidencePct} confidence
      </span>
      {#if trace.isPartial}
        <span class="partial-tag">(partial)</span>
      {/if}
      <button class="expand-btn" type="button" onclick={() => isExpanded = true}>
        Expand →
      </button>
    </div>

  {:else}
    <!-- Expanded step timeline -->
    <div class="expanded-header">
      <span class="header-title">Agent Avenue</span>
      {#if trace.isPartial}
        <span class="partial-tag">partial — agent did not log all steps</span>
      {/if}
      <button class="collapse-btn" type="button" onclick={() => isExpanded = false}>
        ← Collapse
      </button>
    </div>

    <div class="steps">
      {#each trace.steps as step, i}
        <div class="step">
          <!-- Step connector -->
          <div class="step-track">
            <div class="step-icon">{stepIcon(step.step_type)}</div>
            {#if i < trace.steps.length - 1}
              <div class="step-line"></div>
            {/if}
          </div>

          <!-- Step content -->
          <div class="step-body">
            <div class="step-header">
              <span class="step-type">{stepLabel(step.step_type)}</span>
            </div>
            <div class="step-summary">{step.summary}</div>
          </div>
        </div>
      {/each}

      {#if trace.steps.length === 0}
        <div class="empty-steps">
          {trace.isPartial ? 'No step data available — agent session predates structured logging.' : 'No steps recorded.'}
        </div>
      {/if}
    </div>

    <div class="expanded-footer">
      <span class="footer-confidence">Aggregate confidence: {confidencePct}</span>
    </div>
  {/if}

</div>

<style>
  .ds-avenue-trace {
    font-family: var(--font-sans);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    background: var(--color-bg-panel-elevated);
    overflow: hidden;
  }

  /* Collapsed */
  .collapsed-bar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
  }

  .summary {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    flex: 1;
  }

  .partial-tag {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
  }

  .expand-btn, .collapse-btn {
    background: none;
    border: none;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-accent);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
  }

  .expand-btn:hover, .collapse-btn:hover {
    color: var(--color-accent-hover);
  }

  /* Expanded */
  .expanded-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
  }

  .header-title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-primary);
    flex: 1;
  }

  .steps {
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-direction: column;
  }

  .step {
    display: flex;
    gap: var(--space-3);
    min-height: 2.5rem;
  }

  .step-track {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 1.5rem;
  }

  .step-icon {
    font-size: var(--text-sm);
    color: var(--color-accent);
    line-height: 1.4;
  }

  .step-line {
    width: 1px;
    flex: 1;
    background: var(--border-default);
    min-height: 1rem;
    margin: 2px 0;
  }

  .step-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: var(--space-3);
    flex: 1;
  }

  .step-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .step-type {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .step-summary {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .empty-steps {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
    padding: var(--space-4) 0;
    text-align: center;
  }

  .expanded-footer {
    padding: var(--space-2) var(--space-4);
    border-top: 1px solid var(--border-subtle);
  }

  .footer-confidence {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    font-family: var(--font-mono);
  }
</style>
