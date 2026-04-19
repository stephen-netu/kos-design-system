// Platform HUD Protocol — cross-boundary telemetry contract
//
// Plugins (Ryu, Agora, etc.) emit hud:contribution Tauri events.
// LEAP's hudStore collects them; LeapHud renders them generically.
// See: .gears/_realm/architecture/leap-compositor-protocol-001.md

export type HudIndicator = 'nominal' | 'degraded' | 'offline';

export interface HudContribution {
  /** Stable ID, e.g. "ryu:spark", "agora:peers" */
  id: string;
  /** Short display label */
  label: string;
  /** Rendered value — string or number */
  value: string | number;
  /** Visual state */
  indicator: HudIndicator;
  /** Lower = left-most in HUD bar */
  priority: number;
}
