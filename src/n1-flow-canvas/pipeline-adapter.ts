// N1 Pipeline Adapter — maps PipelineState → GraphSnapshot for FlowCanvas
// READ-ONLY consumer of ~/.kos/pipeline/<run-id>/pipeline-state.json
// S-02: deterministic ordering — all collections Array/Map

import type { GraphSnapshot, GraphNode, GraphEdge } from './types.js';

// ── PipelineState types (mirrors Rust serde types from app.rs) ───────────────

export interface PipelineTermination {
  reason: string;
  final_tokens: number;
}

export interface PipelineStageData {
  id: string;
  name: string;
  status: PipelineStatus;
  attempt: number;
  selected_model: string | null;
  termination: PipelineTermination | null;
  artifact_path: string | null;
  error: string | null;
  locked_by: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export type PipelineStatus = 'Pending' | 'Running' | 'Passed' | 'Failed' | 'Skipped' | 'Crashed';

export interface PipelineState {
  run_id: string;
  task_id: string;
  requested_id: string;
  base_main_sha: string | null;
  prior_tos_status: string | null;
  worktree_path: string | null;
  stages: PipelineStageData[];
  remediation_count: number;
  max_remediation: number;
  locked_by: string;
  created_at: string;
  updated_at: string;
}

// ── Token budgets (mirrors driver.rs) ────────────────────────────────────────

const STAGE_TOKEN_BUDGETS: Record<string, number> = {
  intake: 10_000,
  research: 40_000,
  implement: 120_000,
  review: 40_000,
  integrate: 10_000,
};

function formatTokens(t: number): string {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`;
  if (t >= 1_000) return `${(t / 1_000).toFixed(0)}K`;
  return `${t}`;
}

// ── Status color mapping ─────────────────────────────────────────────────────

const STAGE_COLORS: Record<PipelineStatus, string> = {
  Pending:  '#646b72',
  Running:  '#3fae9f',
  Passed:   '#3fae9f',
  Failed:   '#cf4e4e',
  Skipped:  '#4a4f55',
  Crashed:  '#cf4e4e',
};

function statusIcon(status: PipelineStatus): string {
  switch (status) {
    case 'Pending':  return '○';
    case 'Running':  return '●';
    case 'Passed':   return '✓';
    case 'Failed':   return '✗';
    case 'Skipped':  return '−';
    case 'Crashed':  return '💀';
  }
}

// ── Adapter ──────────────────────────────────────────────────────────────────

export const PIPELINE_STAGE_NAMES = ['intake', 'research', 'implement', 'review', 'integrate'];

export function pipelineStateToSnapshot(state: PipelineState): GraphSnapshot {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const stageOrder = PIPELINE_STAGE_NAMES;
  const stageMap = new Map<string, PipelineStageData>();
  for (const s of state.stages) stageMap.set(s.name, s);

  let prevName: string | null = null;

  for (const name of stageOrder) {
    const stage = stageMap.get(name);
    const status: PipelineStatus = stage?.status ?? 'Pending';
    const color = STAGE_COLORS[status];
    const icon = statusIcon(status);

    // Build label with status icon, name, attempt badge, token budget
    let label = `${icon} ${name}`;
    if (stage && stage.attempt > 1) {
      label += ` #${stage.attempt}`;
    }

    // Collect badge-like data into node.data for FlowCanvas rendering
    const data: Record<string, unknown> = {
      status,
      color,
      icon,
      pipelineStatus: status,
    };

    if (stage) {
      data.attempt = stage.attempt;
      if (stage.selected_model) data.model = stage.selected_model;
      data.budget = formatTokens(STAGE_TOKEN_BUDGETS[name] ?? 0);
      if (stage.error) data.error = stage.error;
      if (stage.started_at) data.started_at = stage.started_at;
      if (stage.completed_at) data.completed_at = stage.completed_at;
      if (stage.termination) {
        data.termination = stage.termination.reason;
        data.final_tokens = stage.termination.final_tokens;
      }
    }

    nodes.push({ id: name, label, data });

    // Sequential handoff edge: prev → current
    if (prevName) {
      edges.push({
        id: `${prevName}->${name}`,
        sourceId: prevName,
        targetId: name,
        label: 'handoff',
      });
    }
    prevName = name;
  }

  // Back-edge for active remediation: review → implement
  if (state.remediation_count > 0 && state.remediation_count < state.max_remediation) {
    const reviewStage = stageMap.get('review');
    if (reviewStage && reviewStage.status === 'Failed') {
      edges.push({
        id: 'review->implement:remediate',
        sourceId: 'review',
        targetId: 'implement',
        label: 'remediate',
      });
    }
  }

  // Queue tail node (D14) — shows pending queue depth if available
  // For now, show remediation count as queue indicator
  if (state.remediation_count > 0) {
    nodes.push({
      id: 'remediation',
      label: `↻ x${state.remediation_count}`,
      data: { status: 'remediation', count: state.remediation_count },
    });
    edges.push({
      id: 'review->remediation',
      sourceId: 'review',
      targetId: 'remediation',
      label: 'remediate',
    });
    edges.push({
      id: 'remediation->implement',
      sourceId: 'remediation',
      targetId: 'implement',
      label: 're-enter',
    });
  }

  return {
    nodes,
    edges,
    focusNodeId: findFocusNode(stageMap),
  };
}

function findFocusNode(stageMap: Map<string, PipelineStageData>): string | null {
  for (const name of PIPELINE_STAGE_NAMES) {
    const stage = stageMap.get(name);
    if (stage && stage.status === 'Running') return name;
  }
  for (const name of PIPELINE_STAGE_NAMES) {
    const stage = stageMap.get(name);
    if (stage && stage.status === 'Pending') return name;
  }
  return PIPELINE_STAGE_NAMES[0] ?? null;
}

export function createEmptyPipelineSnapshot(): GraphSnapshot {
  return {
    nodes: PIPELINE_STAGE_NAMES.map((name, i) => ({
      id: name,
      label: `○ ${name}`,
      data: { status: 'Pending', pipelineStatus: 'Pending' },
    })),
    edges: PIPELINE_STAGE_NAMES.slice(0, -1).map((name, i) => ({
      id: `${name}->${PIPELINE_STAGE_NAMES[i + 1]}`,
      sourceId: name,
      targetId: PIPELINE_STAGE_NAMES[i + 1],
      label: 'handoff',
    })),
    focusNodeId: PIPELINE_STAGE_NAMES[0],
  };
}
