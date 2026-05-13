// Contrast Audit — WCAG color contrast validation
// Run via: npx vitest run src/p0-primitives/tokens/contrast-audit.test.ts
// Run via: npx tsx src/p0-primitives/tokens/contrast-audit.ts

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    globals: true,
  },
});