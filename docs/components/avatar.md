# Avatar

A circular image or initials-based avatar for representing users or entities. Supports fallback initials when no image is provided.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | `string` | `undefined` | Image source URL |
| name | `string` | `''` | Display name used for initials fallback and `aria-label` |
| size | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size of the avatar in predefined steps |
| status | `'online' \| 'offline' \| 'away' \| 'busy'` | `undefined` | Status indicator dot rendered in the corner |
| class | `string` | `''` | Additional CSS classes |

## Usage

```svelte
<script>
  import { Avatar } from '@stephen-netu/design-system';
</script>

<Avatar name="Jane Doe" src="/avatars/jane.jpg" />
<Avatar name="John Smith" size="sm" status="online" />
```

## Notes

- When `src` is undefined or fails to load, the component falls back to initials derived from `name` (first letter of first and last name).
- Initials are rendered on a background color deterministically derived from the name string.
- The `status` prop renders a colored dot in the bottom-right corner with a 2px border matching the avatar background.
- The component renders as a round image element with `object-fit: cover`.
- An `alt` attribute is auto-generated from `name` for screen readers.
