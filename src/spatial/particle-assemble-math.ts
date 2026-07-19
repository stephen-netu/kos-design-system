// Pure math for ParticleAssembleMark — kept separate from the .svelte
// RAF/canvas runner so it's unit-testable without a real canvas 2D context
// (mirrors this dir's split between *-types.ts/simulation logic and the
// thin canvas-runner .svelte components, e.g. ForceSimulation vs ForceCanvas).

export interface Fit {
  scale: number;
  dx: number;
  dy: number;
}

/** Fit a viewBoxWidth x viewBoxHeight shape, centered, into canvasWidth x canvasHeight. */
export function fitScale(
  viewBoxWidth: number,
  viewBoxHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  padRatio = 0.92
): Fit {
  const scale = Math.min(canvasWidth / viewBoxWidth, canvasHeight / viewBoxHeight) * padRatio;
  const dx = (canvasWidth - viewBoxWidth * scale) / 2;
  const dy = (canvasHeight - viewBoxHeight * scale) / 2;
  return { scale, dx, dy };
}

export function easeOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return 1 - Math.pow(1 - clamped, 3);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface ParticleFrame {
  x: number;
  y: number;
  alpha: number;
}

/** Position + alpha for a particle at a given eased progress (0..1). */
export function particleFrame(
  particle: { x: number; y: number; tx: number; ty: number },
  eased: number
): ParticleFrame {
  return {
    x: lerp(particle.x, particle.tx, eased),
    y: lerp(particle.y, particle.ty, eased),
    alpha: 0.3 + eased * 0.7
  };
}
