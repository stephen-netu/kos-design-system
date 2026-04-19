/**
 * H0 App Shell — Global LEAP chrome components.
 *
 * H = Host/HUD. Free letter in both SOVEREIGN HDA domain assignments and
 * existing DS prefixes (p/u/l/s/t/f/d/n). Replaces the prior a0- prefix
 * which collided conceptually with SOVEREIGN's A=Axioms HDA domain.
 *
 * These components appear at the top of every LEAP app (Ryu, Atelier, Agora)
 * and provide the shared control surface for system state, intent dispatch,
 * and resource visibility. They are prop-driven (no store imports).
 */

export { default as CommandBar } from './command-bar/CommandBar.svelte';
export { ClarificationOverlay } from './clarification-overlay/index';
