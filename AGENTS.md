# AGENTS.md — Design System

## Identity

- **Repo**: `/Users/netu/Projects/KOS/design-system`
- **Type**: Svelte 5 component library and design token system
- **Role**: Shared UI foundation for all KOS applications. Published to npm as `@stephen-netu/design-system`.

## KOS Context

- **Umbrella root**: `/Users/netu/Projects/KOS`
- **Architecture docs**: `.gears/_realm/architecture/`
- **All KOS-wide rules** (T-01 Repo Boundary Integrity, topology validation) apply. Never `git add` peer repos at the umbrella root. See `/Users/netu/Projects/KOS/AGENTS.md`.

## Stack

- **Library**: Svelte 5 (`^5.55.0`), runes mode (`$state`, `$derived`, `$effect`, `$props`)
- **Format**: Component library — NOT a Tauri app, NOT a standalone application
- **No Rust backend** — this is a pure frontend library with no IPC, no sidecar, no `src-tauri/`
- **Package manager**: pnpm
- **Published as**: `@stephen-netu/design-system` on npm

## UI/UX Conventions

- **Svelte 5 runes only** — no `let` reactive sugar from Svelte 4, no stores unless migration is underway
- **Design tokens**: This package IS the token system. Define all tokens here as CSS custom properties in `base.css`
- **`visibility:hidden` rule**: Use `visibility:hidden` (not `display:none`) when toggling element visibility to preserve layout flow
- **No inline styles** — components must consume design tokens exclusively
- **Component API**: Use `$props()` with TypeScript interfaces; prefer `$bindable()` props for two-way binding where needed

## Role-Specific Notes

Design System is the single source of truth for visual consistency across KOS apps (Agora, Amandla, Atelier, Guanxi, Loge, Mir, Paracosm, Sonda, Stinger). Every component and token consumed by peer apps originates here. Changes here propagate to all consumers — treat breaking changes with care. Components should be framework-idiomatic Svelte 5 with zero external runtime dependencies beyond Svelte itself.

## Build & Check

```bash
pnpm check       # svelte-check + TypeScript
pnpm build       # vite library build
pnpm pack        # verify package output before publish
```
