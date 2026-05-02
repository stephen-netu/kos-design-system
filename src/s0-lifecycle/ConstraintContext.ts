// S0 Lifecycle — Constraint Context
// Provides size constraint information during the layout calculation phase.

export interface SizeConstraint {
  /** Minimum width in pixels */
  min: number;
  /** Preferred/ideal width in pixels */
  preferred: number;
  /** Maximum width in pixels (Infinity = unbounded) */
  max: number;
}

export interface SizeConstraints {
  width: SizeConstraint;
  height: SizeConstraint;
}

/**
 * ConstraintContext is provided during the constraint-solving phase.
 * Components query available space and declare their size requirements.
 */
export interface ConstraintContext {
  /** Available viewport/container dimensions */
  readonly available: SizeConstraints;

  /** Current scale factor (1.0 = native, >1 = zoomed in) */
  readonly scale: number;

  /** Request a specific size for this component */
  constrain(width: number, height: number): SizeConstraints;

  /** Query the constraint for a child slot by key */
  childConstraint(key: string): SizeConstraints | undefined;
}
