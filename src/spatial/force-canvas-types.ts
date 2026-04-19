// ForceCanvas — d3-force simulation types for spatial content layout
// S-02: Integer permille for weights. Monotonic counter for tick. No Math.random.
// S-05: Simulation has bounded iteration count per tick.

/** A cell in the force simulation */
export interface ForceCell {
  id: string;
  label: string;
  /** Content type for visual differentiation */
  contentType: 'text' | 'code' | 'url' | 'image' | 'filepath';
  /** Visual weight — controls rendered size. Integer permille (0–1000). */
  weight: number;
  /** Embedding vector for semantic distance computation. Null = no embedding yet. */
  embedding: number[] | null;
  /** Pinned position (user-placed). Set fx/fy to pin. */
  fx?: number | null;
  fy?: number | null;
  /** Arbitrary data for rendering */
  data?: Record<string, unknown>;
  // d3-force internal (populated by simulation)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
}

/** Semantic link between cells (derived from embedding distance) */
export interface ForceLink {
  source: string;
  target: string;
  /** Semantic distance (0 = identical, 1 = unrelated). Drives spring length. */
  distance: number;
}

/** ForceCanvas configuration */
export interface ForceCanvasConfig {
  /** Charge strength (repulsion between cells). Default -80. */
  chargeStrength?: number;
  /** Collision radius padding in px. Default 4. */
  collisionPadding?: number;
  /** Wall force margin in px (repulsion from zone boundary). Default 20. */
  wallMargin?: number;
  /** Wall force strength. Default 0.3. */
  wallStrength?: number;
  /** Minimum spring length (px) for highly similar content. Default 30. */
  minSpringLength?: number;
  /** Maximum spring length (px) for unrelated content. Default 200. */
  maxSpringLength?: number;
  /** Maximum simulation iterations per tick. Default 300. S-05 bound. */
  maxIterations?: number;
  /** Velocity decay (0–1). Default 0.4. Higher = more friction. */
  velocityDecay?: number;
  /** Initial velocity for newly added cells. Default 0.1. */
  entryVelocity?: number;
}

/** Computed cell position for rendering */
export interface CellPosition {
  cell: ForceCell;
  x: number;
  y: number;
  radius: number;
}

// ── Semantic distance → spring length ──────────────────────────────────────

/** Convert cosine similarity to spring length.
 *  similarity 1.0 → minSpringLength, similarity 0.0 → maxSpringLength */
export function semanticSpringLength(
  similarity: number,
  minLength: number,
  maxLength: number
): number {
  const clamped = Math.max(0, Math.min(1, similarity));
  return maxLength - clamped * (maxLength - minLength);
}

/** Compute cosine similarity between two embedding vectors.
 *  Returns 0 if either vector is null or empty. */
export function cosineSimilarity(a: number[] | null, b: number[] | null): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/** Weight permille → rendered radius in px */
export function weightToRadius(permille: number, baseRadius = 8): number {
  // weight 500 → baseRadius, scales sqrt for area proportionality
  const normalized = Math.max(100, Math.min(1000, permille)) / 500;
  return baseRadius * Math.sqrt(normalized);
}
