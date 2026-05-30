# Tabs

A tabbed navigation component for switching between panels of content. Manages active tab state and renders tab list + content area.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | `Array<{ id: string, label: string, content: Snippet }>` | `[]` | Array of tab definitions with id, label, and content snippet |
| activeTab | `string` | `undefined` | Controlled active tab id (defaults to first tab) |
| onTabChange | `(id: string) => void` | `undefined` | Callback fired when the active tab changes |
| class | `string` | `''` | Additional CSS classes on the container |

## Usage

```svelte
<script>
  import { Tabs } from '@stephen-netu/design-system';

  const myTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'settings', label: 'Settings' },
    { id: 'activity', label: 'Activity' },
  ];
</script>

<Tabs tabs={myTabs} onTabChange={(id) => console.log(id)} />
```

## Notes

- Tab `id` values must be unique within the component.
- Snippets can be passed as children of each tab item for deferred content rendering.
- The component renders a `tablist` with proper ARIA roles (`tab`, `tabpanel`). Keyboard navigation (Arrow keys) is built in.
- Use `activeTab` prop for controlled state; omit for internal state management.
