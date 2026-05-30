# Button

A clickable button component that triggers an action or event. Supports multiple variants, sizes, icons, and loading states.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'tertiary' \| 'danger'` | `'primary'` | Visual style variant |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the button |
| type | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type attribute |
| disabled | `boolean` | `false` | Whether the button is disabled |
| loading | `boolean` | `false` | Whether the button shows a loading spinner |
| class | `string` | `''` | Additional CSS classes |
| aria-label | `string` | `undefined` | Accessible label for the button |
| onclick | `() => void` | `undefined` | Click event handler |
| children | `Snippet` | `undefined` | Button content |
| iconLeading | `Snippet` | `undefined` | Icon rendered before the label |
| iconTrailing | `Snippet` | `undefined` | Icon rendered after the label |

## Usage

```svelte
<script>
  import { Button } from '@stephen-netu/design-system';
</script>

<Button variant="primary" size="md" onclick={() => console.log('clicked')}>
  Click me
</Button>

<Button variant="danger" loading>
  Saving...
</Button>
```

## Notes

- When `loading` is `true`, the button is automatically disabled and a spinner replaces `iconLeading`.
- The `aria-label` prop is required when the button has no visible text content (icon-only buttons).
- `danger` variant emits a warning in development when not used with a confirmation dialog pattern.
