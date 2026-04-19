// Plugin manifest types — capability-first app integration contract
// Apps declare capabilities via typed manifest; shell aggregates at build time.
//
// Synchronized with: SOVEREIGN/effectors/e0-plugin-primitives/src/lib.rs
// Canonical Rust types: PluginManifest, TauriSubstrateExtension, ShellExtension
// See ADR: .gears/_realm/adr/2026-04-18-plugin-contract-unification.md

import type { Component } from 'svelte';

/**
 * Plugin capability — domain:action format.
 * Known domains are typed; unknown capabilities fall through to string (Named escape hatch).
 */
export type KnownCapability =
  | 'view:spatial'
  | 'view:agora'
  | 'view:sovereign'
  | 'view:terminal'
  | 'storage:read'
  | 'storage:write'
  | 'net:access'
  | 'fs:access'
  | 'agent:interact'
  | 'p2p.connect'
  | 'p2p.messaging'
  | 'persistence.local'
  | 'persistence.sovereign'
  | 'knowledge.search'
  | 'knowledge.ingest'
  | 'llm.chat'
  | 'llm.embeddings'
  | 'identity.read'
  | 'identity.manage';

/** Any capability string — unknown domains map to PluginCapability::Named(_) in Rust. */
export type PluginCapability = KnownCapability | (string & {});

/** Lazy component factory — returns a dynamic import promise */
export type ViewFactory = () => Promise<{ default: Component }>;

/** Plugin view declarations */
export interface PluginViews {
  /** Primary app view rendered in the shell viewport */
  main: ViewFactory;
  /** Optional settings panel */
  settings?: ViewFactory;
}

/**
 * Plugin manifest — the canonical frontend contract.
 *
 * Build-time generated from leap-plugin.toml via generate-plugin-registry.ts.
 * Synchronized with Rust: e0-plugin-primitives::PluginManifest
 */
export interface PluginManifest {
  /** Unique plugin identifier (e.g., 'agora', 'atelier', 'ryu') */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Short description shown in plugin store / tooltips */
  description: string;
  /** Icon name from the design system icon set (e.g., 'MessageCircle') */
  icon: string;
  /** Optional keyboard shortcut (e.g., 'Ctrl+Shift+A') */
  shortcut?: string;
  /** Integration tier (0=external, 1=built-in, 2=core, 3=sovereign) */
  tier?: number;
  /** Capabilities this plugin provides to the capability graph */
  provides: PluginCapability[];
  /** Capabilities this plugin requires from the shell/runtime */
  requires: PluginCapability[];
  /** View factories for lazy-loading components */
  views: PluginViews;
}
