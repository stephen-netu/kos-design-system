# Modal

An overlay dialog for focused user interactions. Renders a centered dialog with an optional header, footer, and dismiss controls.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | `boolean` | `false` | Controls visibility of the modal |
| title | `string` | `''` | Title rendered in the modal header |
| onClose | `() => void` | `undefined` | Callback fired when the modal should close |
| showCloseButton | `boolean` | `true` | Whether to render a close (×) button in the header |
| closeOnOverlayClick | `boolean` | `true` | Whether clicking the backdrop closes the modal |
| closeOnEscape | `boolean` | `true` | Whether pressing Escape closes the modal |
| zIndex | `number` | `50` | CSS z-index for the modal overlay |
| class | `string` | `''` | Additional CSS classes on the dialog element |
| children | `Snippet` | `undefined` | Modal body content |
| headerActions | `Snippet` | `undefined` | Actions rendered beside the title in the header |
| footer | `Snippet` | `undefined` | Content rendered in the sticky footer |

## Usage

```svelte
<script>
  import { Modal } from '@stephen-netu/design-system';
</script>

<Modal isOpen={true} title="Confirm action" onClose={() => {}}>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

## Notes

- Focus is trapped inside the modal when open — tabbing cycles within the dialog.
- The overlay renders a semi-transparent backdrop; `zIndex` controls stacking context.
- To prevent accidental dismissal, set `closeOnOverlayClick={false}` and `closeOnEscape={false}` with explicit action buttons in the footer.
- The modal renders via a portal to ensure proper stacking above other content.
