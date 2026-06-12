# Code Review — `@stephen-netu/design-system`

**Repo:** `stephen-netu/kos-design-system` · **Commit:** `51b3401` ("BRIEF", 2026-06-11) · **Reviewer:** Fable 5, per `REVIEW-BRIEF.md`

**Method:** full clone; `pnpm install` + `pnpm build` executed; `svelte-check`, `vitest run`, and `npm pack --dry-run` executed; import graph, exports map, and token usage verified mechanically against source. Every finding below points at real code at this commit.

| Baseline | Result |
|---|---|
| `pnpm build` (svelte-package + token gen) | ✅ clean (183 tokens generated) |
| `package.json` exports map vs `dist/` | ✅ all 74 subpath targets resolve, all have adjacent `.d.ts` |
| `svelte-check` | ✅ 0 errors · ⚠️ 45 warnings in 22 files (triaged below) |
| `vitest run` | ✅ 29 files, 353/353 tests pass |
| Layering (`p0 ← u0 ← f0 ← l0 ← fabric`) | ✅ zero upward imports, zero directory-level cycles |
| Svelte 4 leftovers (`export let`, `$:`, `createEventDispatcher`, `svelte/store`) | ✅ zero — runes-only, mechanically verified |

---

> **Branch status (`review/fable-fixes`):** fixes F-01, F-02, F-03, F-07, F-08, F-09 (146 codemod sites + 3 stragglers), F-13, F-22, F-25, F-26, and ships the review's verification scripts as permanent guards (`scripts/checks/*`, wired into `package.json` and `.gitea/workflows/ci.yml`).
>
> **Corrections discovered during implementation:**
> - **F-14 revised:** `.gitea/workflows/ci.yml` installs with `npm ci`, so deleting `package-lock.json` (the original recommendation) would break Gitea CI. This branch instead *regenerates* `package-lock.json` for the new dependency layout and *adds* `pnpm-lock.yaml`. Consolidating on one package manager remains a follow-up decision.
> - **F-34 (new, Low):** `src/editor/MarkdownEditor.svelte` renders its Save button only when `filePath` is **null** (`{#if !filePath}`), while `saveContent()` early-returns without a `filePath` — the button can never save. Likely an inverted condition; left untouched to keep this branch behavior-conservative.
> - The hardened token guard caught 3 sites the review's truncated audit listing missed: wrong-prefix `--color-expert-sovereign`/`--color-expert-atelier` in `n4-adaptive-manifold/n4-tokens.css` and undefined `--color-error-subtle` in `s0-state/SyncStatus.svelte` — fixed on this branch.

## Overall assessment

**Architecture health: genuinely good.** The layered-domain rule holds under mechanical verification — no upward imports among the five core layers, no cross-directory cycles. Runes adoption is complete and idiomatic (the `untrack`-documented sync-effect pattern in `ForceCanvas`/`BspTilingCanvas` is exemplary). Lifecycle hygiene in the heavy canvas/graph family is consistently right: every rAF loop, observer, CodeMirror view, force-graph instance, and layout worker I traced is torn down on destroy. Modal a11y (focus trap, `inert`, `aria-modal`, focus restore) is above average for a young design system. Token generation is deterministic, and the brass-on-dark contrast is enforced by a passing WCAG audit test.

**Biggest risks (in order):**
1. **The published package is broken for outside consumers of several subpaths** — `@lucide/svelte`, `mermaid`, `markmap-lib`, `markmap-view` are imported at runtime by shipped components but live in `devDependencies`. Works in the KOS workspace, fails on `npm install` elsewhere. (F-01, F-02)
2. **The exported MarkdownEditor silently loses data** — its save path is wired to stub `writeFile`/`vaultStore` modules that no-op, then reports "Saved". (F-03)
3. **A phantom token dialect** — ~30 token names (`--accent-primary`, `--bg-panel`, `--text-primary`, …) used across ~120 style declarations are never defined anywhere, so those components always render hardcoded fallbacks and ignore all three themes. (F-09)

**Quick wins:** move 4 packages between dependency groups (F-01/F-02/F-13); commit `pnpm-lock.yaml` (F-14); delete the stray `design-system/` duplicate dir and dead `scripts/build.ts` (F-25, F-26); add `test`/`check` scripts (F-22); fix the dead CSS in `Steps`/`CompactCard` (F-07, F-08); mechanical rename of phantom tokens to canonical names (F-09).

