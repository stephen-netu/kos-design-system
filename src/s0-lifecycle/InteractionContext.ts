// S0 Lifecycle — Interaction Context
// Provides event dispatch and consumption during the interaction phase.

export type EventOutcome =
  | 'consumed'    // Event handled, stop propagation
  | 'propagated'; // Event not handled, continue to parent

export interface InteractionEvent {
  /** DOM event type */
  readonly type: string;
  /** Native DOM event (for advanced use) */
  readonly nativeEvent: Event;
  /** Whether this event has been consumed */
  readonly consumed: boolean;
  /** The component-local coordinates of the event */
  readonly position?: { x: number; y: number };
  /** Keyboard modifiers active during event */
  readonly modifiers?: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}

/**
 * InteractionContext is provided during the event handling phase.
 * Components receive events and decide whether to consume or propagate them.
 */
export interface InteractionContext {
  /** The event being dispatched */
  readonly event: InteractionEvent;

  /** Consume the event — stops propagation to ancestors */
  consume(): void;

  /** Request focus for this component */
  requestFocus(): void;

  /** Release focus from this component */
  releaseFocus(): void;

  /** Request the platform show a soft keyboard (mobile) */
  requestSoftKeyboard(): void;
}
