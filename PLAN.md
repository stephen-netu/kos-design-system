# Design System Testing Expansion — Core Primitives

## Goal
Add Playwright E2E tests for the 12 remaining core UI primitives that have no coverage yet, following the established pattern (render → variants → interaction → accessibility).

## Test infrastructure (already in place)
- `playwright.config.ts` — chromium, webServer on :5173
- `tests/App.svelte` — render harness (add new components here)
- `tests/design-system.e2e.ts` — all E2E tests (append new describe blocks here)
- `tests/main.ts` — imports base.css via Vite, mounts App.svelte
- Snapshots in `tests/design-system.e2e.ts-snapshots/`

## Already covered (66 passing tests)
- Button (structure, variants, sizes, states, interaction, a11y)
- Card (structure, variants, selection, interaction, a11y)
- ThemeProvider (mode class, data attribute)
- Token colors (CSS custom property regression)
- Visual regression (3 snapshots)

## Components to test (12 core primitives)

### Phase 1: Simple stateless components (Badge, Spinner, Steps)
These are pure-render with props — easy to test, no interaction complexity.

**Badge** (`src/u0-primitives/badge/Badge.svelte`)
- Renders with `role="status"`
- All 4 variants: status, count, dot, outline (class check)
- All 6 colors: accent, success, warning, error, info, neutral (class check)
- All 3 sizes: sm, md, lg (class check)
- Dot variant renders empty (no content span)
- Non-dot variant renders `.ds-badge-content` with children text

**Spinner** (`src/u0-primitives/spinner/Spinner.svelte`)
- Renders with `role="status"` and `aria-label="Loading"`
- All 4 sizes: sm, md, lg, xl (class check)
- All 3 colors: accent, muted, white (class check)
- Renders ring, core, and 3 particle elements

**Steps** (`src/u0-primitives/steps/Steps.svelte`)
- Renders step items from props
- Completed step shows checkmark SVG
- Active step shows accent background
- Connector lines between steps
- Step label and description render correctly
- Vertical/horizontal layout via class

### Phase 2: Interactive components (Input, Toggle)
These have focus, keyboard, and state management.

**Input** (`src/u0-primitives/input/Input.svelte`)
- Renders `.ds-input-wrapper` > `.ds-input-element`
- Accepts and displays typed text (fill input, check value)
- Applies `is-focused` class on focus
- Applies `has-error` class when error prop true
- Applies `is-disabled` when disabled
- Password type renders toggle button
- Focus → type → verify value

**Toggle** (`src/u0-primitives/toggle/Toggle.svelte`)
- Renders `[role="switch"]` with `aria-checked`
- Click toggles checked state (`aria-checked` flips)
- Keyboard: Space/Enter toggles checked state
- Disabled: click does not toggle
- Checked state applies `.is-check` class (track visual)
- All 3 sizes render with correct classes

### Phase 3: Composite components with keyboard nav (Tabs, Accordion)
These need more complex test harness setup and keyboard interaction tests.

**Tabs** (`src/u0-primitives/tabs/Tabs.svelte`)
- Need to import `Tab` type — add tabs data inline in App.svelte or add a wrapper
- Renders `[role="tablist"]` with `[role="tab"]` buttons
- Active tab has `aria-selected="true"` and `.is-active` class
- Click on inactive tab switches active state
- Keyboard: ArrowRight/ArrowLeft changes active tab
- Disabled tab: click does not change active state
- Full-width variant renders `.full-width` class

**Accordion** (`src/u0-primitives/accordion/Accordion.svelte`)
- Renders `.accordion` > `.accordion-item` structure
- Click header toggles panel open/closed
- Open panel shows content, closed does not render panel
- `aria-expanded` reflects state
- SingleOpen mode: opening one closes others
- Disabled panel: click does not toggle

### Phase 4: Overlay components (Modal, Dropdown, Tooltip)
These test focus management, portal-like rendering, and keyboard dismiss.

**Modal** (`src/u0-primitives/modal/Modal.svelte`)
- Not visible when `isOpen=false`
- Visible with `[role="dialog"]` and `aria-modal="true"` when open
- Renders title, close button, content
- Close button click closes modal (removes `[role="dialog"]`)
- Escape key closes modal
- Click overlay closes modal (when `closeOnOverlayClick=true`)

**Dropdown** (`src/u0-primitives/dropdown/Dropdown.svelte`)
- Trigger renders and is clickable
- Click trigger opens menu (`[role="menu"]`)
- Menu items render with `[role="menuitem"]`
- Click item selects and closes menu
- Escape key closes menu
- Click outside closes menu
- Arrow keys navigate items
- Disabled items cannot be selected

**Tooltip** (`src/u0-primitives/tooltip/Tooltip.svelte`)
- Wrapper renders around trigger content
- Hover trigger shows tooltip (`[role="tooltip"]`)
- Mouse leave hides tooltip
- Focus shows tooltip, blur hides it
- Escape hides tooltip when visible
- Position classes: pos-top, pos-right, pos-bottom, pos-left
- Tooltip delay (default 300ms) — fake timers not available in Playwright, so we use `waitFor({ state: 'visible' })` with generous timeout

