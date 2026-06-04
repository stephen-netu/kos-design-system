# KOS Architecture Context

This file provides the KOS architecture essentials for agents working in this repo. Full docs: `/Users/netu/Projects/KOS/CLAUDE.md`, `/Users/netu/Projects/KOS/.kilocode/CLAUDE.md`.

## Identity

**Design System** — Svelte 5 component library and design token system for KOS apps. Published as `@stephen-netu/design-system`. Not a Tauri app — it is a library. No Rust backend, no IPC.

## KOS Ecosystem

- **SOVEREIGN** (`/Users/netu/Projects/KOS/SOVEREIGN/`) — Rust kernel. 140+ crates in HDA. Enforces sovereignty invariants S-01–S-12.
- **LEAP** (`/Users/netu/Projects/KOS/LEAP/`) — Platform shell. Rust backend + Svelte 5 frontend. pnpm workspace root.
- **Peer apps** — Ryu (control center), Atelier (knowledge workbench), Agora (P2P chat), Loge (OS intake), Mir (civic commons), Guanxi (CRM), Amandla (fleet), Paracosm (world engine), Predio (real estate), Sonda (OSINT), Stinger (TBD).

## Capability Placement

Apps depend on capabilities, never own them. Capabilities live in `SOVEREIGN/effectors/`, exposed via `r4-runtime` handlers. A peer app is a **surface** — it consumes capabilities via `sovereign-sdk` or by linking SOVEREIGN crates. Never relocate effector crates into an app's tree. Crate source stays in SOVEREIGN.

## Sovereignty Invariants (Non-Negotiable)

| ID | Rule | Banned | Use Instead |
|----|------|--------|-------------|
| **S-01** | Authority Explicitness | Direct system calls, raw `std::fs` | `kernel.request_capability()` |
| **S-02** | Determinism | `HashMap`, `HashSet`, `SystemTime::now()`, `rand::*` | `BTreeMap`, `BTreeSet`, `deterministic_timestamp()` |
| **S-03** | Semantic Conservation | `#[allow(dead_code)]`, `TODO`, `FIXME` | `// IMPLEMENTATION_REQUIRED:`, `// DEVELOPMENT_BLOCKER:`, `// ARCHITECTURE_PENDING:` |
| **S-04** | Auditability | Missing audit trails | Correlation IDs for all actions |
| **S-05** | Killability | Unbounded loops | Bounded operations, respect halt signals |

Extended invariants S-06–S-12: `/Users/netu/Projects/KOS/.gears/_realm/reference/LEAP-PRINCIPIA-v4.md`

### Agent Prohibitions

- `#[cfg(feature = "...")]` → runtime detection pattern
- `#[allow(dead_code)]` → remove dead code or use `// IMPLEMENTATION_REQUIRED:`
- `pub fn foo(&self) -> &T { &self._field }` → dead-field laundering, remove field
- `HashMap`/`HashSet` → `BTreeMap`/`BTreeSet`
- `SystemTime::now()` → `deterministic_timestamp()`
- `rand::thread_rng()` → deterministic algorithms only

## HDA Architecture

- **Crate naming**: `<domain><layer>-<name>` (e.g., `k0-kernel`, `r4-runtime`)
- **Layers**: 0=Primitives, 1=Mediation, 2=Audit, 3=Composition, 4=Runtime
- **Domains**: K=Kernel, R=REFLEX, A=Axioms, E=Effectors, F=Federation, C=Cognition, M=Memory, O=Orchestration, S=Surface, X=Foundation, I=Integration, D=Determinism, J=Judiciary, G=Guards, W=Work

## Library Conventions

- Svelte 5 runes ONLY: `$state`, `$derived`, `$effect`, `$props`
- Design system tokens via CSS variables — NO hardcoded colors
- No Tauri, no Rust, no IPC. Published to npm. Apps consume via `workspace:*`.

## TOS (Task Operating System)

```bash
realm-substrate task list                    # pending/in-progress
realm-substrate task show <id>              # full detail
realm-substrate task done <id>              # mark done
realm-substrate task update <id> --status in_progress
```

- `task_match` before `task_create` to avoid duplicates
- `meta_task_tier` (0=infra, 1=feature, 2=research) skips ~15s classifier

## SACS (Sovereign Agent Context System)

Before SOVEREIGN code: `sacs_brain_slice`, `sacs_error_patterns`, `sacs_preflight`, `sacs_validate`. 65 capabilities, 3,300+ type schemas, 134+ crates. Before new traits: search via `sacs_brain_slice`, check `i0-kernel-contracts`, `x0-interfaces`, `g0-types`.

## Documentation

| Location | Purpose |
|----------|---------|
| `/Users/netu/Projects/KOS/.gears/_realm/` | ADRs, architecture, runbooks, RFCs |
| `/Users/netu/Projects/KOS/.gears/<project>/` | Project-scoped docs |
| `/Users/netu/Projects/KOS/.realm/` | Identity, sigchain, AGENT_MANDATES.md |

Key refs: `HDA-ARCHITECTURE.md`, `LEAP-PRINCIPIA-v4.md`, `AGENT_MANDATES.md` (all under `.gears/_realm/` or `.realm/`).

## Worktree Convention

`~/Projects/.agent-worktrees/<repo-name>/<task-slug>/` — never `.kilo/worktrees/` inside a repo.

## Review Protocol

- Trust nothing; verify everything. Read every referenced file.
- Every finding: file path, line number, exact code.
- Severity: Critical / Medium / Low / Info.
- Check wiring: Tauri command names match Rust↔TypeScript, struct fields match, barrel exports exist, data flows end-to-end.
