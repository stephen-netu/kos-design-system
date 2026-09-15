// L0 Layout — Layout value type
// Canonical definition per adr:clay-inspired-layout-layer-001

export type LayoutDirection = 'row' | 'column';

export type LayoutAlign = 'start' | 'center' | 'end' | 'stretch';

export type LayoutSizing =
  | 'fit'
  | 'grow'
  | 'fixed'
  | { min: number; max: number };

export interface Layout {
  direction: LayoutDirection;
  gap: number;
  padding: [number, number, number, number];
  align: LayoutAlign;
  childAlignment: LayoutAlign;
  sizing: LayoutSizing;
}