Severity totals: **3 Critical · 12 Medium · 12 Low · 7 Info**

---

## 1 · Svelte 5 runes correctness

✅ **Clean baseline.** Zero `export let`, zero `$:`, zero `createEventDispatcher`, zero `svelte/store` imports anywhere in `src/` (including tests). `vite.config.ts` forces `runes: true`. Canvas stores (`ForceSimulation`, `BspTilingSimulation`, `CameraController`, `graph-state`) are `.svelte.ts` rune classes.

**F-04 · Medium — SnapZoomCamera never reacts to prop changes**
`src/spatial/SnapZoomCamera.svelte:30`
```svelte
const controller = $state(new CameraController(width, height, config));
```
`runPhases()` is invoked only in `onMount` (line 64). Unlike its siblings, there is no sync effect, so changing `width`/`height`/`config` after mount does nothing — the camera keeps initial dimensions. svelte-check flags all three props ("only captures the initial value"). Compare `ForceCanvas.svelte:53–60` and `BspTilingCanvas.svelte:39–48`, which both rebuild their simulation inside `$effect` + `untrack` when props change.
**Fix:** mirror the sibling pattern — `$effect(() => { width; height; config; untrack(() => { /* re-constrain or recreate controller, then runPhases() */ }); })`. (Requires `let` instead of `const` if you recreate the controller.)

**F-05 · Info — intentional initial-value props trigger the same warning**
`src/u0-primitives/rsvp/RsvpReader.svelte:24` (`initialWpm`), `src/u0-primitives/accordion/Accordion.svelte:43` (`defaultOpen`). These are initial-only by design (the names say so). Silence with an inline comment + `untrack`, or rename pattern-wide, so real cases like F-04 don't drown in warning noise.

**F-06 · Low — Modal open/close effect leaves a timer dangling**
`src/u0-primitives/modal/Modal.svelte:76–80`
```ts
setTimeout(() => {
  if (previouslyFocusedElement instanceof HTMLElement) { previouslyFocusedElement.focus(); }
}, 150);
```
Rapid close→open within 150 ms can yank focus back out of the reopened modal; the timeout is never cleared and the effect has no teardown.
**Fix:** keep the timer id and `return () => clearTimeout(id)` from the `$effect`.

✅ Positive note: `ForceCanvas.svelte:48–60` documents *why* `untrack` is needed ("reassigning `sim` would invalidate the effect's own dependency and loop forever") — exactly the effect-writes-what-it-reads loop the brief asks to hunt for, already handled and explained.

---

## 2 · Token discipline

**F-09 · Medium (systemic) — a phantom token dialect: 37 names referenced, never defined**
Mechanical audit (438 custom properties defined in `src/`, 224 referenced via `var()`): **37 referenced names are defined nowhere**, across **155 usage sites**. About 5 of those are legitimate per-instance parameter vars set from markup (`--cx`/`--cy` in `NodePort`, `--type-color` in `EnchantedBlock`, `--handle-width` in `CollapsiblePanel`). The remaining ~30 are *theme-shaped* names that simply don't exist, concentrated in the editor family, `n0-node-graph`, `entity-graph-view`, `fabric/ai`, and `l0-layout/block-writer`:

- `--accent-primary` — 35 uses, e.g. `src/editor/FindReplaceDialog.svelte:378` `border-color: var(--accent-primary, var(--color-accent));`
- `--text-primary` — 15 uses, e.g. `src/editor/FindReplaceDialog.svelte:331` `color: var(--text-primary, #e8e6e3);`
- `--text-secondary` — 10, `--accent-subtle` — 9, `--text-tertiary` — 8, `--bg-canvas` — 7, `--bg-panel` — 7, `--bg-panel-elevated` — 7, `--accent-hover` — 5, `--color-text` — 4 (`src/n0-node-graph/Node.svelte:246`), `--color-danger` — 2 (`src/fabric/ai/ResearchPanel.svelte:493`), `--color-phase-seed/sprout/scelle` (`src/l0-layout/block-writer/BlockItem.svelte:131–134`), `--color-surface`, `--bg-app`, `--bg-elevated`, `--border-color`, `--color-bg`, `--color-error-bg`, `--color-accent-secondary` (`src/n4-adaptive-manifold/n4-tokens.css:71`), …

