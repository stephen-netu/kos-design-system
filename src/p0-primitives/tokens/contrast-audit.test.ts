// Tests for the WCAG color contrast audit
import { describe, it, expect } from 'vitest';
import {
  parseHex,
  parseRgb,
  parseHsl,
  parseColor,
  sRGBtoLinear,
  relativeLuminance,
  contrastRatio,
  auditContrast,
  formatAuditReport,
} from '../contrast-audit';

describe('Color parsing', () => {
  it('parses hex colors', () => {
    expect(parseHex('#0d1117')).toEqual({ r: 13, g: 17, b: 23, alpha: 1 });
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255, alpha: 1 });
    expect(parseHex('invalid')).toBeNull();
  });

  it('parses rgb() colors', () => {
    expect(parseRgb('rgb(255, 255, 255)')).toEqual({ r: 255, g: 255, b: 255, alpha: 1 });
    expect(parseRgb('rgba(88, 166, 255, 0.12)')).toEqual({ r: 88, g: 166, b: 255, alpha: 0.12 });
  });

  it('parses hsl() colors', () => {
    const result = parseHsl('hsl(210, 50%, 50%)');
    expect(result).not.toBeNull();
    expect(result!.r).toBeCloseTo(64, 0);
    expect(result!.g).toBeCloseTo(150, 0);
    expect(result!.b).toBeCloseTo(191, 0);
  });

  it('returns null for unparseable colors', () => {
    expect(parseColor('not-a-color')).toBeNull();
    expect(parseColor('')).toBeNull();
  });
});

describe('Relative luminance', () => {
  it('computes sRGB linearization correctly', () => {
    expect(sRGBtoLinear(0)).toBe(0);
    expect(sRGBtoLinear(255)).toBeCloseTo(1.0, 4);
  });

  it('computes relative luminance for white', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255, alpha: 1 })).toBeCloseTo(1.0, 4);
  });

  it('computes relative luminance for black', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0, alpha: 1 })).toBe(0);
  });
});

describe('Contrast ratio', () => {
  it('computes ratio for white on black', () => {
    const white = { r: 255, g: 255, b: 255, alpha: 1 };
    const black = { r: 0, g: 0, b: 0, alpha: 1 };
    expect(contrastRatio(white, black)).toBeCloseTo(21, 0);
  });

  it('same color has ratio of 1', () => {
    const c = { r: 128, g: 128, b: 128, alpha: 1 };
    expect(contrastRatio(c, c)).toBe(1);
  });
});

describe('Audit integration', () => {
  const testCss = `
:root {
  --color-bg-primary: #0d1117;
  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-accent: #58a6ff;
  --color-success: #3fb950;
  --color-bg-panel: #21262d;
}
`;

  it('extracts CSS variables from a stylesheet string', () => {
    const { extractCSSVariables } = await import('../contrast-audit');
    const vars = extractCSSVariables(testCss);
    expect(vars.get('--color-bg-primary')).toBe('#0d1117');
    expect(vars.get('--color-text-primary')).toBe('#e6edf3');
  });

  it('resolves var() references', () => {
    const { resolveVarValue } = await import('../contrast-audit');
    const vars = new Map([['--color-accent', '#58a6ff']]);
    expect(resolveVarValue('var(--color-accent)', vars)).toBe('#58a6ff');
    expect(resolveVarValue('var(--missing, #fff)', vars)).toBe('#fff');
  });

  it('audits token pairs and returns results', () => {
    const results = auditContrast(testCss);
    expect(results.length).toBeGreaterThan(0);
    const bodyText = results.find((r) => r.name.includes('text-primary on bg-primary'));
    expect(bodyText).toBeDefined();
    expect(bodyText!.pass).toBe(true);
    expect(bodyText!.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('formats a readable report', () => {
    const results = auditContrast(testCss);
    const report = formatAuditReport(results);
    expect(report).toContain('COLOR CONTRAST AUDIT');
    expect(report).toContain('PASS');
  });
});