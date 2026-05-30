# Badge

A small status indicator or label for highlighting attributes. Typically used for counts, categories, or status cues.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'solid' \| 'soft' \| 'outline'` | `'solid'` | Visual style variant controlling fill and contrast |
| color | `'gray' \| 'red' \| 'green' \| 'blue' \| 'yellow' \| 'purple'` | `'gray'` | Color theme of the badge |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the badge text and padding |
| class | `string` | `''` | Additional CSS classes |
| children | `Snippet` | `undefined` | Badge label content |

## Usage

```svelte
<script>
  import { Badge } from '@stephen-netu/design-system';
</script>

<Badge color="green" variant="soft">Active</Badge>
<Badge color="red" size="sm">3</Badge>
```

## Notes

- `soft` variant renders a low-contrast background with colored text — appropriate for dense lists.
- `outline` variant renders a bordered badge with transparent background.
- For numeric counts > 99, consider formatting the children text externally (e.g., "99+").
