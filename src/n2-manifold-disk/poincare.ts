// Poincaré disk projection — ~50 lines of pure math
// κ = 1.0 fixed (standard Poincaré disk)
// S-02: pure functions, no side effects, deterministic

import type { NodeLayout } from '../n1-flow-canvas/types.js';

// Complex number as [real, imag] tuple
type Complex = readonly [number, number];

// ── Complex arithmetic ────────────────────────────────────────────────────────

function cadd(a: Complex, b: Complex): Complex {
  return [a[0] + b[0], a[1] + b[1]];
}

function csub(a: Complex, b: Complex): Complex {
  return [a[0] - b[0], a[1] - b[1]];
}

function cmul(a: Complex, b: Complex): Complex {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}

function cdiv(a: Complex, b: Complex): Complex {
  const denom = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / denom, (a[1] * b[0] - a[0] * b[1]) / denom];
}

function cconj(a: Complex): Complex {
  return [a[0], -a[1]];
}

function cabs(a: Complex): number {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
}

// ── Möbius transform ──────────────────────────────────────────────────────────

/**
 * Möbius transform that moves z0 to the origin.
 * f(z) = (z − z0) / (1 − conj(z0) · z)
 * Preserves the unit disk: |z| ≤ 1 → |f(z)| ≤ 1
 */
export function mobiusTransform(z: Complex, z0: Complex): Complex {
  const num = csub(z, z0);
  const den = csub([1, 0], cmul(cconj(z0), z));
  return cdiv(num, den);
}

/**
 * Project Euclidean node positions onto the Poincaré disk.
 *
 * Steps:
 * 1. Normalize all positions to [-1, 1]² using bounding box
 * 2. Apply Möbius transform to center focusNodeId at origin
 * 3. Scale to diskRadius
 *
 * Returns a new Map — does not mutate input.
 */
export function projectToDisk(
  positions: Map<string, NodeLayout>,
  focusNodeId: string | null,
  diskRadius: number,
): Map<string, { x: number; y: number; width: number; height: number }> {
  if (positions.size === 0) return new Map();

  // Bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of positions.values()) {
    const cx = p.x + p.width  / 2;
    const cy = p.y + p.height / 2;
    if (cx < minX) minX = cx;
    if (cy < minY) minY = cy;
    if (cx > maxX) maxX = cx;
    if (cy > maxY) maxY = cy;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const range  = Math.max(rangeX, rangeY);

  // Normalize to Poincaré disk unit coords, then scale to 0.9 max radius
  function toComplex(p: NodeLayout): Complex {
    const cx = p.x + p.width  / 2;
    const cy = p.y + p.height / 2;
    return [
      ((cx - minX) / range * 2 - rangeX / range) * 0.9,
      ((cy - minY) / range * 2 - rangeY / range) * 0.9,
    ];
  }

  // Focus center in normalized coords
  const focusPos = focusNodeId ? positions.get(focusNodeId) : null;
  const z0: Complex = focusPos ? toComplex(focusPos) : [0, 0];

  const result = new Map<string, { x: number; y: number; width: number; height: number }>();

  for (const [id, p] of positions) {
    const z = toComplex(p);
    const projected = mobiusTransform(z, z0);
    // Clamp to unit disk (numerical safety)
    const r = cabs(projected);
    const clamped: Complex = r > 0.99 ? [projected[0] * 0.99 / r, projected[1] * 0.99 / r] : projected;

    result.set(id, {
      x: clamped[0] * diskRadius + diskRadius - p.width  / 2,
      y: clamped[1] * diskRadius + diskRadius - p.height / 2,
      width:  p.width,
      height: p.height,
    });
  }

  return result;
}

/**
 * Poincaré distance between two points in the disk.
 * d(u,v) = 2 * atanh(|u - v| / |1 - conj(u)v|)
 */
export function poincareDistance(u: Complex, v: Complex): number {
  const num = cabs(csub(u, v));
  const den = cabs(csub([1, 0], cmul(cconj(u), v)));
  return 2 * Math.atanh(num / den);
}

// ── S³ quaternion projection ──────────────────────────────────────────────────

/**
 * A point on the Poincaré disk derived from a unit quaternion on S³.
 *
 * Fields:
 * - `u`, `v` — disk coordinates in pixels, relative to disk centre
 * - `id`     — inhabitant identifier
 * - `allay`  — accumulated arc length (monotonically increasing)
 */
export interface AgentPosition {
  id: string;
  u: number;  // disk x, relative to centre
  v: number;  // disk y, relative to centre
  allay: number;
}

/**
 * Project a unit quaternion [w, i, j, k] onto the Poincaré disk.
 *
 * Uses axis-angle parameterisation of S³:
 *   θ = 2·acos(clamp(w, −1, 1))          — total rotation angle
 *   axis = (i, j, k) / sin(θ/2)           — unit rotation axis
 *   r = θ/π · 0.95 · diskRadius           — radial distance on disk
 *   u = r · axis.i                         — Accumulation axis → disk X
 *   v = r · axis.j                         — Actuation axis → disk Y
 *
 * Properties:
 * - Identity quaternion (w=1) maps to disk centre — zero rotation.
 * - Maximally rotated quaternion (w=−1, θ=2π) maps to boundary.
 * - The rotation axis angle on disk reflects semantic orientation:
 *   i=Accumulation (X), j=Actuation (Y), k=Relation (depth, ignored here).
 *
 * S-02: pure function, no side effects.
 */
export function quaternionToDisk(
  w: number,
  i: number,
  j: number,
  _k: number,
  diskRadius: number,
): { u: number; v: number } {
  const wClamped = Math.max(-1, Math.min(1, w));
  const theta = 2 * Math.acos(wClamped);

  if (theta < 1e-9) {
    // Identity — centre of disk
    return { u: 0, v: 0 };
  }

  const sinHalf = Math.sin(theta / 2);
  // r in [0, 0.95 * diskRadius]; maps θ=0 → centre, θ=π → boundary
  const r = (theta / Math.PI) * 0.95 * diskRadius;

  return {
    u: r * (i / sinHalf),
    v: r * (j / sinHalf),
  };
}
