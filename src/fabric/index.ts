/**
 * KOS Design System - Fabric Layer
 * 
 * Composable UI components for LEAP apps.
 * Following ADR-2026-04-12-leap-substrate-refactor-001
 * 
 * Import from specific subpaths for tree-shaking:
 *   import { Button } from '@kos/design-system/fabric/u0-primitives';
 *   import { GlassBox } from '@kos/design-system/fabric/layout';
 * 
 * Or use the barrel import for convenience:
 *   import { GlassBox, ActivityRail, FileTree, KanbanBoard, KanbanColumn, KanbanCard, CommandBar, KeyboardShortcuts, ChatPanel, ToastContainer, StatusBar } from '@kos/design-system/fabric';
 */

// Layout
export { GlassBox, KanbanBoard, KanbanColumn, KanbanCard, CollapsiblePanel } from './layout';
export type { CardData, ColumnData, PanelPosition, PanelMode, PanelSnap } from './layout';

// Navigation
export { ActivityRail } from './navigation';
export type { RailItem, RailItemType } from './navigation';

// Data
export { FileTree } from './data';
export type { FileEntry } from './data';

// Input
export { CommandBar, KeyboardShortcuts } from './input';
export type { ShortcutBinding, ShortcutGroup } from './input';

// AI
export { ChatPanel } from './ai';
export type { Message, Citation, ContextCard } from './ai';

// Feedback
export { ToastContainer, StatusBar } from './feedback';
export type { ToastType, ViewMode, ConnectionState } from './feedback';
