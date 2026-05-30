# AnimatedIcon

SMIL-based animated SVG icons. Zero JavaScript overhead, GPU-accelerated via browser-native SVG animation.

## Philosophy

Aligns with LEAP's "enchanted" component philosophy from x0-enchanted-blocks:
- **Declarative**: Animations defined in markup, not JavaScript
- **Performant**: SMIL runs on the browser's compositor thread
- **Accessible**: Respects `prefers-reduced-motion` automatically

## Usage

```svelte
<script>
  import { AnimatedIcon } from '@kos/design-system/u0-primitives/animated-icon';
</script>

<AnimatedIcon name="power-node" animation="pulse" size={40} />
<AnimatedIcon name="activity" animation="wave" speed={0.5} />
<AnimatedIcon name="connection" color="#27ae60" />
<AnimatedIcon name="energy-pulse" animation="energy-arcs" />
```

## Icons

| Name | Description | Animations |
|------|-------------|------------|
| `power-node` | Energy/data center node | `pulse`, `orbit` |
| `activity` | Audio/video activity bars | `wave` (default) |
| `connection` | Network/data flow | `pulse` (default) |
| `status-ring` | Loading/progress ring | `spin`, `breathe` |
| `power-plant` | Power plant silhouette with cooling tower | `steam`, `pulse` |
| `orbital-ring` | Orbital ring with rotating elements | `pulse` (default) |
| `steam-tower` | Minimal steam tower with rising particles | `steam` (default) |
| `energy-pulse` | Energy pulse with radiating arcs | `pulse`, `energy-arcs` |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `IconName` | required | Icon identifier |
| `size` | `number` | `40` | ViewBox size (px) |
| `color` | `string` | `var(--color-accent)` | CSS color value |
| `animation` | `AnimationType` | `'pulse'` | Animation style |
| `speed` | `number` | `1` | Multiplier (0.5 = slower, 2 = faster) |

## Animation Types

| Animation | Icons | Description |
|-----------|-------|-------------|
| `pulse` | power-node, connection, status-ring, power-plant, orbital-ring, steam-tower, energy-pulse | Pulsing/radiating opacity or size |
| `orbit` | power-node | Orbiting dot around center |
| `wave` | activity | Bar height oscillation |
| `spin` | status-ring | Rotating segments |
| `breathe` | status-ring | Opacity fade in/out |
| `steam` | power-plant, steam-tower | Rising steam/particle plumes |
| `energy-arcs` | energy-pulse | Radiating line arcs in 4 directions |

## Design Tokens

Uses standard LEAP accent colors:
- `--color-accent` (primary)
- `--color-accent-hover`
- `--epistemic-live` (success states)
- `--epistemic-pending` (warning states)

## Browser Support

SMIL is supported in all modern browsers. For legacy environments, icons degrade gracefully to static SVG.
