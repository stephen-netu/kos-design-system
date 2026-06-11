# Review Brief — `@stephen-netu/design-system`

> For an external reviewer (read-only GitHub access). This repo is **fully self-contained** — it has no dependency on any private KOS code. Everything you need to review is here. Build and run it locally if you can; otherwise review from source.

---

## What this is

A **Svelte 5 component library + design-token system** for the KOS application suite. Published to npm as `@stephen-netu/design-system` (mirror: `@kos/design-system`). MIT licensed.

- **No backend, no Rust, no IPC.** Pure frontend library. (`@tauri-apps/api` is an *optional* peer dep used only by the `t0-transport` helpers.)
- **Aesthetic:** neo-brutalist industrial / dark theme with a brass-copper accent (`--color-accent: #b87333`).
- **Consumers** import components and CSS tokens; apps in the KOS suite depend on it via `workspace:*`.

## Tech stack

- Svelte **5** (runes API) · Vite **5.4.21** (pinned — see below) · TypeScript
- `@sveltejs/package` (`svelte-package`) for the build → `dist/`
- Changesets for versioning · Vitepress for docs · Vitest + Playwright for tests
- Notable runtime deps: CodeMirror 6, d3-force, graphology, elkjs, force-graph, leaflet, mermaid, perfect-arrows, svelte-canvas

## How to build / run / test

```bash
pnpm install
pnpm build          # svelte-package -i src -o dist  (prebuild generates tokens.json)
pnpm test           # vitest
pnpm exec playwright test   # interaction tests
pnpm docs:dev       # vitepress docs site
```

`scripts/generate-tokens-json.ts` emits `tokens.json` from the CSS token sources (`pre`/`postbuild` hooks).

## Architecture — layered domains under `src/`

Higher layers compose lower ones; **dependencies should flow downward only** (a key thing to verify).

| Layer | Scope |
|-------|-------|
| `p0-primitives` | Types, design tokens, utilities (the token source of truth) |
| `u0-primitives` | Atoms — Button, Input, Card, Badge, Avatar, Toggle, ValidityBadge |
| `f0-forms` | Form atoms — FormField, Select, TextArea |
| `l0-layout` | Molecules/organisms — Kanban, Grove, Grant, BlockWriter |
| `fabric` | App-shell composites — ActivityRail, CommandBar, Toast/StatusBar, Chat/Research panels |
| `s0-state` / `s0-lifecycle` | Svelte 5 rune wrappers / lifecycle helpers |
| `t0-transport` | Optional Tauri IPC utilities |
| `d0-data-viz` | BarChart, MetricCard |
| `n0-node-graph` … `n4-adaptive-manifold` | Graph/canvas: node graph, flow canvas, Poincaré manifold disk, force-directed, adaptive manifold |
| `spatial` | Canvas tiling/camera — ZoneTiler, ForceCanvas, LodRenderer, BSP tiling |
| `v0-diagrams`, `g0-generative`, `g0-geo`, `map`, `editor`, `x0-enchanted-blocks` | Diagrams, generative/geo, Leaflet map, Markdown editor, block editor |

The public API surface is the `exports` map in `package.json` — each subpath maps to a `dist/<layer>/index.js` barrel.

---

## What to review (focus areas, highest value first)

1. **Svelte 5 runes correctness.** Runes ONLY — `$state`, `$derived`, `$effect`, `$props`, `$bindable`. Flag any Svelte 4 `writable()`/`readable()`/`onMount`-as-state, `$effect` used where `$derived` belongs, effects that write state they also read (loops), or missing effect teardown (esp. in canvas/graph components — rAF/listeners must be cleaned up on destroy).
2. **Token discipline.** No hardcoded color/spacing/typography values in components — everything via CSS custom properties from `p0-primitives/tokens`. Flag literal hex/rgb/px that should be a token. Check theme layering (`control-room.css` over base) is consistent.
3. **Accessibility.** ARIA roles/labels, keyboard navigation + focus management (modals, menus, CommandBar), visible focus states, color contrast of brass-on-dark, `prefers-reduced-motion` honored by animated/canvas components.
4. **Layering / dependency direction.** Verify imports flow downward (`p0 ← u0 ← f0 ← l0 ← fabric`). Flag any upward imports or cycles between layers.
5. **API consistency & DX.** Prop naming/shape consistency across sibling components, sensible defaults, `$bindable` where two-way is expected. **Verify the `package.json` `exports` map matches reality** — every declared subpath should resolve to an actual barrel, and notable components should be exported (drift between the exports map and `src/` is a common bug).
6. **Tree-shaking / side effects.** `sideEffects` is restricted to `**/*.css`. Flag modules with import-time side effects that would defeat tree-shaking.
7. **SSR / import safety.** No bare `window`/`document`/`localStorage` access at module top level (breaks SSR and `svelte-package`). Should be guarded or inside lifecycle/effects.
8. **Performance of the heavy components.** `n0-n4`, `spatial`, `force-graph`, `editor` (CodeMirror), `mermaid` — look at render loops, large-list rendering, memoization, and whether expensive work is bounded and cancellable.
9. **Type safety.** Exported `.d.ts` correctness, generics on data-driven components (charts, graphs, Kanban), no `any` leaking into public types.
10. **Test coverage.** Are the atoms and the interaction-critical composites (forms, Kanban DnD, CommandBar) covered by vitest/Playwright? Note meaningful gaps.

## Constraints / context (please respect — not findings)

- **Vite is pinned to `5.4.21`** deliberately (LEAP workspace standard; there's a `check:vite-pin` guard). Do **not** recommend bumping it.
- Dual package names (`@stephen-netu/...` and `@kos/...`) are intentional.
- This library intentionally has **no** Rust/SOVEREIGN/LEAP-backend code — those are out of scope; don't ask for them.
- The KOS "sovereignty invariants" (S-01…S-12) in `CLAUDE.md` are primarily a *Rust-kernel* policy. For this frontend lib, the relevant ones are light: avoid non-determinism where output should be reproducible (e.g. token generation, deterministic layout seeds), and keep loops/animation bounded and cancellable. Don't over-apply the kernel rules to ordinary UI code.

## Requested output format

For each finding: **file path + line number**, the exact code, and a severity — **Critical / Medium / Low / Info** — with a concrete suggested fix. Group by the focus area above. A short overall assessment (architecture health, biggest risks, quick wins) at the top is welcome.

*Trust nothing, verify against the source — every claim should point at real code in this repo.*
