import { describe, it, expect, vi } from 'vitest';
import { getEffectiveCheckpointColor, CHECKPOINT_CSS_VARS, CHECKPOINT_DEFAULT_COLORS } from './theme-integration';
import type { CheckpointComponentType } from './checkpoint-types';

describe('d0-data-viz/theme-integration', () => {
  it('CHECKPOINT_CSS_VARS covers all component types', () => {
    const types: CheckpointComponentType[] = [
      'rust-crate',
      'ui-bundle',
      'config',
      'faculty-state',
      'substrate-binary',
      'system-snapshot',
    ];
    for (const type of types) {
      expect(CHECKPOINT_CSS_VARS[type]).toBeDefined();
    }
  });

  it('CHECKPOINT_DEFAULT_COLORS has light and dark for all types', () => {
    const types: CheckpointComponentType[] = [
      'rust-crate',
      'ui-bundle',
      'config',
      'faculty-state',
      'substrate-binary',
      'system-snapshot',
    ];
    for (const type of types) {
      expect(CHECKPOINT_DEFAULT_COLORS[type]).toBeDefined();
      expect(CHECKPOINT_DEFAULT_COLORS[type].light).toMatch(/^#[0-9a-f]{6}$/);
      expect(CHECKPOINT_DEFAULT_COLORS[type].dark).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('getEffectiveCheckpointColor returns CSS var reference in browser', () => {
    // jsdom sets typeof window !== 'undefined'
    const color = getEffectiveCheckpointColor('rust-crate', true);
    expect(color).toContain('var(--d0-checkpoint-rust');
  });

  it('getEffectiveCheckpointColor returns fallback when isDark is false', () => {
    const color = getEffectiveCheckpointColor('ui-bundle', false);
    expect(color).toContain('var(--d0-checkpoint-ui');
  });
});