Consequences: those declarations always render their hardcoded fallback, so **`light` and `control-room` themes silently don't apply** to these components — and the fallbacks have drifted from the real palette (e.g. `src/editor/MarkdownEditor.svelte:450` `var(--bg-panel, #1a1a1a)` vs. the actual `--color-bg-panel: #181c20`). Worse, `src/editor/MarkdownEditor.svelte:127–132` passes phantom vars (`var(--accent-subtle)`, `var(--bg-app)`) into CodeMirror's theme object **without fallbacks** — those resolve to nothing.
**Fix:** mechanical rename to the canonical `--color-*` names (the mapping is 1:1 and obvious: `--bg-panel → --color-bg-panel`, `--text-primary → --color-text-primary`, `--accent-primary → --color-accent`, …). Then add the audit as a CI test so the dialect can't reappear — the review's audit script (`.review/token-audit.mjs`, included in the appendix) is drop-in: it fails on any `var(--x)` with no definition in `src/`.

**F-10 · Low — `tokens.css` itself layers on undefined `--accent-*` hooks**
`src/p0-primitives/tokens/tokens.css:34–38`
```css
--color-accent-active: var(--accent-active, #8a5526);
--color-accent-glow:   var(--accent-glow, rgba(184, 115, 51, 0.28));
```
If these are deliberate consumer override hooks (apps set `--accent-*` to rebrand), document that contract in the file header and exempt them in the audit; if not, inline the values. Right now they read as more phantom dialect.

**F-11 · Low — raw hex in canvas JS palettes instead of the existing bridge**
`src/n4-adaptive-manifold/AdaptiveManifold.svelte:92–99` seeds a `ResolvedThemeColors` state with hardcoded hex (`canvasBg: '#1a1a1a'`, `nodeActive: '#b87333'`, …). p0 already ships exactly the right tool — `src/p0-primitives/canvas-theme.ts` (`getCanvasTheme()`, reads computed styles with fallbacks). The component resolves theme colors itself later (the "(C-1 fix)" block), duplicating that machinery.
**Fix:** consolidate on `getCanvasTheme()` / extend it with the n4-specific slots, so canvas theming has one code path.

**F-12 · Info — residual literal counts, for the codemod backlog**
138 hex literals and ~120 raw `px` values remain in non-token `.svelte` files (top: `ChatPanel` 34 hex/71 px, `AdaptiveManifold` 25, `KeyboardShortcuts` 23, `MarkdownEditor` 22, `BspSizingInfographic` 21). Most hexes are `var()` fallbacks (fold into F-09); the px debt is what `px-to-token-codemod.sh` exists for. `AGENTS.md`'s own rule is "components must consume design tokens exclusively" — consider a stylelint gate after the codemod run.
✅ Theme layering mechanism itself is consistent: `control-room.css` overrides the same custom-property names under `:root[data-theme="control-room"]`, and the WCAG contrast audit (`contrast-audit.test.ts`) passes.

---

## 3 · Accessibility

✅ **Strong spots:** `Modal.svelte` — `role="dialog"`, `aria-modal`, `aria-labelledby`, `inert` on the closed container, Tab-cycle focus trap, focus restore. `Toggle.svelte` — real `role="switch"` + `aria-checked` + keyboard on the track. `Input.svelte`'s autocomplete list carries `role="option"`/`aria-selected`/ids. Native `<select>` in `f0-forms`. `prefers-reduced-motion` honored in 13 files, including `AdaptiveManifold` gating its rAF loop (`AdaptiveManifold.svelte:189`).

