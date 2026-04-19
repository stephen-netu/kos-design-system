<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';

  interface Props {
    content: string | Snippet;
    position?: 'top' | 'right' | 'bottom' | 'left';
    delayMs?: number;
    class?: string;
    trigger: Snippet;
  }

  let {
    content,
    position = 'top',
    delayMs = 300,
    class: className = '',
    trigger
  }: Props = $props();

  let isHovered = $state(false);
  let isFocused = $state(false);
  let isVisible = $state(false);
  let timeoutId: number | undefined;
  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 9)}`;

  let showTooltip = $derived(isHovered || isFocused);

  // Handle delay
  $effect(() => {
    if (showTooltip) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        isVisible = true;
      }, delayMs);
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      isVisible = false;
    }
  });

  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  function handleMouseEnter() { isHovered = true; }
  function handleMouseLeave() { isHovered = false; }
  function handleFocus() { isFocused = true; }
  function handleBlur() { isFocused = false; }
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isVisible) {
      isHovered = false;
      isFocused = false;
      e.stopPropagation();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="ds-tooltip-wrapper {className}"
  aria-describedby={isVisible ? tooltipId : undefined}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onfocusin={handleFocus}
  onfocusout={handleBlur}
  onkeydown={handleKeydown}
>
  {@render trigger()}

  {#if isVisible}
    <div
      id={tooltipId}
      class="ds-tooltip-content pos-{position}"
      role="tooltip"
    >
      <div class="ds-tooltip-arrow pos-{position}"></div>
      <div class="ds-tooltip-inner">
        {#if typeof content === 'string'}
          {content}
        {:else}
          {@render content()}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .ds-tooltip-wrapper {
    position: relative;
    display: inline-block;
  }

  .ds-tooltip-content {
    position: absolute;
    z-index: 9999;
    width: max-content;
    max-width: 250px;
    background: var(--color-bg-panel-elevated);
    border: 1px solid var(--border-default);
    box-shadow: var(--shadow-lg), 0 0 0 1px rgba(0,0,0,0.5);
    border-radius: var(--radius-md);
    animation: ds-fade-in var(--transition-fast) ease-out;
    pointer-events: none; /* Don't interfere with mouse */
  }

  .ds-tooltip-inner {
    padding: var(--space-2) var(--space-3);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    line-height: 1.4;
    text-align: center;
  }

  /* Arrow Base */
  .ds-tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    border-color: transparent;
  }

  /* Position: Top */
  .pos-top {
    bottom: calc(100% + var(--space-2));
    left: 50%;
    transform: translateX(-50%);
  }

  .ds-tooltip-arrow.pos-top {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px 5px 0 5px;
    border-top-color: var(--border-default);
  }

  .ds-tooltip-arrow.pos-top::after {
    content: '';
    position: absolute;
    top: -5px;
    left: -4px;
    border-style: solid;
    border-width: 4px 4px 0 4px;
    border-color: transparent;
    border-top-color: var(--color-bg-panel-elevated);
  }

  /* Position: Bottom */
  .pos-bottom {
    top: calc(100% + var(--space-2));
    left: 50%;
    transform: translateX(-50%);
  }

  .ds-tooltip-arrow.pos-bottom {
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 5px 5px 5px;
    border-bottom-color: var(--border-default);
  }

  .ds-tooltip-arrow.pos-bottom::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: -4px;
    border-style: solid;
    border-width: 0 4px 4px 4px;
    border-color: transparent;
    border-bottom-color: var(--color-bg-panel-elevated);
  }

  /* Position: Right */
  .pos-right {
    top: 50%;
    left: calc(100% + var(--space-2));
    transform: translateY(-50%);
  }

  .ds-tooltip-arrow.pos-right {
    left: -5px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 5px 5px 5px 0;
    border-right-color: var(--border-default);
  }

  .ds-tooltip-arrow.pos-right::after {
    content: '';
    position: absolute;
    right: -5px;
    top: -4px;
    border-style: solid;
    border-width: 4px 4px 4px 0;
    border-color: transparent;
    border-right-color: var(--color-bg-panel-elevated);
  }

  /* Position: Left */
  .pos-left {
    top: 50%;
    right: calc(100% + var(--space-2));
    transform: translateY(-50%);
  }

  .ds-tooltip-arrow.pos-left {
    right: -5px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 5px 0 5px 5px;
    border-left-color: var(--border-default);
  }

  .ds-tooltip-arrow.pos-left::after {
    content: '';
    position: absolute;
    left: -5px;
    top: -4px;
    border-style: solid;
    border-width: 4px 0 4px 4px;
    border-color: transparent;
    border-left-color: var(--color-bg-panel-elevated);
  }

  @keyframes ds-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
