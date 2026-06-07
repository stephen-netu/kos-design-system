# @stephen-netu/design-system

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
