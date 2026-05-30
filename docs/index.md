# @stephen-netu/design-system

KOS LEAP Design System — Neo-brutalist industrial UI component library for Svelte 5.

## Installation

```bash
pnpm add @stephen-netu/design-system
```

## Quick Start

```svelte
<script>
  import { Button, Card, Badge, ThemeProvider } from '@stephen-netu/design-system';
</script>

<ThemeProvider mode="dark">
  <Card>
    <Badge variant="accent">New</Badge>
    <Button variant="primary">Get Started</Button>
  </Card>
</ThemeProvider>
```

## Components

### Primitives (Atoms)
- [Button](./components/button.md)
- [Card](./components/card.md)
- [Badge](./components/badge.md)
- [Input](./components/input.md)
- [Toggle](./components/toggle.md)
- [Tabs](./components/tabs.md)
- [Modal](./components/modal.md)
- [Dropdown](./components/dropdown.md)
- [Accordion](./components/accordion.md)
- [Tooltip](./components/tooltip.md)
- [Avatar](./components/avatar.md)
- [Spinner](./components/spinner.md)
- [Steps](./components/steps.md)

### Forms
- [Select](./components/select.md)
- [Checkbox](./components/checkbox.md)
- [RadioGroup](./components/radio-group.md)

## Theming

### Theme Mode

```svelte
<script>
  import { ThemeProvider, themeStore } from '@stephen-netu/design-system';
</script>

<ThemeProvider mode="auto">
  <!-- Content -->
</ThemeProvider>

<button onclick={() => themeStore.toggleTheme()}>Toggle Theme</button>
```

### ThemeStore API

| Method | Description |
|--------|-------------|
| `themeStore.theme` | Current theme: `'dark' \| 'light' \| 'control-room'` |
| `themeStore.setTheme(t)` | Set theme programmatically |
| `themeStore.toggleTheme()` | Cycle through dark → light → control-room → dark |

## Design Tokens

All components use CSS custom properties. Import tokens:

```css
@import '@kos/design-system/tokens.css';
```

### Color Tokens

```css
/* Backgrounds */
var(--color-bg-app)
var(--color-bg-canvas)
var(--color-bg-panel)

/* Text */
var(--color-text-primary)
var(--color-text-secondary)
var(--color-text-muted)

/* Accent */
var(--color-accent)
var(--color-accent-hover)
var(--color-accent-glow)

/* Status */
var(--color-success)
var(--color-warning)
var(--color-error)
```

### Spacing Tokens

```css
--space-05: 0.125rem;  /* 2px */
--space-1:  0.25rem;   /* 4px */
--space-15: 0.375rem;  /* 6px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```
