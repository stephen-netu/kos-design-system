import type { PinnacleEvent, LoopPhase, NodeIndicatorState } from './types.js';

/** Minimum gap (ms) between claim and action to infer "thinking" */
const THINK_GAP_MS = 2000;

/** Track per-agent state for gap-based inference */
interface AgentTracker {
  lastEventSequence: number;
  lastEventTime: number;
  currentTask: string | null;
  loopPhase: LoopPhase;
}

/**
 * Tier A inference layer: derives PinnacleEvents from sigchain snapshot deltas.
 *
 * When tier B (direct Garden telemetry) arrives, this class is replaced.
 * The PinnacleEvent shape is the same — canvas code doesn't change.
 */
export class PinnacleEventInferrer {
  private agents: Map<string, AgentTracker> = new Map();

  /**
   * Process a batch of sigchain-derived changes and return PinnacleEvents.
   * Called by PinnacleView on each poller tick.
   */
  inferFromSnapshot(
    nodes: ReadonlyArray<{ id: string; kind: string; metadata: Record<string, unknown> }>,
    _edges: ReadonlyArray<{ source: string; target: string; relation: string }>,
    sequence: number,
  ): PinnacleEvent[] {
    const events: PinnacleEvent[] = [];
    const now = performance.now();

    // Find all agent nodes
    const agentNodes = nodes.filter((n) => n.kind === 'agent');

    for (const agent of agentNodes) {
      const existingTracker = this.agents.get(agent.id);
      const isFirstSeen = !existingTracker;
      const tracker = existingTracker ?? {
        lastEventSequence: 0,
        lastEventTime: now,
        currentTask: null,
        loopPhase: 'idle' as LoopPhase,
      };

      // Determine what the agent is doing from metadata
      const claimedTask = agent.metadata?.current_task as string | undefined;
      const actionSequence = (agent.metadata?.last_action_sequence as number) ?? 0;

      let loopPhase: LoopPhase = 'idle';
      let targetId: string | null = null;

      if (claimedTask && claimedTask !== tracker.currentTask) {
        // Agent just claimed a new task (or first seen with a task) → perceive
        loopPhase = 'perceive';
        targetId = claimedTask;
      } else if (claimedTask && actionSequence > tracker.lastEventSequence) {
        // Agent has a task and just performed an action → act
        loopPhase = 'act';
        targetId = claimedTask;
      } else if (!isFirstSeen && claimedTask && now - tracker.lastEventTime > THINK_GAP_MS) {
        // Gap inference only after baseline established — avoids false 'think' on first poll.
        // If constructed 3s before first poll, every agent would immediately enter think.
        loopPhase = 'think';
        targetId = claimedTask;
      } else if (claimedTask) {
        // Agent has a task, recent action, within gap → still acting
        loopPhase = tracker.loopPhase === 'idle' ? 'perceive' : tracker.loopPhase;
        targetId = claimedTask;
      }

      // Only emit event if phase changed or target changed
      if (loopPhase !== tracker.loopPhase || targetId !== tracker.currentTask) {
        events.push({
          agentId: agent.id,
          targetId,
          loopPhase,
          sequence,
        });
      }

      this.agents.set(agent.id, {
        lastEventSequence: actionSequence || tracker.lastEventSequence,
        lastEventTime:
          actionSequence > tracker.lastEventSequence ? now : tracker.lastEventTime,
        currentTask: claimedTask ?? null,
        loopPhase,
      });
    }

    // Detect departed agents (were tracked, no longer in nodes)
    const currentAgentIds = new Set(agentNodes.map((a) => a.id));
    for (const [agentId, tracker] of this.agents) {
      if (!currentAgentIds.has(agentId) && tracker.loopPhase !== 'idle') {
        events.push({
          agentId,
          targetId: null,
          loopPhase: 'idle',
          sequence,
        });
        this.agents.delete(agentId);
      }
    }

    return events;
  }

  /**
   * Convert persistent agent tracker state into NodeIndicatorState map for the canvas.
   *
   * Reads from this.agents (updated by inferFromSnapshot), NOT from emitted events.
   * Events only fire on state changes — reading from the tracker ensures a stable
   * 'think' pulse persists across ticks where nothing changes.
   *
   * Must be called after inferFromSnapshot on the same tick.
   */
  toIndicatorStates(): Map<string, NodeIndicatorState> {
    const states = new Map<string, NodeIndicatorState>();

    for (const [agentId, tracker] of this.agents) {
      if (tracker.loopPhase !== 'idle') {
        states.set(agentId, {
          loopPhase: tracker.loopPhase,
          phaseElapsedMs: 0,
          traceTargetId: tracker.currentTask,
        });
      }
    }

    return states;
  }

}
