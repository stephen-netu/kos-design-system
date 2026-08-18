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
- **UI copy (STE-strict)**: All user-facing copy (labels, tooltips, error toasts, empty states, placeholders) follows [`docs/copy.md`](./docs/copy.md) — STE-strict per `MANDATE-8` in `.gears/AGENT_MANDATES.md`. One word per concept, active voice, sentence case, no marketing adjectives. Review copy with the `ste-writing` agent skill.

## Role-Specific Notes

Design System is the single source of truth for visual consistency across KOS apps (Agora, Amandla, Atelier, Guanxi, Loge, Mir, Paracosm, Sonda, Stinger). Every component and token consumed by peer apps originates here. Changes here propagate to all consumers — treat breaking changes with care. Components should be framework-idiomatic Svelte 5 with zero external runtime dependencies beyond Svelte itself.

## Build & Check

```bash
npx svelte-check --tsconfig ./tsconfig.json   # type-check (svelte-check + tsc)
pnpm build                                     # svelte-package → dist/
npm pack --dry-run                             # verify package output before publish
```

Note: the `pnpm check` script referenced in older docs is no longer wired in
`package.json`. The CI workflow (`.gitea/workflows/ci.yml`) and the LEAP
`check-and-release` job invoke `npx svelte-check` directly.

## Release & Propagation

Design system is the **single source of truth** for the KOS visual layer.
Releasing here is what propagates changes to every consumer app.

### Versioning

This package follows [changesets](https://github.com/changesets/changesets):

```bash
# 1. Add a changeset describing the change
$EDITOR .changeset/<slug>.md
# frontmatter:
#   ---
#   "@stephen-netu/design-system": patch   # or minor / major
#   ---
#   <one-line summary>

# 2. Apply the changeset (bumps package.json + writes CHANGELOG.md)
pnpm changeset version

# 3. Inspect the diff, commit
git add CHANGELOG.md package.json
git commit -m "chore: version packages — 0.2.x → 0.2.y"

# 4. Push (CI on main publishes; or run locally)
git push beast main
npm publish                       # local publish — CI does this on push to main
```

Patch releases are the default. Use `minor` for additive components or new
subpath exports, `major` for breaking changes (renamed props, removed tokens,
new peer-dep ranges).

### Propagation to consumer apps

Consumer apps declare the package from the **npm registry** with a semver
range (no `file:` / `link:` references allowed — see T-01):

```jsonc
// in agora / amandla / atelier / guanxi / LEAP/shell / LEAP/s4-substrate-runtime
// / loge / mir / paracosm / predio / ryu / sonda / stinger package.json
"@stephen-netu/design-system": "^0.2.0"   // accepts any 0.2.x
```

Apps do **not** auto-restart. To pick up a new release they re-resolve deps:

```bash
pnpm update @stephen-netu/design-system   # bumps lockfile 0.2.0 → 0.2.1
```

Or via Renovate (see below) — patch + minor updates are auto-merged into
the consumer's `main`.

### Renovate auto-merge

Each consumer peer has a `renovate.json` that:

- Groups all `@stephen-netu/design-system` updates under one PR per consumer
- Auto-merges `patch` and `minor` updates (kept in lockstep with design-system)
- Leaves `major` updates for manual review (breaking changes)

The design-system repo itself uses Renovate's `config:recommended` to track
its own deps (Svelte, CodeMirror, d3-force, etc.).

`minimumReleaseAgeExclude: ['@stephen-netu/design-system@*']` is set in
`LEAP/pnpm-workspace.yaml` and `predio/pnpm-workspace.yaml` so pnpm's 24h
release-age gate does **not** block fresh design-system releases from being
installed by consumers.

### Local development with a peer checkout

If you need to test a design-system change inside a consumer app **before**
publishing, use a temporary `pnpm.overrides` entry in the consumer's
`pnpm-workspace.yaml` (or `package.json`):

```yaml
# LEAP/pnpm-workspace.yaml (temporary, do not commit)
pnpm:
  overrides:
    '@stephen-netu/design-system': link:../design-system
```

After testing, **revert the override** so the consumer stays on the published
version. The override is only valid in the consumer's own worktree — never
commit it to `main`.

### What NOT to do

- **Never** add `"@stephen-netu/design-system": "file:../design-system"` to
  any consumer's `package.json`. The T-01 topology gate at the umbrella root
  blocks this; the design-system AGENTS.md blocks it for the same reason.
  Local-peers must flow through npm.
- **Never** bump the consumer's pin to `*` or `latest`. Semver `^0.2.x` gives
  Renovate room to group updates while still gating major bumps.
- **Never** publish from a consumer app's CI. Only this repo (`design-system`)
  owns the release process for the package.

## KOS architecture context (merged from CLAUDE.md, 2026-08-18)

This repo's `CLAUDE.md` is now an `@AGENTS.md` import stub, so this file is the
single source for the repo. The shared KOS architecture context is canonical in
one place, and 12 peer repos previously held a copy of it that drifted:

    /Users/netu/Projects/KOS/.gears/_realm/context/kos-peer-context.md

It covers the sovereignty invariants, the HDA layout, TOS, SACS, the documentation
map, the worktree convention, and the review protocol. Read it before cross-repo
work. Do not copy it into this repo.

Sections that the shared context or the text above already covers: `KOS Ecosystem`, `Capability Placement`, `Sovereignty Invariants (Non-Negotiable)`, `HDA Architecture`, `TOS (Task Operating System)`, `SACS (Sovereign Agent Context System)`, `Documentation`, `Worktree Convention`, `Review Protocol`.

### Identity

**Design System** — Svelte 5 component library and design token system for KOS apps. Published as `@stephen-netu/design-system`. Not a Tauri app — it is a library. No Rust backend, no IPC.

### Library Conventions

- Svelte 5 runes ONLY: `$state`, `$derived`, `$effect`, `$props`
- Design system tokens via CSS variables — NO hardcoded colors
- No Tauri, no Rust, no IPC. Published to npm. Apps consume via `workspace:*`.
- UI copy standard: [`docs/copy.md`](./docs/copy.md) — STE-strict, enforced by `MANDATE-8` (`.gears/AGENT_MANDATES.md`). Covers labels, tooltips, error toasts, empty states.
