// S0 Lifecycle — Component Lifecycle Interface
// Defines the phased lifecycle that components implement.
//
// Lifecycle phases (executed in order):
//   1. constrain  — Compute size requirements from available space
//   2. layout     — Receive resolved bounds, position children
//   3. interact   — Handle input events, consume or propagate
//   4. render     — Issue draw commands to scene graph
//
// This is the core abstraction: any component with structured
// layout/event/render behavior implements Lifecycle.

import type { ConstraintContext, SizeConstraints } from './ConstraintContext';
import type { LayoutContext } from './LayoutContext';
import type { InteractionContext, EventOutcome } from './InteractionContext';
import type { RenderContext } from './RenderContext';

/**
 * Lifecycle — the core component interface for phased rendering.
 *
 * Each method corresponds to a distinct phase in the component's
 * per-frame lifecycle. Not all phases must be implemented; default
 * no-op implementations allow selective override.
 *
 * Usage in Svelte 5:
 *   Components typically wrap a Lifecycle implementation via $state
 *   and delegate lifecycle calls from Svelte's reactive hooks.
 */
export interface Lifecycle {
  /**
   * Phase 1: Constraint solving.
   * Query available space and return size requirements.
   * Called before layout.
   */
  constrain?(ctx: ConstraintContext): SizeConstraints;

  /**
   * Phase 2: Layout resolution.
   * Receive final bounds after constraint solving.
   * Position children, request repaints if needed.
   */
  layout?(ctx: LayoutContext): void;

  /**
   * Phase 3: Interaction handling.
   * Receive an input event and decide whether to consume it.
   * Return 'consumed' to stop propagation, 'propagated' to continue.
   */
  interact?(ctx: InteractionContext): EventOutcome;

  /**
   * Phase 4: Rendering.
   * Issue draw commands to the scene via RenderContext.
   * This is the only phase that produces visual output.
   */
  render?(ctx: RenderContext): void;
}

/**
 * Helper type: a Lifecycle phase name.
 */
export type LifecyclePhase = 'constrain' | 'layout' | 'interact' | 'render';

/**
 * Phase execution order (deterministic).
 */
export const LIFECYCLE_PHASES: readonly LifecyclePhase[] = [
  'constrain',
  'layout',
  'interact',
  'render',
] as const;

/**
 * Execute all implemented phases on a Lifecycle instance in order.
 * Skips phases that are not implemented (undefined).
 */
export function executeLifecycle(
  lifecycle: Lifecycle,
  contexts: {
    constrain: ConstraintContext;
    layout: LayoutContext;
    interact?: InteractionContext;
    render: RenderContext;
  }
): EventOutcome | undefined {
  let outcome: EventOutcome | undefined;

  // Phase 1: Constrain (always runs if implemented)
  lifecycle.constrain?.(contexts.constrain);

  // Phase 2: Layout (always runs if implemented)
  lifecycle.layout?.(contexts.layout);

  // Phase 3: Interact (only if event context provided)
  if (contexts.interact) {
    outcome = lifecycle.interact?.(contexts.interact);
  }

  // Phase 4: Render (always runs if implemented)
  lifecycle.render?.(contexts.render);

  return outcome;
}
