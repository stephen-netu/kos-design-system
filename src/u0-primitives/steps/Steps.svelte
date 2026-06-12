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

  export interface Props {
    /** List of steps to display */
    steps: Step[];
    /** Whether to show vertical line between steps */
    vertical?: boolean;
    /** Size of the step indicator */
    size?: 'sm' | 'md' | 'lg';
  }

  let { steps, vertical = true, size = 'md' }: Props = $props();

  const stepSize = $derived({
    sm: { width: '1.5rem', height: '1.5rem', fontSize: '0.75rem' },
    md: { width: '2rem', height: '2rem', fontSize: '0.875rem' },
    lg: { width: '2.5rem', height: '2.5rem', fontSize: '1rem' }
  }[size]);

  function getStepClasses(index: number, step: Step): string {
    const classes: string[] = [];
    if (step.completed) classes.push('completed');
    if (step.active) classes.push('active');
    if (index === 0) classes.push('first');
    if (index === steps.length - 1) classes.push('last');
    return classes.join(' ');
  }

  function getConnectorClasses(index: number): string {
    const classes = ['connector'];
    if (index === 0) classes.push('first');
    if (index === steps.length - 1) classes.push('last');
    return classes.join(' ');
  }
</script>

{#if steps.length > 0}
<div class="steps" class:vertical role="list" aria-label="Steps">
  {#each steps as step, index}
    <div class="step-item" role="listitem">
      <div
        class="step-circle {getStepClasses(index, step)}"
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

      {#if vertical && index < steps.length - 1}
        <div
          class="connector-line {getConnectorClasses(index)}"
          style="height: {vertical ? '100%' : 'auto'}; width: {vertical ? '2px' : '100%'};"
        ></div>
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
    color: var(--color-text-secondary, #a09880);
  }

  .steps:not(.vertical) {
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
    color: var(--color-text-primary, #e8e0d0);
    flex-shrink: 0;
    font-weight: 600;
  }

   .step-circle.completed {
     background: var(--color-success);
      color: var(--color-text-inverse);
    }

    .step-circle.active {
      background: var(--color-accent);
      color: var(--color-text-inverse);
    box-shadow: 0 0 0 2px var(--color-accent-subtle, var(--color-accent-subtle));
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
    color: var(--color-text-muted, #888);
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
    .steps.vertical {
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