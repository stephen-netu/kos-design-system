# Input

A text input field for user entry. Supports labels, icons, error states, and full ARIA accessibility.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `'text' \| 'password' \| 'email' \| 'number' \| 'search' \| 'tel' \| 'url'` | `'text'` | HTML input type |
| placeholder | `string` | `''` | Placeholder text |
| disabled | `boolean` | `false` | Whether the input is disabled |
| error | `string \| boolean` | `false` | Error message string, or `true` for error styling without a message |
| value | `string` | `''` | Controlled value of the input |
| class | `string` | `''` | Additional CSS classes |
| id | `string` | `undefined` | HTML id attribute (auto-generated if omitted) |
| name | `string` | `undefined` | HTML name attribute for form submission |
| label | `string` | `undefined` | Label rendered above the input |
| iconLeading | `Snippet` | `undefined` | Icon rendered inside the input, left side |
| onchange | `(value: string) => void` | `undefined` | Change event handler receiving the current value |

## Usage

```svelte
<script>
  import { Input } from '@stephen-netu/design-system';
</script>

<Input label="Email" type="email" placeholder="you@example.com" />

<Input label="Password" type="password" error="Password is required" />
```

## Notes

- When `label` is provided, an associated `id` is auto-generated and linked via `for`/`aria-labelledby`.
- The `iconLeading` snippet should be an icon component sized to 16×16 or 20×20px.
- Error styling is applied when `error` is truthy regardless of its value; pass a string to render an error message below the input.
- The input renders with `width: 100%` by default — wrap in a container to constrain width.
