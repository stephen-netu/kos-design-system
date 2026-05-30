# Accordion

A vertically stacked set of expandable panels for organizing content. Supports single-open or multi-open modes with controlled or uncontrolled state.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| panels | `Array<{ id: string, title: string, content: Snippet }>` | `[]` | Array of panel definitions with id, title header, and expandable content |
| defaultOpen | `string[]` | `[]` | Array of panel ids open by default (uncontrolled mode) |
| singleOpen | `boolean` | `false` | When `true`, only one panel can be open at a time |
| onOpenChange | `(ids: string[]) => void` | `undefined` | Callback fired when open panels change |
| open | `string[]` | `undefined` | Controlled array of open panel ids |
| class | `string` | `''` | Additional CSS classes on the container |

## Usage

```svelte
<script>
  import { Accordion } from '@stephen-netu/design-system';

  const panels = [
    { id: 'faq-1', title: 'How does it work?', content: 'Lorem ipsum...' },
    { id: 'faq-2', title: 'Is it free?', content: 'Yes, it is.' },
  ];
</script>

<Accordion {panels} singleOpen={false} />
```

## Notes

- Use the `open` prop for fully controlled state; use `defaultOpen` for uncontrolled mode.
- When `singleOpen` is `true`, opening one panel automatically closes the others.
- Each panel animates its expand/collapse transition via CSS grid or height interpolation.
- Keyboard support: Tab enters the accordion, Arrow keys navigate panels, Enter/Space toggles.
- Panel `id` values must be unique within the accordion instance.
