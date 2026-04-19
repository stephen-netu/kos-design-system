// @kos/design-system — Epistemic transparency types
// Derived from LEAP-EPISTEMIC-TRANSPARENCY-SPEC.md

// --- ASSAY ---
export interface AssayClearanceView {
  checkpoint: 'PreIsr' | 'PreMettle' | 'PreEffector' | 'PreKnowledge';
  gate: 'Cleared' | 'Blocked';
  severity: 'None' | 'Minor' | 'Medium' | 'High' | 'Critical';
  weightedSum: number;            // 0.0–1.0
  signals: AssaySignalView[];
  computedAt: number;             // deterministic tick
  isDegraded: boolean;
}

export interface AssaySignalView {
  id: 'SaeClarity' | 'SchemaValid' | 'RiskTier' | 'SourceCredibility'
    | 'SemanticCoherence' | 'CapabilityCheck' | 'FeatureCoverage' | 'NoveltyGate';
  result: 'Pass' | 'Fail' | 'Unavailable';
  confidence: number | null;
  isHardGate: boolean;
  reason?: string;
}

// --- ALLAY ---
export interface AllayStageView {
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  confidence: number;             // 0.0–1.0
  stageName: 'Propose' | 'Parse' | 'Authorize' | 'Execute' | 'Trace' | 'Replicate';
}

// Mapping from assay_confidence (u8, 0-255) to stage:
// 0-50:    Stage 0 (Propose)
// 51-100:  Stage 1 (Parse)
// 101-150: Stage 2 (Authorize)
// 151-190: Stage 3 (Execute)
// 191-230: Stage 4 (Trace)
// 231-255: Stage 5 (Replicate)
export function confidenceToStage(confidence: number): AllayStageView {
  const stage: 0 | 1 | 2 | 3 | 4 | 5 =
    confidence <= 50 ? 0 :
    confidence <= 100 ? 1 :
    confidence <= 150 ? 2 :
    confidence <= 190 ? 3 :
    confidence <= 230 ? 4 : 5;
  const names: AllayStageView['stageName'][] = ['Propose','Parse','Authorize','Execute','Trace','Replicate'];
  return { stage, confidence: confidence / 255, stageName: names[stage] };
}

// --- EXPERT ---
export interface ExpertIdentity {
  name: 'Atelier' | 'Agora' | 'Ryu' | 'SOVEREIGN' | 'Agent';
  agentId?: string;
  domain: string;
}

// --- AVENUE ---
// Flat step view — matches the Rust AvenueStepView struct emitted by the Tauri command.
// Rich per-type fields are NOT present; use step_type + summary for display.
export interface AvenueStepView {
  step_type: 'query' | 'retrieve' | 'filter' | 'synthesize' | 'contradict' | 'verify' | string;
  summary: string;
}

export interface AvenueTraceView {
  steps: AvenueStepView[];
  isPartial: boolean;
  confidence: number;
  session_id: string;
}

// --- PROVENANCE ---
export type ProvenanceNodeType =
  | 'human_draft' | 'file_source' | 'web_source' | 'assay_evaluation'
  | 'sigchain_witness' | 'agent_research' | 'accord_replication'
  | 'access_epoch' | 'knowledge_merge' | 'supersession';

export interface ProvenanceChainNodeBase {
  id: string;
  timestamp: number;
  expert: ExpertIdentity;
  previousNodeId: string | null;
}

export type ProvenanceChainNode = ProvenanceChainNodeBase & (
  | { type: 'human_draft'; detail: { contentHash: string } }
  | { type: 'file_source'; detail: { filePath: string; contentHash: string } }
  | { type: 'web_source'; detail: { url: string; sourceUrlHash: string; sectionId?: string } }
  | { type: 'assay_evaluation'; detail: { checkpoint: string; gate: string; clearanceHash: string; weightedSum: number } }
  | { type: 'sigchain_witness'; detail: { witnessRef: string; assayConfidence: number } }
  | { type: 'agent_research'; detail: { sessionId: string; claimHash: string } }
  | { type: 'accord_replication'; detail: { accordId: string; sourceRealmId: string } }
  | { type: 'access_epoch'; detail: { accessCount: number; consolidatorId: string } }
  | { type: 'knowledge_merge'; detail: { inputHashes: string[] } }
  | { type: 'supersession'; detail: { supersededHash: string } }
);

// --- EPISTEMIC DETAIL ---
export interface KnowledgeEpistemicDetail {
  contentHash: string;
  title: string;
  source: string;
  // Phase 0: Rust returns null; will be ExpertIdentity once wt-710 is wired.
  expert?: ExpertIdentity | null;
  allay: AllayStageView;
  // Phase 0: Rust returns null; will be non-null once AssayClearanceFor is wired.
  assay?: AssayClearanceView | null;
  // Phase 0: Rust returns null; will be ProvenanceChainNode[] once wt-710 is wired.
  provenance: ProvenanceChainNode[] | null;
  // Phase 0: Rust returns null; will be AvenueTraceView once wt-711 is wired.
  avenue?: AvenueTraceView | null;
  convergence: number;
}

// --- AGGREGATE STATS ---
export interface EpistemicStats {
  totalKnowledge: number;
  byStage: Record<number, number>;
  byGate: Record<string, number>;
  pendingReview: number;
  averageConfidence: number;
}

// Rust-side alias (camelCase serde output from EpistemicStatsView).
// byStage / byGate are stub empty objects until wt-710 daemon aggregate is wired.
export type EpistemicStatsView = EpistemicStats;

// --- PARADIGM ---
export interface ParadigmDefinition {
  id: 'spatial' | 'temporal' | 'hierarchical' | 'graph' | 'trust';
  label: string;
  description: string;
  conceals: string;
  icon: string;
}
