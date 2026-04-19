<script lang="ts">
  import type { ProvenanceChainNode } from '../../epistemic/types.js';
  import { getProvenanceNodeLabel } from '../../epistemic/utils.js';
  import ExpertBadge from '../../u0-primitives/expert-badge/ExpertBadge.svelte';

  interface Props {
    nodes: ProvenanceChainNode[];
    onnodeclick?: (node: ProvenanceChainNode) => void;
    class?: string;
  }

  let { nodes, onnodeclick, class: className = '' }: Props = $props();

  function getNodeActionLabel(node: ProvenanceChainNode): string | null {
    switch (node.type) {
      case 'file_source': return 'Open source';
      case 'web_source': return 'Open URL';
      case 'sigchain_witness': return 'View on chain';
      case 'assay_evaluation': return 'View clearance';
      case 'accord_replication': return 'View source Realm';
      case 'agent_research': return 'View avenue';
      default: return null;
    }
  }
</script>

<div class="ds-provenance-chain {className}">
  {#each nodes as node, i}
    <div class="node">
      <!-- Timeline track -->
      <div class="track">
        <div class="bullet"></div>
        {#if i < nodes.length - 1}
          <div class="line"></div>
        {/if}
      </div>

      <!-- Node content -->
      <div class="content">
        <div class="node-header">
          <ExpertBadge expert={node.expert} size="sm" showName={false} />
          <span class="node-label">{getProvenanceNodeLabel(node)}</span>
          <span class="node-tick">tick {node.timestamp}</span>
        </div>
        <div class="node-expert-name">{node.expert.name}</div>

        {#if getNodeActionLabel(node)}
          <button
            class="node-action"
            type="button"
            onclick={() => onnodeclick?.(node)}
          >
            {getNodeActionLabel(node)}
          </button>
        {/if}
      </div>
    </div>
  {/each}

  {#if nodes.length === 0}
    <div class="empty">No provenance data available</div>
  {/if}
</div>

<style>
  .ds-provenance-chain {
    display: flex;
    flex-direction: column;
    font-family: var(--font-sans);
  }

  .node {
    display: flex;
    gap: var(--space-3);
    min-height: 3rem;
  }

  .track {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 16px;
  }

  .bullet {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-accent);
    border: 2px solid var(--color-bg-panel);
    outline: 1px solid var(--color-accent);
    flex-shrink: 0;
    margin-top: 4px;
  }

  .line {
    width: 2px;
    flex: 1;
    background: var(--border-default);
    min-height: 1.5rem;
    margin-top: 4px;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: var(--space-3);
    flex: 1;
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .node-label {
    font-size: var(--text-xs);
    color: var(--color-text-primary);
    flex: 1;
    min-width: 0;
  }

  .node-tick {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  .node-expert-name {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    padding-left: 1px;
  }

  .node-action {
    background: none;
    border: none;
    padding: 0;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-accent);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    text-align: left;
  }

  .node-action:hover {
    color: var(--color-accent-hover);
  }

  .empty {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
    padding: var(--space-4) 0;
    text-align: center;
  }
</style>
