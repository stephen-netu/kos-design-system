<script lang="ts">
  // ForceCanvas — d3-force simulation for a single zone
  // wt-901: Per-zone semantic gravity, wall forces, cell entry velocity
  //
  // Wraps d3-force (not force-graph library) for direct control over forces.
  // Each zone gets an independent simulation. Cells cluster by semantic similarity.
  //
  // S-02: No Math.random — d3-force uses internal PRNG seeded by node index.
  //       Integer permille for weights.
  // S-05: Simulation bounded by maxIterations (default 300). alpha decay ensures halt.

  import { onMount, onDestroy } from 'svelte';
  import type { ForceCell, ForceLink, ForceCanvasConfig, CellPosition } from './force-canvas-types.js';
  import {
    cosineSimilarity,
    semanticSpringLength,
    weightToRadius,
  } from './force-canvas-types.js';

  // ── Props ────────────────────────────────────────────────────────────────

  interface Props {
    /** Cells to position in this zone */
    cells: ForceCell[];
    /** Zone width in px */
    width: number;
    /** Zone height in px */
    height: number;
    /** Configuration overrides */
    config?: ForceCanvasConfig;
    /** Whether simulation is active. Default true. Set false for Scelle zones. */
    active?: boolean;
    /** Callback with updated cell positions on each tick */
    onPositionsUpdate?: (positions: CellPosition[]) => void;
    /** Callback when a cell is clicked */
    onCellClick?: (cell: ForceCell) => void;
    /** Monotonic tick counter (passed from parent for deterministic pulse). */
    tick?: number;
  }

  let {
    cells,
    width,
    height,
    config,
    active = true,
    onPositionsUpdate,
    onCellClick,
    tick = 0,
  }: Props = $props();

  // ── Config defaults ──────────────────────────────────────────────────────

  const chargeStrength = $derived(config?.chargeStrength ?? -80);
  const collisionPadding = $derived(config?.collisionPadding ?? 4);
  const wallMargin = $derived(config?.wallMargin ?? 20);
  const wallStrength = $derived(config?.wallStrength ?? 0.3);
  const minSpringLength = $derived(config?.minSpringLength ?? 30);
  const maxSpringLength = $derived(config?.maxSpringLength ?? 200);
  const maxIterations = $derived(config?.maxIterations ?? 300);
  const velocityDecay = $derived(config?.velocityDecay ?? 0.4);
  const entryVelocity = $derived(config?.entryVelocity ?? 0.1);

  // ── Simulation state ─────────────────────────────────────────────────────

  let simulation: any = null; // d3-force simulation
  let positions: CellPosition[] = $state([]);

  // ── Build semantic links from embeddings ─────────────────────────────────

  function buildSemanticLinks(cells: ForceCell[]): ForceLink[] {
    const links: ForceLink[] = [];
    const SIMILARITY_THRESHOLD = 0.3;

    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const sim = cosineSimilarity(cells[i].embedding, cells[j].embedding);
        if (sim > SIMILARITY_THRESHOLD) {
          links.push({
            source: cells[i].id,
            target: cells[j].id,
            distance: 1 - sim,
          });
        }
      }
    }
    return links;
  }

  // ── Wall force (custom d3 force) ─────────────────────────────────────────

  function createWallForce(w: number, h: number, margin: number, strength: number) {
    let nodes: ForceCell[] = [];

    function force(alpha: number) {
      for (const node of nodes) {
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        const r = weightToRadius(node.weight);

        // Left wall
        if (x - r < margin) {
          node.vx = (node.vx ?? 0) + (margin - x + r) * strength * alpha;
        }
        // Right wall
        if (x + r > w - margin) {
          node.vx = (node.vx ?? 0) - (x + r - w + margin) * strength * alpha;
        }
        // Top wall
        if (y - r < margin) {
          node.vy = (node.vy ?? 0) + (margin - y + r) * strength * alpha;
        }
        // Bottom wall
        if (y + r > h - margin) {
          node.vy = (node.vy ?? 0) - (y + r - h + margin) * strength * alpha;
        }
      }
    }

    force.initialize = (n: ForceCell[]) => { nodes = n; };
    return force;
  }

  // ── Initialize / update simulation ───────────────────────────────────────

  async function initSimulation() {
    if (!active || cells.length === 0) {
      positions = [];
      onPositionsUpdate?.([]);
      return;
    }

    const d3 = await import('d3-force');

    const links = buildSemanticLinks(cells);

    // Place new cells near center with slight offset
    const cx = width / 2;
    const cy = height / 2;
    for (const cell of cells) {
      if (cell.x === undefined) {
        cell.x = cx + (cell.index ?? 0) * 3;
        cell.y = cy + (cell.index ?? 0) * 2;
        // Entry velocity: nudge away from center
        if (entryVelocity > 0) {
          const angle = ((cell.index ?? 0) / Math.max(1, cells.length)) * Math.PI * 2;
          cell.vx = Math.cos(angle) * entryVelocity * 100;
          cell.vy = Math.sin(angle) * entryVelocity * 100;
        }
      }
    }

    simulation?.stop();

    simulation = d3
      .forceSimulation(cells as any)
      .alphaDecay(0.02)
      .velocityDecay(velocityDecay)
      .force(
        'charge',
        d3.forceManyBody().strength(chargeStrength)
      )
      .force(
        'collision',
        d3.forceCollide<ForceCell>()
          .radius((d) => weightToRadius(d.weight) + collisionPadding)
      )
      .force(
        'link',
        d3
          .forceLink(links as any)
          .id((d: any) => d.id)
          .distance((link: any) =>
            semanticSpringLength(1 - link.distance, minSpringLength, maxSpringLength)
          )
          .strength(0.5)
      )
      .force('center', d3.forceCenter(cx, cy).strength(0.03))
      .force('wall', createWallForce(width, height, wallMargin, wallStrength))
      .on('tick', () => {
        positions = cells.map((cell) => ({
          cell,
          x: cell.x ?? 0,
          y: cell.y ?? 0,
          radius: weightToRadius(cell.weight),
        }));
        onPositionsUpdate?.(positions);
      });

    // S-05: bound total iterations
    simulation.stop();
    for (let i = 0; i < maxIterations && simulation.alpha() > simulation.alphaMin(); i++) {
      simulation.tick();
    }

    // After initial settle, switch to live ticking
    simulation.restart();
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  onMount(() => {
    initSimulation();
  });

  onDestroy(() => {
    simulation?.stop();
    simulation = null;
  });

  // ── React to cell changes ────────────────────────────────────────────────

  let prevCellIds = '';
  $effect(() => {
    const ids = cells.map((c) => c.id).sort().join(',');
    if (ids !== prevCellIds) {
      prevCellIds = ids;
      initSimulation();
    }
  });

  // React to zone resize
  $effect(() => {
    if (simulation && (width || height)) {
      simulation.force('center')?.x(width / 2).y(height / 2);
      simulation.force('wall', createWallForce(width, height, wallMargin, wallStrength));
      simulation.alpha(0.3).restart();
    }
  });

  // ── Pin/unpin API ────────────────────────────────────────────────────────

  export function pinCell(cellId: string, x: number, y: number) {
    const cell = cells.find((c) => c.id === cellId);
    if (cell) {
      cell.fx = x;
      cell.fy = y;
      simulation?.alpha(0.1).restart();
    }
  }

  export function unpinCell(cellId: string) {
    const cell = cells.find((c) => c.id === cellId);
    if (cell) {
      cell.fx = null;
      cell.fy = null;
      simulation?.alpha(0.3).restart();
    }
  }

  export function reheat(alpha = 0.5) {
    simulation?.alpha(alpha).restart();
  }
</script>

<!-- ForceCanvas is headless — it computes positions, doesn't render DOM.
     The parent reads positions via onPositionsUpdate and renders cells at those coords.
     This is a div solely for lifecycle binding. -->
<div class="force-canvas" style:display="contents">
  {#each positions as pos (pos.cell.id)}
    <slot name="cell" {pos}>
      <!-- Default: colored circle at computed position -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="force-cell-default"
        style:left="{pos.x - pos.radius}px"
        style:top="{pos.y - pos.radius}px"
        style:width="{pos.radius * 2}px"
        style:height="{pos.radius * 2}px"
        onclick={() => onCellClick?.(pos.cell)}
      ></div>
    </slot>
  {/each}
</div>

<style>
  .force-cell-default {
    position: absolute;
    border-radius: 50%;
    background: var(--color-accent, #b87333);
    opacity: 0.7;
    cursor: pointer;
    transition: opacity 0.1s;
  }

  .force-cell-default:hover {
    opacity: 1;
  }
</style>
