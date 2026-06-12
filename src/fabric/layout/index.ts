/**
 * Fabric Layout Components
 *
 * Layout primitives for app structure.
 *
 * @package @kos/design-system/fabric/layout
 * @adr 2026-04-12-leap-substrate-refactor-001
 */

export { default as GlassBox } from './GlassBox.svelte';

// Kanban — canonical l0-layout components re-exported for fabric compatibility (F-24)
export { default as KanbanBoard } from './KanbanBoard.svelte';
export { default as KanbanColumn } from './KanbanColumn.svelte';
export { default as KanbanCard } from './KanbanCard.svelte';
export type { ColumnData } from '../../l0-layout/kanban/KanbanColumn.svelte';
export type { CardData } from '../../l0-layout/kanban/KanbanCard.svelte';

// Collapsible Panel
export { default as CollapsiblePanel } from './CollapsiblePanel.svelte';
export type { PanelPosition, PanelMode, PanelSnap } from './CollapsiblePanel.svelte';
