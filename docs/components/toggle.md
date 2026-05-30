# Toggle

A binary switch for toggling a setting on or off. Renders as a sliding switch with an optional label.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | `boolean` | `false` | Whether the toggle is on |
| disabled | `boolean` | `false` | Whether the toggle is disabled |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the toggle switch |
| class | `string` | `''` | Additional CSS classes |
| label | `string` | `undefined` | Label rendered beside the toggle |
| onchange | `(checked: boolean) => void` | `undefined` | Change event handler receiving the new checked state |

## Usage

```svelte
<script>
  import { Toggle } from '@stephen-netu/design-system';
</script>

<Toggle label="Enable notifications" bind:checked={true} />

<Toggle label="Dark mode" onchange={(v) => console.log(v)} />
```

## Notes

- The toggle is an accessible checkbox under the hood — it responds to Space and Enter keys.
- When `label` is provided, clicking the label text also toggles the switch.
- Use `bind:checked` for two-way binding in Svelte 5, or `onchange` for event-only updates.
