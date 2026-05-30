# Dropdown

An anchored popup menu for presenting a list of selectable options relative to a trigger element.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | `Array<{ id: string, label: string, icon?: Snippet, disabled?: boolean, divider?: boolean }>` | `[]` | Menu items to render in the dropdown |
| trigger | `Snippet` | `undefined` | The clickable element that opens the dropdown |
| align | `'left' \| 'right'` | `'left'` | Horizontal alignment of the dropdown relative to the trigger |
| width | `string \| number` | `'auto'` | Width of the dropdown menu (CSS value or px number) |
| class | `string` | `''` | Additional CSS classes on the dropdown menu |
| onselect | `(id: string) => void` | `undefined` | Callback fired when an item is selected |

## Usage

```svelte
<script>
  import { Dropdown } from '@stephen-netu/design-system';

  const items = [
    { id: 'edit', label: 'Edit' },
    { id: 'duplicate', label: 'Duplicate' },
    { id: 'delete', label: 'Delete' },
  ];
</script>

<Dropdown {items} {trigger} onselect={(id) => console.log(id)} />
```

## Notes

- The dropdown closes automatically after `onselect` fires and on outside click.
- Items with `divider: true` render a separator line instead of a clickable option.
- Keyboard navigation (Arrow keys + Enter) is built in.
- Use the `trigger` snippet to render custom trigger elements (buttons, icons, avatars).
- The dropdown positions using floating placement — overflow is handled via auto-flip.
