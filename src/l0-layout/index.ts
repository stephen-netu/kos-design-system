// L0 Layout — Layout composition templates

export { default as WorkspaceLayout } from './workspace/WorkspaceLayout.svelte';
export { default as ChatViewLayout } from './chat-view/ChatViewLayout.svelte';
export { default as KanbanViewLayout } from './kanban/KanbanViewLayout.svelte';
export { default as KanbanBoard } from './kanban/KanbanBoard.svelte';
export { default as KanbanColumn } from './kanban/KanbanColumn.svelte';
export { default as KanbanCard } from './kanban/KanbanCard.svelte';

// Grove & Accord
export { default as MemberBadge } from './grove/MemberBadge.svelte';
export { default as MemberList } from './grove/MemberList.svelte';
export { default as GroveCard } from './grove/GroveCard.svelte';
export { default as AccordCard } from './grove/AccordCard.svelte';
export type {
  TrustState,
  GovernanceMode,
  MemberInfo,
  GroveInfo,
  AccordInfo,
} from './grove/grove-types';

// Epistemic organisms
export * from './epistemic/index.js';

// Block Writer — visual block-based writing layout (controlled component)
export {
  BlockWriter,
  BlockItem,
  BlockHeader,
  BlockContent,
  BlockConnectionLines,
  PHASE_CONFIG,
  renderMarkdown,
  renderInlineMarkdown,
} from './block-writer/index.js';

export type {
  WritingBlock,
  BlockConnection,
  BlockWriterSchema,
  BlockWriterConfig,
  WritingPhase,
  BlockOrigin,
} from './block-writer/index.js';
