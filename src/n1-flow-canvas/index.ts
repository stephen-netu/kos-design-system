// N1 Flow Canvas — Canvas 2D graph with ELK layout + BFS edge reveal
// Depends on: graphology, elkjs, perfect-arrows, svelte-canvas

export type {
  GraphNode,
  GraphEdge,
  GraphSnapshot,
  NodeLayout,
  LayoutResult,
  WorkerIn,
  WorkerOut,
  WorkerMessage,
  GraphStateApi,
  EdgeRevealState,
} from './types.js';

export { EDGE_REVEAL_STAGGER_MS } from './types.js';

export { default as FlowCanvas } from './FlowCanvas.svelte';
export { GraphState } from './graph-state.svelte';
export { nodeHitTest, domEventToCanvasCoords, parseMentionEdges, parseGroupedSequenceEdges } from './utils.js';
export {
  pipelineStateToSnapshot,
  createEmptyPipelineSnapshot,
  PIPELINE_STAGE_NAMES,
} from './pipeline-adapter.js';
export type {
  PipelineState,
  PipelineStageData,
  PipelineStatus,
  PipelineTermination,
} from './pipeline-adapter.js';
