import { describe, it, expect } from 'vitest';
import { fitScale, easeOutCubic, lerp, particleFrame } from './particle-assemble-math';

describe('fitScale', () => {
  it('centers a shape narrower than the canvas', () => {
    const { scale, dx, dy } = fitScale(100, 100, 200, 200, 1);
    expect(scale).toBe(2);
    expect(dx).toBe(0);
    expect(dy).toBe(0);
  });

  it('applies padRatio to shrink the fitted shape', () => {
    const { scale, dx } = fitScale(100, 100, 200, 200, 0.5);
    expect(scale).toBe(1);
    expect(dx).toBe(50);
  });

  it('fits by the constraining dimension for non-square aspect ratios', () => {
    const { scale, dx, dy } = fitScale(270, 305, 1000, 1000, 1);
    // height is the tighter constraint (305 > 270), so scale is bound by height
    expect(scale).toBeCloseTo(1000 / 305, 5);
    expect(dx).toBeGreaterThan(0);
    expect(dy).toBe(0);
  });
});

describe('easeOutCubic', () => {
  it('maps 0 to 0 and 1 to 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('clamps progress outside [0, 1]', () => {
    expect(easeOutCubic(-0.5)).toBe(0);
    expect(easeOutCubic(1.5)).toBe(1);
  });

  it('decelerates — front-loads more progress than a linear ramp', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe('lerp', () => {
  it('interpolates linearly', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe('particleFrame', () => {
  it('starts at the origin position with alpha 0.3 when eased is 0', () => {
    const frame = particleFrame({ x: 10, y: 20, tx: 100, ty: 200 }, 0);
    expect(frame.x).toBe(10);
    expect(frame.y).toBe(20);
    expect(frame.alpha).toBeCloseTo(0.3);
  });

  it('ends at the target position with alpha 1 when eased is 1', () => {
    const frame = particleFrame({ x: 10, y: 20, tx: 100, ty: 200 }, 1);
    expect(frame.x).toBe(100);
    expect(frame.y).toBe(200);
    expect(frame.alpha).toBeCloseTo(1);
  });
});
