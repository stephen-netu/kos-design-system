// U0 Tabs — Tab type definition
// Extracted from Tabs.svelte so tsc can resolve it without Svelte type declarations.

import type { Snippet } from 'svelte';

export interface Tab {
  id: string;
  label: string | Snippet;
  disabled?: boolean;
  icon?: Snippet;
}
