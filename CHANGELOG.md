# @stephen-netu/design-system

## 0.4.0

### Minor Changes

- 227c926: Add pipeline-adapter module: PipelineState → GraphSnapshot mapping for pipeline DAG visualization.

  New exports from `@stephen-netu/design-system/n1-flow-canvas`:

  - `pipelineStateToSnapshot()` — converts raw PipelineState into a GraphSnapshot
  - `createEmptyPipelineSnapshot()` — creates an all-Pending pipeline graph
  - `PIPELINE_STAGE_NAMES` — ordered stage name array
  - `PipelineState`, `PipelineStageData`, `PipelineStatus`, `PipelineTermination` types

  FlowCanvas now renders status-colored nodes with error indicators and attempt badges.

## 0.3.0

### Minor Changes

- Single-seed accent engine: all accent tokens derived from `--accent-primary` via `color-mix`. JS theme layer unified to seed-only. Canvas paint layer resolved via `resolveAccentRamp()` — zero brass literals outside the seed.

  Density tiers: `[data-density]` system with compact (default), comfortable, and cockpit calibrations.

  INSTRUMENT migration: 20+ primitives migrated — Button (inverted-neutral), Card (de-glassed), Badge (mono uppercase), Input (live-edge focus), Modal (sharp, 2px border, no shadow), Tabs/Tooltip/Toggle/Dropdown/CommandPalette/Steps/Spinner all sharp, density-aware, accent-disciplined.

  Fabric & data-viz cleanup: last `backdrop-filter`, Material colors (`#e53935`/`#ff9800`/`#4caf50`), Tailwind red (`#ef4444`), and brass literals removed.

  Phase 4 done — design system is color-agnostic, fully INSTRUMENT.

## 0.2.1

### Patch Changes

- Fix Expansion CodeMirror extension to detect multi-character insertions, and ship svelte-check refactors:

  - `fix(design-system): make Expansion CodeMirror extension detect multi-char insertions`
  - `refactor(design-system): replace SvelteComponent with Component<Record<string, unknown>> in OpenUIRenderer`
  - `feat(design-system): export per-component Props types from 5 spatial components`
  - `refactor(design-system): remove redundant ambient @tauri-apps/api declarations`
  - `fix(design-system): add @tauri-apps/api devDependency for t0-transport types`
  - `fix(design-system): misc a11y and type-narrowing fixes`
  - `fix(design-system): migrate u0-primitives tests to Svelte 5 Snippet API`

## 0.2.0

### Minor Changes

- 382cfec: Design system audit remediation — Phases 1-6:

  - Added ThemeStore singleton with reactive setTheme()/toggleTheme() API
  - ThemeProvider rewritten to use ThemeStore
  - tokens.json now auto-generated from tokens.css (removes phantom accent tokens)
  - Consolidated --color-fg-_ to --color-text-_ across all components
  - Added --space-05 (2px) and --space-15 (6px) spacing tokens
  - Replaced 81 hard-coded gap values with design token variables across 40+ components
  - Added unit tests: Select, Checkbox, RadioGroup, CommandBar, KanbanBoard, ToastContainer, StatusBar (38 new tests)
  - Added a11y assertions to existing tests: Button, Input, Toggle, Modal, Accordion, Dropdown (16 new assertions)
  - Exported Props interfaces from 26 components for consumer type safety
  - Configured svelte-package for .d.ts generation
  - Initialized changesets for breaking-change detection
  - Added visibility:hidden vs {#if} guidance for heavy stateful components

### Patch Changes

- c02abe4: Fix ThemeProvider mode-dark class and data-theme-mode attribute, fix Accordion panel visibility, add Gitea CI workflow for npm publish, update package name references to @stephen-netu/design-system
