// N4 LayoutOrchestrator — Coordinates algorithm providers, manages transitions
// Owns the current layout state and drives the TransitionAnimator.
// Includes 500ms debounce and 3-tick stability before suggesting.

import type {
  AlgorithmProvider,
  LayoutAlgorithm,
  ManifoldSnapshot,
  LayoutPreferences,
  ClassificationResult,
  LayoutSuggestion,
  NodeLayout,
} from './types.js';
import { DEFAULT_LAYOUT_PREFERENCES } from './types.js';
import { classifyTopology, STABILITY_TICKS } from './classifier.js';
import { TransitionAnimator, EASING_FUNCTIONS } from './transition.js';

/** Debounce interval matching REFLEX tick cadence. */
const CLASSIFY_DEBOUNCE_MS = 500;

export interface OrchestratorState {
  /** Currently active layout algorithm. */
  activeAlgorithm: LayoutAlgorithm;
  /** Current node positions (interpolated during transition). */
  positions: Map<string, NodeLayout>;
  /** Current BFS order for edge reveal. */
  bfsOrder: ReadonlyArray<string>;
  /** Whether a transition is in progress. */
  transitioning: boolean;
  /** Last classification result. */
  lastClassification: ClassificationResult | null;
  /** Current suggestion (null if none, or dismissed/pinned). */
  suggestion: LayoutSuggestion | null;
}

export type OrchestratorListener = (state: OrchestratorState) => void;

export class LayoutOrchestrator {
  private providers: Map<LayoutAlgorithm, AlgorithmProvider>;
  private prefs: LayoutPreferences;
  private animator: TransitionAnimator;
  private listeners: OrchestratorListener[] = [];

  // Current state
  private _activeAlgorithm: LayoutAlgorithm = 'manifold';
  private _positions: Map<string, NodeLayout> = new Map();
  private _bfsOrder: ReadonlyArray<string> = [];
  private _transitioning = false;
  private _lastClassification: ClassificationResult | null = null;
  private _suggestion: LayoutSuggestion | null = null;
  private _abortTransition: (() => void) | null = null;

  // Debounce state
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _pendingSnapshot: ManifoldSnapshot | null = null;
  private _pendingWidth = 0;
  private _pendingHeight = 0;

  // 3-tick stability counter
  private _stabilityAlgorithm: LayoutAlgorithm | null = null;
  private _stabilityCount = 0;

  constructor(
    providers: AlgorithmProvider[],
    prefs: LayoutPreferences = DEFAULT_LAYOUT_PREFERENCES,
  ) {
    this.providers = new Map();
    for (const p of providers) {
      this.providers.set(p.algorithm, p);
    }
    this.prefs = prefs;
    this.animator = new TransitionAnimator();
  }

  get state(): OrchestratorState {
    return {
      activeAlgorithm: this._activeAlgorithm,
      positions: this._positions,
      bfsOrder: this._bfsOrder,
      transitioning: this._transitioning,
      lastClassification: this._lastClassification,
      suggestion: this._suggestion,
    };
  }

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(listener: OrchestratorListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const state = this.state;
    for (const l of this.listeners) l(state);
  }

  /**
   * Request layout for the given snapshot. Debounced to 500ms.
   * If currently transitioning (AM-Morph), the request is queued.
   */
  requestLayout(
    snapshot: ManifoldSnapshot,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    this._pendingSnapshot = snapshot;
    this._pendingWidth = canvasWidth;
    this._pendingHeight = canvasHeight;

    // If transitioning, don't schedule — will pick up after morph completes
    if (this._transitioning) return;

    // Debounce
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }

