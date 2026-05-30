# @kos/design-system

Svelte 5 component library and design token system for KOS applications. Published to npm as both `@kos/design-system` and `@stephen-netu/design-system`.

## Installation

```bash
npm install @kos/design-system
```

## Usage

```typescript
// Import all components
import { Button, Card, Badge } from '@kos/design-system';

// Import specific layers
import { Button, Card } from '@kos/design-system/u0-primitives';
import { KanbanViewLayout } from '@kos/design-system/l0-layout';

// Import CSS tokens
import '@kos/design-system/base.css';
import '@kos/design-system/tokens.css';
import '@kos/design-system/tokens/control-room.css';
```

## Design Tokens

All values are defined as CSS custom properties:

```css
/* Colors */
--color-bg-app: #141414;
--color-bg-canvas: #1a1a1a;
--color-text-primary: #f2efe9;
--color-accent: #b87333;  /* brass/copper */

/* Typography */
--font-sans: 'Outfit', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Spacing */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
```

Theme variants (e.g. `control-room.css`) layer on top of the base tokens.

## Architecture

Components are organized into layered domains:

| Layer | Scope |
|-------|-------|
| `p0-primitives` | Types, tokens, utilities |
| `u0-primitives` | Atoms: Button, Input, Card, Badge, Avatar, Toggle |
| `l0-layout` | Molecules/Organisms: KanbanViewLayout, GroveCard |
| `f0-forms` | Form components: FormField, Select, TextArea |
| `s0-state` | Svelte 5 rune wrappers |
| `t0-transport` | Tauri IPC utilities |
| `d0-data-viz` | Data visualization: BarChart, MetricCard |
| `n0-node-graph` | Node graph components: NodeCanvas, GraphEditor |
| `n1-flow-canvas` | Canvas 2D flow editor |
| `n2-manifold-disk` | Poincare disk projection |
| `n3-force-graph` | Force-directed graph layout |
| `n4-adaptive-manifold` | Adaptive manifold visualization |

## Development

```bash
# Install dependencies
pnpm install

# Run Storybook
pnpm storybook

# Build library
pnpm build

# Run tests
pnpm test
```

## Versioning

Uses [@changesets/cli](https://github.com/changesets/changesets) for versioning and changelog generation.

## Releasing

```bash
pnpm changeset version
pnpm changeset publish
```

## Contributing

1. Create a changeset for your changes: `pnpm changeset`
2. Ensure `.githooks` are enabled (topology gate checks run on commit)
3. Submit a PR with the changeset file included

## License

MIT
