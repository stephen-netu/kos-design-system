import { describe, it, expect } from 'vitest';
import { layoutToStyle } from '../layout-to-style';
import type { Layout } from '../types';

const baseLayout: Layout = {
  direction: 'row',
  gap: 8,
  padding: [4, 8, 4, 8],
  align: 'start',
  childAlignment: 'start',
  sizing: 'fit',
};

describe('layoutToStyle', () => {
  describe('direction', () => {
    it('maps row to flex row', () => {
      const result = layoutToStyle({ ...baseLayout, direction: 'row' });
      expect(result).toContain('--layout-direction: row');
    });

    it('maps column to flex column', () => {
      const result = layoutToStyle({ ...baseLayout, direction: 'column' });
      expect(result).toContain('--layout-direction: column');
    });
  });

  describe('gap', () => {
    it('outputs gap in px', () => {
      const result = layoutToStyle({ ...baseLayout, gap: 16 });
      expect(result).toContain('--layout-gap: 16px');
    });
  });

  describe('padding', () => {
it('outputs all four padding sides', () => {
       const result = layoutToStyle({
         ...baseLayout,
         padding: [1, 2, 3, 4],
       });
       expect(result).toContain('--layout-padding-top: 1px');
       expect(result).toContain('--layout-padding-right: 2px');
       expect(result).toContain('--layout-padding-bottom: 3px');
       expect(result).toContain('--layout-padding-left: 4px');
     });
  });

  describe('align + childAlignment (row)', () => {
    it('row: childAlignment → justify-content, align → align-items', () => {
      const result = layoutToStyle({
        ...baseLayout,
        direction: 'row',
        align: 'center',
        childAlignment: 'end',
      });
      expect(result).toContain('--layout-justify-content: flex-end');
      expect(result).toContain('--layout-align-items: center');
    });
  });

  describe('align + childAlignment (column)', () => {
    it('column: align → justify-content, childAlignment → align-items', () => {
      const result = layoutToStyle({
        ...baseLayout,
        direction: 'column',
        align: 'center',
        childAlignment: 'end',
      });
      expect(result).toContain('--layout-justify-content: center');
      expect(result).toContain('--layout-align-items: flex-end');
    });
  });

  describe('all LayoutAlign values', () => {
    const aligns: Array<'start' | 'center' | 'end' | 'stretch'> = ['start', 'center', 'end', 'stretch'];
    for (const align of aligns) {
      it(`maps align=${align} to correct CSS`, () => {
        const result = layoutToStyle({ ...baseLayout, align });
        const expected = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align;
        expect(result).toContain(`--layout-align-items: ${expected}`);
      });
    }
  });

  describe('sizing', () => {
    it('fit: flex-basis auto, grow 0, shrink 1', () => {
      const result = layoutToStyle({ ...baseLayout, sizing: 'fit' });
      expect(result).toContain('--layout-flex-basis: auto');
      expect(result).toContain('--layout-flex-grow: 0');
      expect(result).toContain('--layout-flex-shrink: 1');
    });

    it('grow: flex-basis 0%, grow 1, shrink 1', () => {
      const result = layoutToStyle({ ...baseLayout, sizing: 'grow' });
      expect(result).toContain('--layout-flex-basis: 0%');
      expect(result).toContain('--layout-flex-grow: 1');
      expect(result).toContain('--layout-flex-shrink: 1');
    });

    it('fixed: flex-basis auto, grow 0, shrink 0', () => {
      const result = layoutToStyle({ ...baseLayout, sizing: 'fixed' });
      expect(result).toContain('--layout-flex-basis: auto');
      expect(result).toContain('--layout-flex-grow: 0');
      expect(result).toContain('--layout-flex-shrink: 0');
    });

    it('{min,max}: outputs min-width and max-width', () => {
      const result = layoutToStyle({ ...baseLayout, sizing: { min: 100, max: 500 } });
      expect(result).toContain('--layout-min-width: 100px');
      expect(result).toContain('--layout-max-width: 500px');
    });
  });

  describe('output format', () => {
    it('returns a semicolon-separated custom-property string', () => {
      const result = layoutToStyle(baseLayout);
      expect(result).toMatch(/^--layout-[\w-]+: .+(; --layout-[\w-]+: .+)*$/);
    });

    it('contains no inline literals (no display:, no raw gap:)', () => {
      const result = layoutToStyle(baseLayout);
      expect(result).not.toMatch(/display:\s/);
      expect(result).not.toMatch(/(^|; )gap:\s/);
    });
  });
});