### Phase 5: Avatar (image + fallback)
**Avatar** (`src/u0-primitives/avatar/Avatar.svelte`)
- Renders `.ds-avatar-wrapper`
- Name prop generates initials fallback
- Size variants: sm, md, md, lg, xl (class check)
- Status dot renders when status prop provided
- All status variants: online, offline, away, busy, typing

## Implementation approach
1. Update `tests/App.svelte` to import and render all 12 new components with their required props
2. Each component gets its own `test.describe` block appended to `tests/design-system.e2e.ts`
3. Follow the existing pattern: render check → variant classes → interaction → a11y
4. Run `npx playwright test` after each phase to verify green
5. Run `npx playwright test --update-snapshots` if visual snapshots are added

## App.svelte changes needed
Add these imports and sections inside the existing `<ThemeProvider>`:
```svelte
import Badge from '../src/u0-primitives/badge/Badge.svelte';
import Input from '../src/u0-primitives/input/Input.svelte';
import Toggle from '../src/u0-primitives/toggle/Toggle.svelte';
import Tabs from '../src/u0-primitives/tabs/Tabs.svelte';
import Accordion from '../src/u0-primitives/accordion/Accordion.svelte';
import Modal from '../src/u0-primitives/modal/Modal.svelte';
import Dropdown from '../src/u0-primitives/dropdown/Dropdown.svelte';
import Tooltip from '../src/u0-primitives/tooltip/Tooltip.svelte';
import Spinner from '../src/u0-primitives/spinner/Spinner.svelte';
import Avatar from '../src/u0-primitives/avatar/Avatar.svelte';
import Steps from '../src/u0-primitives/steps/Steps.svelte';
import type { Tab } from '../src/u0-primitives/tabs/tabs-types';
```

New sections to add (inside `<main>` after existing card sizes/ThemeOverrides sections):
- Badge section: 4 variants × 3 colors (at least), dot example
- Spinner section: 4 sizes × 2 colors
- Input section: default, with error, disabled, password
- Toggle section: unchecked, checked, disabled, all sizes
- Tabs section: 3 tabs with one disabled
- Accordion section: 3 panels
- Modal section: button to open modal
- Dropdown section: trigger button + menu items
- Tooltip section: button with tooltip in each position
- Avatar section: sizes, statuses, fallback initials
- Steps section: 3 steps (completed, active, pending)

## Estimated test count
- Badge: ~12 tests (render + variants + colors + sizes)
- Spinner: ~8 tests (render + sizes + colors)
- Steps: ~6 tests (render + completed/active/connector)
- Input: ~7 tests (render + focus + value + error + disabled + password)
- Toggle: ~7 tests (render + click + keyboard + disabled + sizes)
- Tabs: ~8 tests (render + active + click + keyboard + disabled)
- Accordion: ~6 tests (render + toggle + singleOpen + disabled)
- Modal: ~6 tests (render + close button + escape + overlay)
- Dropdown: ~8 tests (render + open + select + escape + outside + keyboard)
- Tooltip: ~6 tests (hover show/hide + focus + positions + escape)
- Avatar: ~8 tests (render + initials + sizes + statuses)
- Steps: ~6 tests (render + completed/active + connector + label)

**Total: ~90 new E2E tests → ~156 total**

## Test organization
Keep the single `tests/design-system.e2e.ts` file but organize with clear section comments:
```typescript
// ─── Badge tests ───────────────────────────────────────────────────────────
// ─── Spinner tests ─────────────────────────────────────────────────────────
// ─── Steps tests ───────────────────────────────────────────────────────────
// ─── Input tests ───────────────────────────────────────────────────────────
// ─── Toggle tests ──────────────────────────────────────────────────────────
// ─── Tabs tests ────────────────────────────────────────────────────────────
// ─── Accordion tests ───────────────────────────────────────────────────────
// ─── Modal tests ───────────────────────────────────────────────────────────
// ─── Dropdown tests ────────────────────────────────────────────────────────
// ─── Tooltip tests ─────────────────────────────────────────────────────────
// ─── Avatar tests ──────────────────────────────────────────────────────────
```

## Verification
After all phases:
1. `npx playwright test` — expect ~156 passed, 0 failed
2. `npx vitest run` — still 32 unit tests passing (unaffected)
3. commit to design-system main

## NOT in scope (future work)
- Form components: Checkbox, RadioGroup, Select, TextArea, FormToggle, SearchBar, FormField
- Complex components: CommandPalette, AnimatedIcon, LockIndicator, VerticalToolbar
- Data viz: BarChart, SparkLine, Timeline, etc.
- Canvas/spatial: BspTilingCanvas, ForceCanvas, LodRenderer
- Layout: BlockWriter, SnapPanel, SectionSplitter
- Fabric: KanbanBoard, ChatPanel, StatusBar, ToastContainer
- Higher-level unit tests for theme/contrast logic
