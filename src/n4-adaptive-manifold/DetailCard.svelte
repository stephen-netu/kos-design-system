<script lang="ts">
  import type { ManifoldNode } from './types.js';

  interface Props {
    node: ManifoldNode;
    pinned: boolean;
    onclose?: () => void;
  }

  let { node, pinned, onclose }: Props = $props();
</script>

<div
  class="detail-card"
  class:detail-card--pinned={pinned}
>
  <header class="detail-card__header">
    <span class="detail-card__kind">{node.kind}</span>
    <span class="detail-card__name">{node.label}</span>
    {#if pinned}
      <button class="detail-card__close" onclick={onclose}>&times;</button>
    {/if}
  </header>

  <div class="detail-card__body">
    {#if node.kind === 'agent'}
      {@render agentBody(node)}
    {:else if node.kind === 'task'}
      {@render taskBody(node)}
    {:else}
      {@render genericBody(node)}
    {/if}
  </div>
</div>

{#snippet agentBody(n: ManifoldNode)}
  {#if n.metadata?.spark_by_axis}
    {@const axes = n.metadata.spark_by_axis as [number, number, number]}
    {@const ROLE_LABELS = ['Epistemic', 'Worker', 'Coordination'] as const}
    {@const dominant = axes[0] > axes[1] && axes[0] > axes[2] ? 0 : axes[1] > axes[2] ? 1 : 2}
    <div class="detail-card__row">
      <span class="detail-card__label">Role</span>
      <span class="detail-card__value">{ROLE_LABELS[dominant]}</span>
    </div>
    <div class="detail-card__row">
      <span class="detail-card__label">Axes (i/j/k)</span>
      <span class="detail-card__value">{axes[0]} / {axes[1]} / {axes[2]}</span>
    </div>
  {/if}
  {#if n.metadata?.spark_remaining != null}
    <div class="detail-card__row">
      <span class="detail-card__label">Spark</span>
      <span class="detail-card__value">{n.metadata.spark_remaining as number}</span>
    </div>
  {/if}
  {#if n.metadata?.current_task}
    <div class="detail-card__row">
      <span class="detail-card__label">Working</span>
      <span class="detail-card__value">{n.metadata.current_task as string}</span>
    </div>
  {/if}
  {#if n.metadata?.loop_phase}
    <div class="detail-card__row">
      <span class="detail-card__label">Phase</span>
      <span class="detail-card__value">{n.metadata.loop_phase as string}</span>
    </div>
  {/if}
{/snippet}

{#snippet taskBody(n: ManifoldNode)}
  {#if n.metadata?.wt_id}
    <div class="detail-card__row">
      <span class="detail-card__label">ID</span>
      <span class="detail-card__value">{n.metadata.wt_id as string}</span>
    </div>
  {/if}
  {#if n.metadata?.flow_phase}
    <div class="detail-card__row">
      <span class="detail-card__label">Flow</span>
      <span class="detail-card__value">{n.metadata.flow_phase as string}</span>
    </div>
  {/if}
  {#if n.metadata?.claiming_agent}
    <div class="detail-card__row">
      <span class="detail-card__label">Agent</span>
      <span class="detail-card__value">{n.metadata.claiming_agent as string}</span>
    </div>
  {/if}
  {#if n.metadata?.priority}
    <div class="detail-card__row">
      <span class="detail-card__label">Priority</span>
      <span class="detail-card__value">{n.metadata.priority as string}</span>
    </div>
  {/if}
  {#if n.metadata?.description}
    <div class="detail-card__description">{n.metadata.description as string}</div>
  {/if}
{/snippet}

{#snippet genericBody(n: ManifoldNode)}
  <div class="detail-card__row">
    <span class="detail-card__label">Status</span>
    <span class="detail-card__value">{n.status}</span>
  </div>
{/snippet}

<style>
  /* Outer shell: molds to content up to a capped height.
     Positioning handled by the wrapper div in AdaptiveManifold. */
  .detail-card {
    width: 220px;
    max-height: min(420px, calc(100% - 40px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #1e1e1e;
    border: 1px solid rgba(184, 115, 51, 0.3);
    border-radius: var(--radius-md, 6px);
    font-family: var(--font-mono);
    font-size: 11px;
    color: #e8e0d0;
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
  }

  .detail-card--pinned {
    pointer-events: auto;
    border-color: rgba(184, 115, 51, 0.6);
  }

  /* Pinned header — never scrolls */
  .detail-card__header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(184, 115, 51, 0.15);
  }

  .detail-card__kind {
    color: #b87333;
    text-transform: uppercase;
    font-size: 9px;
    letter-spacing: 0.5px;
  }

  .detail-card__name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail-card__close {
    background: none;
    border: none;
    color: #a09880;
    cursor: pointer;
    font-size: 14px;
    padding: 0 2px;
    line-height: 1;
  }

  .detail-card__close:hover {
    color: #e8e0d0;
  }

  /* Scrollable body — grows to fill, scrolls when content overflows the cap */
  .detail-card__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    scrollbar-width: thin;
    scrollbar-color: rgba(184, 115, 51, 0.25) transparent;
  }

  .detail-card__body::-webkit-scrollbar { width: 3px; }
  .detail-card__body::-webkit-scrollbar-thumb { background: rgba(184, 115, 51, 0.25); border-radius: var(--radius-xs, 2px); }
  .detail-card__body::-webkit-scrollbar-track { background: transparent; }

  .detail-card__row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .detail-card__label {
    color: #a09880;
    flex-shrink: 0;
  }

  .detail-card__value {
    color: #e8e0d0;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail-card__description {
    color: #a09880;
    margin-top: 4px;
    font-size: 10px;
    line-height: 1.4;
  }
</style>
