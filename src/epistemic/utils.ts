// @kos/design-system — Epistemic shared utilities

import type { ProvenanceChainNode } from './types.js';

/**
 * Returns a human-readable label for a provenance chain node type.
 * Shared by ProvenanceChain and KnowledgeDetailPanel to avoid duplication.
 */
export function getProvenanceNodeLabel(node: ProvenanceChainNode): string {
  switch (node.type) {
    case 'human_draft': return 'Human drafted';
    case 'file_source': return `File: ${(node.detail as { filePath: string }).filePath}`;
    case 'web_source': return `Web: ${(node.detail as { url: string }).url}`;
    case 'assay_evaluation': {
      const d = node.detail as { checkpoint: string; gate: string; weightedSum: number };
      return `ASSAY ${d.checkpoint} — ${d.gate} (${(d.weightedSum * 100).toFixed(0)}%)`;
    }
    case 'sigchain_witness': {
      const d = node.detail as { witnessRef: string; assayConfidence: number };
      return `Witnessed on sigchain — ${d.witnessRef}`;
    }
    case 'agent_research': return 'Agent research step';
    case 'accord_replication': return 'Replicated via Accord';
    case 'access_epoch': {
      const d = node.detail as { accessCount: number };
      return `${d.accessCount} accesses consolidated`;
    }
    case 'knowledge_merge': return 'Knowledge merge';
    case 'supersession': return 'Supersedes prior entry';
    default: return (node as ProvenanceChainNode).type;
  }
}
