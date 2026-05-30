# Card

A container component for grouping related content and actions. Supports variant-specific styling with consistent padding and elevation.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'default' \| 'outlined' \| 'elevated' \| 'subtle'` | `'default'` | Visual style variant controlling border, shadow, and background |
| class | `string` | `''` | Additional CSS classes |
| children | `Snippet` | `undefined` | Card content |

## Usage

```svelte
<script>
  import { Card } from '@stephen-netu/design-system';
</script>

<Card variant="elevated">
  <h2>Card title</h2>
  <p>Card content goes here.</p>
</Card>
```

## Notes

- The `elevated` variant renders a box-shadow; use `outlined` for flat layouts.
- Cards are block-level elements and fill their parent width by default.
- Nest compositions: Card > CardHeader / CardBody / CardFooter for structured layouts.