**F-15 · Medium — CommandPalette input is a combobox without the role**
`src/u0-primitives/command-palette/CommandPalette.svelte:272–274`
```svelte
aria-autocomplete="list"
aria-controls="suggestions-list"
aria-expanded={filteredCommands.length > 0 || suggestions.length > 0}
```
The ARIA wiring is 90% there, but the input's implicit role is `textbox`, which doesn't support `aria-expanded` (svelte-check flags it). Result items at lines 291/318 are click-only `<li>`s.
**Fix:** add `role="combobox"` to the input; give each result `role="option"` + an id and reflect the active one via `aria-activedescendant` (arrow-key selection already lives on the input's keydown).

**F-16 · Medium — Kanban drag-and-drop has no keyboard path (both implementations)**
`src/fabric/layout/KanbanCard.svelte:61–63` (`ondragstart`/`ondragend`/`draggable`), `KanbanColumn.svelte:85–87` (drag-over/enter/leave), and the parallel `src/l0-layout/kanban/*` set. HTML5 DnD only — keyboard users cannot move cards, and the l0 variant has zero ARIA. The brief names Kanban DnD interaction-critical.
**Fix:** add a keyboard move mode (focus card → Enter picks up → arrows choose column/position → Enter drops, Esc cancels) with `aria-grabbed`/live-region announcements, or expose the move API so apps can. Cover it in the Playwright suite (see F-30).

**F-17 · Low — click-only elements and stray tabindexes (svelte-check, verified)**
- `src/d0-data-viz/CheckpointPill.svelte:135` and `src/spatial/LodRenderer.svelte:213` — `<div>` with `onclick`, no keyboard handler, no role → make them `<button>` or add `role="button"` + `onkeydown`.
- Non-interactive elements with `tabindex≥0`: `src/u0-primitives/card/Card.svelte:43` (interactive variant needs `role="button"` when `isInteractive`), `src/l0-layout/grant/GrantCard.svelte:52`, `src/spatial/ZoneTiler.svelte:201`, `src/u0-primitives/rsvp/RsvpReader.svelte:104`, `src/editor/components/CorrectionTooltip.svelte:56`.
- `src/editor/FindReplaceDialog.svelte:214` — `role="dialog"` without `tabindex`; `src/b0-app-shell/clarification-overlay/ClarificationOverlay.svelte:69` — `autofocus` (acceptable for a palette overlay; add a comment or swap to programmatic focus-on-open).
- `src/u0-primitives/toggle/Toggle.svelte:51` — the label `<span>` has a redundant `onclick` with no key handler; the track already handles both. Remove the span handler (or make it `aria-hidden` for events) to clear two warnings.

**F-18 · Low — animated spatial canvases ignore `prefers-reduced-motion`**
`ForceCanvas`, `LodRenderer`, `SnapZoomCamera` (and `n2-manifold-disk/ManifoldDisk.svelte`) animate unconditionally, while 13 other files — including n4 — check the media query.
**Fix:** when `(prefers-reduced-motion: reduce)`, jump force layouts/LOD/camera transitions to their final state (n4's gate at `AdaptiveManifold.svelte:189` is the in-repo pattern to copy).

**F-19 · Info — stacked modals all close on one Escape**
`Modal.svelte:140` binds `<svelte:window onkeydown>` per instance with no stack coordination, yet `s0-state/modal-stack-store.svelte.ts` exists precisely for z-order/stack tracking and `Modal` doesn't use it. Also the focus-trap query (`Modal.svelte:107–109`) doesn't exclude `[disabled]`/hidden elements. Worth wiring together when modals start nesting.

---

## 4 · Layering / dependency direction

✅ **The core rule holds** — mechanically verified from every import in `src/`: no upward edges among `p0 ← u0 ← f0 ← l0 ← fabric`, no directory-level cycles anywhere. Family edges all point down or sideways-by-design (`n2/n3/n4 → n1`, `spatial → s0-lifecycle`, `map → g0-geo`, `entity-graph-view → {d0, n0, u0}`).

**F-20 · Medium — the foundation layer imports a service layer (p0 → s0-state)**
`src/p0-primitives/ThemeProvider.svelte:13`
```ts
import { themeStore, initThemeStore, type ThemeName } from '../s0-state/ThemeStore.svelte';
```
`p0-primitives/index.ts:2` declares itself "the foundation layer that all other domains depend on," and line 14 claims the ThemeStore re-export is "types only" — true for `index.ts:15`, but `ThemeProvider` (exported from the same barrel, line 10) value-imports the store. So importing p0 pulls s0-state at runtime, inverting the documented direction.
**Fix:** either relocate `ThemeProvider` to s0-state/u0 (it's a stateful provider, not a primitive), or move `ThemeStore` down into p0. Then add p0 to the import-graph check so it stays dependency-free.

**F-21 · Low — exported editor bypasses t0-transport for hand-rolled stubs**
`src/editor/MarkdownEditor.svelte:21–22` imports from `../tauri` and `../stores` — two top-level directories that appear in no layer table, no exports subpath, and duplicate t0-transport's brief-documented role as *the* Tauri boundary. (Functional consequence is F-03.) Fold these into `t0-transport` behind its `isTauri()` guard, or inject the persistence functions as props.

**F-23 · Info — undocumented public layers**
`src/index.ts:35,37` re-export `epistemic` and `platform` through the root barrel, but they're absent from the brief's layer table and have no subpath exports; `showcase`, `stores`, `tauri` are compiled into `dist/` but sealed off by the exports map (good). Document epistemic/platform as public layers (and give them subpaths) or stop barrel-exporting them.

---

## 5 · API consistency & DX (incl. exports-map drift)

✅ **The headline check passes:** after a clean build, every one of the 74 exports-map targets exists on disk, and every bare-string subpath has an adjacent `.d.ts` (verified by script, both directions). No drift between map and `dist/`.

**F-01 · Critical — runtime imports of devDependency `@lucide/svelte` break published consumers**
`package.json:154` puts `@lucide/svelte` in `devDependencies`, but 12 shipped components import it at runtime — e.g.:
- `src/fabric/ai/ChatPanel.svelte:12` `import { Send, Trash2, FileText, X, MessageSquare } from '@lucide/svelte';`
- `src/f0-forms/search/SearchBar.svelte:2` `import { Search } from '@lucide/svelte';`
- `src/fabric/navigation/ActivityRail.svelte:14–18`, plus `StatusBar`, `ToastContainer`, `KeyboardShortcuts`, `KanbanCard`/`KanbanColumn` (fabric), `BlockHeader`, `KanbanCard` (l0), `ResearchPanel`, `Showcase`.
Inside the KOS pnpm workspace this resolves by hoisting luck; for anyone who runs `npm install @stephen-netu/design-system` and imports `./fabric`, `./f0-forms`, or `./l0-layout`, the import fails — module not found.
**Fix:** move `@lucide/svelte` to `dependencies` (simplest), or to `peerDependencies` + document. Add a CI guard that diffs runtime imports in `src/` against `dependencies` (the review's import-graph script already extracts external-package-per-directory and would have caught this).

**F-02 · Critical — same bug for the diagram stack**
`src/v0-diagrams/MermaidDiagram.svelte:2` (`import mermaid from 'mermaid'`), `src/v0-diagrams/MarkmapDiagram.svelte:2–3` (`markmap-lib`, `markmap-view`) — all three packages sit in `devDependencies` (`package.json:168–170`) while `./v0-diagrams` is a public subpath. Any consumer importing it gets unresolvable modules.
**Fix:** move all three to `dependencies` — and since mermaid is enormous, do F-28 (dynamic import) in the same change.

**F-24 · Medium — duplicate components with identical names and different APIs**
- **Two Kanban stacks:** `src/fabric/layout/KanbanBoard|Column|Card.svelte` and `src/l0-layout/kanban/KanbanBoard|Column|Card.svelte` are independent implementations. The root barrel exports the l0 set (`src/index.ts:21`), while `./fabric` and `./fabric/layout` export the fabric set — so `import { KanbanBoard } from '@stephen-netu/design-system'` and `... from '@stephen-netu/design-system/fabric'` give different components with different props.
- **Two CommandBars:** `src/b0-app-shell/command-bar/CommandBar.svelte` (intent-dispatch palette, exported from the root barrel via `src/index.ts:15`) vs. `src/fabric/input/CommandBar.svelte` (an app header with two buttons).
**Fix:** pick a canonical Kanban (fabric's is the documented one per the brief's table) and make the other re-export or deprecate; rename one CommandBar (`IntentBar`?). Document in CHANGELOG as breaking-ish.

**F-22 · Low — `pnpm test` doesn't exist, despite brief & docs**
`package.json:10–22` defines no `test`, no `check` script. `REVIEW-BRIEF.md` says `pnpm test # vitest`; `AGENTS.md` says `npx svelte-check`. Both work only via `pnpm exec`.
**Fix:** add `"test": "vitest run"`, `"test:e2e": "playwright test"`, `"check": "svelte-check --tsconfig ./tsconfig.json"`.

**F-25 · Medium — stray `design-system/` directory at repo root**
`design-system/src/` contains byte-identical duplicates of 4 live files (`spatial/ZoneTiler.svelte`, `spatial/BspTilingCanvas.svelte`, `spatial/BspTilingSimulation.svelte.ts`, `n4-adaptive-manifold/providers/manifold-provider.ts`) — an accidental nested copy. It's outside the build and the npm tarball, but it's exactly where a refactor edit lands in the wrong file and silently does nothing.
**Fix:** `git rm -r design-system/`.

**F-26 · Low — dead build script with a hardcoded store path**
`scripts/build.ts:18` resolves svelte-package via `node_modules/.pnpm/@sveltejs+package@2.5.7_svelte@5.55.9_.../node_modules/.bin/svelte-package` — a version-pinned pnpm store path that breaks on any dependency bump. Nothing references this script (`package.json` uses `svelte-package` directly).
**Fix:** delete it (or rewrite to `pnpm exec svelte-package` if a clean-then-build wrapper is wanted).

**F-27 · Low — doc examples reference subpaths/packages that don't exist**
- `src/fabric/index.ts:8` documents `import { Button } from '@kos/design-system/fabric/u0-primitives'` — there is no `./fabric/u0-primitives` subpath (and Button doesn't live under fabric).
- `src/d0-data-viz/theme-integration.ts:13–14,26` documents imports from `@sov/design-system` and `$lib/stores/themeStore.svelte` — a third package name and a SvelteKit alias, neither valid here.
**Fix:** correct to real subpaths (`@kos/design-system/u0-primitives`, `@kos/design-system/s0-state`).
*(Related Info: exports-entry shape is inconsistent — `.`, `p0`, `u0` use `{types, svelte, default}` objects, the rest are bare strings. Works today via sibling-`.d.ts` probing; normalizing to the object form with a `svelte` condition is one mechanical pass.)*

---

## 6 · Tree-shaking / side effects

✅ `sideEffects: ["**/*.css"]` is correct, and module-scope mutable state is rare and import-inert (`t0-transport/quality.ts` holds module singletons but executes nothing at import; `startQualityMonitoring` even guards double-start at line 110).

**F-29 · Info — module-scope singletons worth knowing about**
`src/s0-state/ThemeStore.svelte.ts:58` instantiates `themeStore` at module scope, reading `localStorage` during import (safely guarded, lines 7–22). It's SSR-safe but it is import-time work, and bundlers may keep the instantiation. Same pattern: root barrel `src/index.ts:8–12` imports four CSS files, so any root import drags `base.css` + validity/n0/d0 token sheets even for a single named export — defensible for a DS, but worth stating in the README ("import the root = you get base CSS").

---

## 7 · SSR / import safety

✅ No bare module-top-level `window`/`document`/`localStorage` access found in shipped modules (heuristic scan + targeted reads of every store). `ThemeStore` guards storage behind `hasLocalStorage()` try/catch; `create-store.ts:33` checks `typeof window`; browser listeners live in effects/`<svelte:window>`.

**F-28 · Medium — literal dynamic imports of the optional Tauri peer are reachable from the root barrel**
`src/t0-transport/invoke.ts:10` and `src/u0-primitives/command-palette/commandStore.svelte.ts:22`
```ts
const mod = await import('@tauri-apps/api/core');
```
Runtime behavior is correctly guarded (try/catch, `isTauri()`), but both modules are statically reachable from `export * from './t0-transport'` / the u0 barrel (`src/index.ts:27,19`). Vite/Rollup resolve literal dynamic-import specifiers at build time, so a consumer **without** `@tauri-apps/api` installed (it's an optional peer, `package.json:121–129`) is likely to fail their build on root or `./u0-primitives` imports. Inside KOS every app has Tauri, which is why this hasn't bitten.
**Fix (pick one):** route the specifier through a variable (`const spec = '@tauri-apps/api/core'; await import(/* @vite-ignore */ spec)`) so bundlers treat it as runtime-dynamic; or isolate Tauri-touching modules behind subpaths excluded from the root/u0 barrels; or document that non-Tauri consumers must mark it external. Add a smoke test: `vite build` a fixture app that imports the root barrel with no Tauri installed.
*(Also corrects the brief: `@tauri-apps/api` is used by `t0-transport` **and** `u0-primitives/command-palette` — plus the editor's stub layer pretends to be it.)*

**F-30a · Info — the test setup can mask SSR violations**
`vitest-setup.ts` installs a global `localStorage` mock, so a future unguarded storage read passes tests while breaking SSR/`svelte-package` consumers. Consider one tiny "imports cleanly in node" test per barrel (plain `node --input-type=module -e "import('./dist/index.js')"` would have caught several classes of bug here).

---

## 8 · Performance of the heavy components

✅ **Teardown is consistently right** (verified per file): `ForceCanvas.svelte:138–139` cancels its rAF in `onDestroy`; `LodRenderer.svelte:186–187` likewise; `AdaptiveManifold.svelte:222` cancels in effect cleanup with `onDestroy` at 194; `TransitionAnimator` (`transition.ts:82`) cancels in `stop()`; `FlowCanvas.svelte:55` terminates the elk layout worker on destroy (the "S-05" comment is accurate); `MarkdownEditor.svelte:275–276` destroys the CodeMirror view; `ForceGraph.svelte:123–125` calls `graph._destructor()`; `WorldLineTimeline` disconnects its observer; quality-monitor intervals have guarded start and `stop()`.

**F-31 · Medium — `mermaid` is statically imported by an exported component**
`src/v0-diagrams/MermaidDiagram.svelte:2` `import mermaid from 'mermaid';` — mermaid is one of the largest things on npm; a static import means every consumer of `./v0-diagrams` pays for it at bundle time even if no mermaid diagram ever renders.
**Fix:** `const { default: mermaid } = await import('mermaid')` on first render with a loading state (combine with the F-02 dependency move). Same treatment recommended for `markmap-view`/`markmap-lib`.

**F-32 · Low — unbounded history growth in the quality monitor**
`src/t0-transport/quality.ts:118` pushes to `metrics.history` on a 3 s interval; verify it's capped (the sibling `latencies` array is sliced). If not, a long-lived session grows without bound — cap to the same window.

---

## 9 · Type safety

✅ `strict: true`, `declaration` + maps emitted, all subpath `.d.ts` present (verified). Only **14** `any` usages in shipped code, all at untyped-library boundaries or utility generics — none leak into exported component prop types that I could find.

**F-33 · Low — boundary `any`s that have available types**
- `src/spatial/ForceSimulation.svelte.ts:23,101–107` — `simulation: any` + `as any` chains; `@types/d3-force` is already in devDependencies and covers `Simulation<NodeDatum, LinkDatum>`.
- `src/g0-geo/SovereignMap.svelte:37–41` — `map/markerLayer/L: any`; `@types/leaflet` is installed (type the lazy module as `typeof import('leaflet')`).
- `src/u0-primitives/command-palette/CommandPalette.svelte:237` — `(param as any).choices`: add `choices?: string[]` to the `CommandParameter` schema instead.
- `src/fabric/navigation/ActivityRail.svelte:13` — `type IconComponent = any` ("Lucide icons are Svelte 4 class components"): `@lucide/svelte` ships a `Icon` component type that fits.
- `src/n4-adaptive-manifold/AdaptiveManifold.svelte:1107` — `handleCanvasClick(e as any)` from the keyboard handler: widen the param to `MouseEvent | KeyboardEvent`.

---

## 10 · Test coverage

✅ **What exists is healthy:** 29 vitest files / 353 tests, all green in ~47 s. u0 atoms (Button, Input, Modal, Dropdown, Tabs, Toggle, Tooltip, Badge, ValidityBadge, Accordion, Spinner), all of f0-forms, fabric's StatusBar/Toast/CommandBar/KeyboardShortcuts/ActivityRail/KanbanBoard, `s0-state/ThemeStore`, `n0` validation, editor extensions, and the WCAG `contrast-audit` are covered.

**F-30 · Medium — the heavy half of the library is untested**
Zero unit tests for: all of `spatial` (the rune classes `ForceSimulation`, `BspTilingSimulation`, `CameraController` are pure-ish and very testable — F-04 would have been caught), `n1–n4`, `v0-diagrams`, `map`/`g0-geo`, `x0-enchanted-blocks`, `b0-app-shell` (CommandBar palette, ClarificationOverlay), `l0` grove/grant/block-writer, `MarkdownEditor` itself (its save path — F-03 — would fail any test that asserts persistence), and `CommandPalette`. Playwright coverage is a single spec (`tests/design-system.e2e.ts`) snapshotting Button/Card variants — and the committed snapshots are `*-chromium-darwin.png`, so the suite can't pass on Linux CI as-is (platform-suffixed baselines).
**Fix priorities:** (1) simulation classes — pure logic, fast wins; (2) a Kanban DnD interaction test (fabric KanbanBoard has 2 tests, neither drags); (3) MarkdownEditor save round-trip with an injected transport; (4) regenerate Playwright baselines per-platform or set `snapshotPathTemplate`.

---

## Cross-cutting packaging & repo hygiene

**F-03 · Critical — exported MarkdownEditor's persistence is a silent no-op**
The chain, all shipped: `src/editor/MarkdownEditor.svelte:21–22` →
```ts
import { writeFile, readFile } from '../tauri';
import { vaultStore } from '../stores/vaultStore.svelte';
```
→ `src/tauri/index.ts:10–13`:
```ts
export async function writeFile(path: string, content: string): Promise<void> {
    // Stub: In real implementation, use Tauri fs.writeTextFile
    console.warn('writeFile stub called for', path);
}
```
→ `saveContent()` (`MarkdownEditor.svelte:301–321`) awaits the stub, sets `isDirty = false`, fires `onSave?.()`, and the status line (`:67–70`) shows **"Saved"**. `readFile` returns `''` and `vaultStore` (a stub object in a markup-less `.svelte` file, `src/stores/vaultStore.svelte:1–14`) reports "never changed externally". `./editor` and `./editor/MarkdownEditor.svelte` are public subpaths — a consumer gets an editor that *says* it saved and wrote nothing.
**Fix:** wire the editor to `t0-transport` (`invoke`/`isTauri`) with an explicit not-persisted state when no backend is present, or make `writeFile`/`readFile`/`vaultStore` required props so the host app supplies persistence, or stop exporting the editor until the transport lands. At minimum the stub must surface failure (`saveError`), not success.

**F-13 · Medium — `tsx` ships as a runtime dependency**
`package.json:150` — `tsx` (and its esbuild payload) is in `dependencies` but is only used by `scripts/generate-tokens-json.ts` (pre/postbuild). Every consumer downloads a TypeScript runner for nothing.
**Fix:** move to `devDependencies`. *(Related Info: `postbuild` re-runs `tokens:generate` (`package.json:14`) — it writes into `src/` after `dist/` is already copied, so it's a no-op for the artifact; drop it or have it verify instead.)*

**F-14 · Medium — no `pnpm-lock.yaml` committed; npm's `package-lock.json` is**
The repo at `51b3401` ships `package-lock.json` (301 KB) but **no** `pnpm-lock.yaml`, while every doc (brief, AGENTS.md, scripts) prescribes pnpm — and `.npmrc` sets `resolution-mode: highest`, so every fresh `pnpm install` floats to newest-compatible. Builds aren't reproducible, and the Vite pin guard only protects one package.
**Fix:** commit `pnpm-lock.yaml`, delete `package-lock.json`, and consider dropping `resolution-mode: highest`.

---

## Guardrails honored (per the brief — not findings)

- **Vite stays at `5.4.21`.** Confirmed pinned (`package.json:174`) with the `check:vite-pin` guard intact. No bump recommended; nothing here requires one.
- **Dual package names** (`@stephen-netu/...` / `@kos/...`) treated as intentional throughout. (F-27 is about *non-existent subpaths* in doc examples, not the mirror name.)
- **S-01…S-12 applied lightly, as instructed:** token generation is deterministic (explicit `CATEGORY_MAP` ordering in `scripts/generate-tokens-json.ts`) ✅; animation loops are bounded and cancellable (§8) ✅. No kernel-rule findings were raised against ordinary UI code; where component docs voluntarily cite S-rules (e.g. `commandStore.svelte.ts`, `FlowCanvas.svelte`), the claims were spot-checked and held.

## Appendix — verification tooling left in the workspace

Three scripts were written for this review and are reusable as CI guards: `.review/import-graph.mjs` (layer-violation, cycle, and external-dep-per-directory detection — would catch F-01/F-02 class bugs), `.review/check-exports.mjs` (exports-map ↔ dist verification, both file presence and adjacent `.d.ts`), `.review/token-audit.mjs` (defined-vs-referenced custom-property diff — catches F-09 regressions). All run in <1 s with no dependencies.