    // First layout (no positions yet) runs immediately
    if (this._positions.size === 0) {
      this.executeLayout();
      return;
    }

    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      this.executeLayout();
    }, CLASSIFY_DEBOUNCE_MS);
  }

  private async executeLayout(): Promise<void> {
    const snapshot = this._pendingSnapshot;
    if (!snapshot || snapshot.nodes.length === 0) return;

    const canvasWidth = this._pendingWidth;
    const canvasHeight = this._pendingHeight;

    // Abort any in-flight transition
    this._abortTransition?.();

    // Classify
    const classification = classifyTopology(snapshot);
    this._lastClassification = classification;

    // Determine target algorithm
    let targetAlgorithm: LayoutAlgorithm;
    if (this.prefs.lockedAlgorithm !== null) {
      targetAlgorithm = this.prefs.lockedAlgorithm;
    } else {
      targetAlgorithm = classification.recommended;
    }

    // Update suggestion with 3-tick stability
    this.updateSuggestion(classification, targetAlgorithm);

    const provider = this.providers.get(targetAlgorithm);
    if (!provider) return;

    // Compute target layout
    const targetLayout = await provider.layout(snapshot, canvasWidth, canvasHeight);

    // If no current positions or animation disabled, apply immediately
    if (this._positions.size === 0 || !this.prefs.animate) {
      this._activeAlgorithm = targetAlgorithm;
      this._positions = targetLayout.positions;
      this._bfsOrder = targetLayout.bfsOrder;
      this._transitioning = false;
      this.notify();
      return;
    }

    // AM-Morph: animate from current → target
    this._transitioning = true;
    this._activeAlgorithm = targetAlgorithm;
    this.notify();

    const easing = EASING_FUNCTIONS[this.prefs.easing] ?? EASING_FUNCTIONS.easeInOutCubic;

    await new Promise<void>((resolve) => {
      let cancelled = false;
      this._abortTransition = () => { cancelled = true; };

      this.animator.animate(
        this._positions,
        targetLayout.positions,
        this.prefs.morphDurationMs,
        easing,
        (frame) => {
          if (cancelled) return;
          this._positions = frame.positions;
          this.notify();
        },
        () => {
          this._abortTransition = null;
          if (cancelled) {
            resolve();
            return;
          }
          this._positions = targetLayout.positions;
          this._bfsOrder = targetLayout.bfsOrder;
          this._transitioning = false;
          this.notify();

          // Check if a new snapshot arrived during the morph.
          // Route through requestLayout (debounce) rather than calling executeLayout()
          // directly — prevents unbounded promise chaining under fast data arrival.
          if (this._pendingSnapshot !== snapshot) {
            this.requestLayout(this._pendingSnapshot!, this._pendingWidth, this._pendingHeight);
          }
          resolve();
        },
      );
    });
  }

  /** 3-tick stability: only suggest after classifier recommends the same alternative 3 times. */
  private updateSuggestion(classification: ClassificationResult, currentTarget: LayoutAlgorithm): void {
    if (this.prefs.lockedAlgorithm !== null) {
      // User has pinned — no suggestions
      this._suggestion = null;
      return;
    }

    if (classification.recommended === currentTarget) {
      // Classifier agrees with current — clear stability counter
      this._stabilityAlgorithm = null;
      this._stabilityCount = 0;
      this._suggestion = null;
      return;
    }

    // Classifier disagrees — track stability
    if (this._stabilityAlgorithm === classification.recommended) {
      this._stabilityCount++;
    } else {
      this._stabilityAlgorithm = classification.recommended;
      this._stabilityCount = 1;
    }

    if (this._stabilityCount >= STABILITY_TICKS) {
      this._suggestion = {
        algorithm: classification.recommended,
        confidence: classification.confidence,
        reason: classification.reason,
        dismissed: false,
        pinned: false,
      };
    }
  }

  /** Accept a layout suggestion — switch to suggested algorithm. */
  acceptSuggestion(): void {
    if (!this._suggestion) return;
    this._activeAlgorithm = this._suggestion.algorithm;
    this._suggestion = null;
    this._stabilityCount = 0;
    if (this._pendingSnapshot) {
      // Set transitioning before executeLayout so requestLayout calls that arrive
      // before executeLayout's first await are queued rather than double-fired.
      this._transitioning = true;
      this.setPreferences({ lockedAlgorithm: this._activeAlgorithm });
      this.executeLayout();
    }
  }

  /** Dismiss a layout suggestion — keep current algorithm. */
  dismissSuggestion(): void {
    if (this._suggestion) {
      this._suggestion = { ...this._suggestion, dismissed: true };
    }
    this._stabilityCount = 0;
    this.notify();
  }

  /** Pin the current layout (disable auto-classification). */
  pinLayout(): void {
    this.prefs.lockedAlgorithm = this._activeAlgorithm;
    this._suggestion = null;
    this.notify();
  }

  /** Unpin — re-enable auto-classification. */
  unpinLayout(): void {
    this.prefs.lockedAlgorithm = null;
    this._stabilityCount = 0;
    this.notify();
  }

  /** Update preferences (e.g. user toggles animation). */
  setPreferences(prefs: Partial<LayoutPreferences>): void {
    this.prefs = { ...this.prefs, ...prefs };
  }

  /** Clean up. */
  destroy(): void {
    this._abortTransition?.();
    if (this._debounceTimer !== null) clearTimeout(this._debounceTimer);
    this.listeners = [];
  }
}
