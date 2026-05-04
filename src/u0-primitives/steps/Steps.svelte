<script lang="ts">
  /**
   * Steps Component
   * 
   * A vertical stepper component for displaying progress through a sequence of steps.
   * 
   * @package @kos/design-system/u0-primitives
   */
  import type { Snippet } from 'svelte';

  interface Step {
    label: string;
    description?: string;
    completed: boolean;
    active?: boolean;
  }

  interface Props {
    /** List of steps to display */
    steps: Step[];
    /** Whether to show vertical line between steps */
    vertical?: boolean;
    /** Size of the step indicator */
    size?: 'sm' | 'md' | 'lg';
  }

  const props: Props = $props();

  // Default values
  const vertical = props.vertical ?? true;
  const size = props.size ?? 'md';

  // Derived values for styling
  const stepSize = $derived({
    sm: { width: '1.5rem', height: '1.5rem', fontSize: '0.75rem' },
    md: { width: '2rem', height: '2rem', fontSize: '0.875rem' },
    lg: { width: '2.5rem', height: '2.5rem', fontSize: '1rem' }
  }[size]);

  // Get step status classes
  function getStepClasses(index: number, step: Step): string {
    const classes = [];
    if (step.completed) classes.push('completed');
    if (step.active) classes.push('active');
    if (index === 0) classes.push('first');
    if (index === props.steps.length - 1) classes.push('last');
    return classes.join(' ');
  }

  // Get connector classes
  function getConnectorClasses(index: number): string {
    const classes = ['connector'];
    if (index === 0) classes.push('first');
    if (index === props.steps.length - 1) classes.push('last');
    return classes.join(' ');
  }
</script>

{#if props.steps.length > 0}
<div class="steps" {vertical}>
  {#each props.steps as step, index}
    <div class="step-item">
      <div class="step-circle" 
           class={getStepClasses(index, step)}
           style="width: {stepSize.width}; height: {stepSize.height}; font-size: {stepSize.fontSize};">
        {#if step.completed}
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"></polyline>
          </svg>
        {:else if step.active}
          {index + 1}
        {:else}
          {index + 1}
        {/if}
      </div>

      {#if vertical && index < props.steps.length - 1}
        <div class="connector-line" 
             class={getConnectorClasses(index)}
             style="height: {vertical ? '100%' : 'auto'}; width: {vertical ? '2px' : '100%'};"></div>
      {/if}

      <div class="step-content">
        <div class="step-label">{step.label}</div>
        {#if step.description}
          <div class="step-description">{step.description}</div>
        {/if}
      </div>
    </div>
  {/each}
</div>
{/if}

<style>
  .steps {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4, 1rem);
    color: var(--color-fg-secondary, #a09880);
  }

  .steps[vertical="false"] {
    flex-direction: column;
    align-items: stretch;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: var(--space-3, 0.75rem);
  }

  .step-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full, 9999px);
    background: var(--color-bg-secondary, #222);
    color: var(--color-fg-primary, #e8e0d0);
    flex-shrink: 0;
    font-weight: 600;
  }

  .step-circle.completed {
    background: var(--color-success, #22c55e);
    color: var(--color-bg-app, #141414);
  }

  .step-circle.active {
    background: var(--color-accent, #b87333);
    color: var(--color-bg-app, #141414);
    box-shadow: 0 0 0 2px var(--color-accent-subtle, rgba(184, 115, 51, 0.1));
  }

  .step-content {
    flex: 1;
    min-width: 0;
  }

  .step-label {
    font-weight: 500;
    line-height: 1.4;
  }

  .step-description {
    font-size: 0.875rem;
    margin-top: 0.25rem;
    color: var(--color-fg-muted, #888);
  }

  .connector-line {
    background: var(--color-border, #333);
    flex-shrink: 0;
  }

  .connector-line.first {
    border-top-left-radius: var(--radius-sm, 0.125rem);
    border-top-right-radius: var(--radius-sm, 0.125rem);
  }

  .connector-line.last {
    border-bottom-left-radius: var(--radius-sm, 0.125rem);
    border-bottom-right-radius: var(--radius-sm, 0.125rem);
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .steps[vertical="true"] {
      flex-direction: column;
      align-items: flex-start;
    }

    .connector-line {
      width: 100%;
      height: 2px;
    }

    .connector-line.first {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      border-bottom-left-radius: var(--radius-sm, 0.125rem);
      border-bottom-right-radius: var(--radius-sm, 0.125rem);
    }

    .connector-line.last {
      border-top-left-radius: var(--radius-sm, 0.125rem);
      border-top-right-radius: var(--radius-sm, 0.125rem);
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
</style>