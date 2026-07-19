<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface Props {
    title?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    title = '',
    class: className = '',
    children
  }: Props = $props();
</script>

<div class="ds-window-frame {className}">
  <div class="ds-window-frame-header">
    <div class="ds-window-frame-dots">
      <span class="dot dot-close"></span>
      <span class="dot dot-minimize"></span>
      <span class="dot dot-expand"></span>
    </div>
    {#if title}
      <span class="ds-window-frame-title">{title}</span>
    {/if}
  </div>

  {#if children}
    <div class="ds-window-frame-body">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .ds-window-frame {
    display: flex;
    flex-direction: column;
    border: var(--border-width-thin) solid var(--border-default);
    background: var(--color-card-bg);
    overflow: hidden;
  }

  .ds-window-frame-header {
    display: flex;
    align-items: center;
    gap: var(--ui-pad-x);
    padding: var(--ui-pad-y) var(--ui-pad-x);
    background: var(--color-bg-panel);
    border-bottom: var(--border-width-thin) solid var(--border-default);
  }

  .ds-window-frame-dots {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
  }

  .dot-close { background: var(--color-error); }
  .dot-minimize { background: var(--color-warning); }
  .dot-expand { background: var(--color-success); }

  .ds-window-frame-title {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ds-window-frame-body {
    padding: var(--ui-pad-x);
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
  }
</style>
