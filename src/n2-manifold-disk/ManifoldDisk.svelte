<script lang="ts">
  // N2 ManifoldDisk — Poincaré disk projection wrapping n1-flow-canvas
  // κ = 1.0 fixed (standard Poincaré disk — no prop, YAGNI)
  // Shares GraphState with FlowCanvas for instantaneous mode toggle
  //
  // When `agents` is provided, the disk renders live S³ agent orientations
  // (quaternion → Poincaré disk via axis-angle) as glowing points with
  // trailing history. Task topology is drawn behind the agents.

  import { untrack } from 'svelte';
  import { Canvas, Layer } from 'svelte-canvas';
  import { getArrow } from 'perfect-arrows';
  import type { GraphSnapshot } from '../n1-flow-canvas/types.js';
  import { GraphState } from '../n1-flow-canvas/graph-state.svelte.js';
  import { EDGE_REVEAL_STAGGER_MS } from '../n1-flow-canvas/types.js';
  import { projectToDisk, quaternionToDisk } from './poincare.js';

  // ── Props ────────────────────────────────────────────────────────────────────

  /** Raw inhabitant wire type — mirrors InhabitantView from ryu/src/stores/manifoldStore. */
  interface InhabitantView {
    id: string;
    orientation: [number, number, number, number]; // [w, i, j, k]
    allay: number;
  }

  interface Props {
    snapshot: GraphSnapshot;
    state: GraphState;            // must be the same instance passed to FlowCanvas
    width?: number;
    height?: number;
    selectedId?: string | null;  // Visual highlight — does NOT trigger Möbius transform
    /** Raw S³ inhabitant orientations from the manifold store. Projected here at render time. */
    inhabitants?: InhabitantView[];
  }

  // Destructure as `graphStateProp` to avoid conflict with the `$state` rune.
  let { snapshot, state: graphStateProp, width = 800, height = 600, selectedId = null, inhabitants = [] }: Props = $props();

  // ── Agent trail history ───────────────────────────────────────────────────────
  // Ring buffer of recent disk-projected positions per agent (last TRAIL_LEN frames).
  // Projection happens here — disk radius is known at render time.
  const TRAIL_LEN = 12;

  // Map<agentId, Array<{u, v}>> — normalized disk coords (×diskRadius at render).
  let agentTrails = $state<Map<string, Array<{ u: number; v: number }>>>(new Map());

  $effect(() => {
    // Track `inhabitants` as the sole reactive dependency.
    // `agentTrails` is read via untrack so writing it back does NOT re-trigger
    // this effect — avoids the read→write→re-run infinite loop.
    const snap = inhabitants;
    agentTrails = untrack(() => {
      const next = new Map(agentTrails);
      for (const inh of snap) {
        const [w, i, j, k] = inh.orientation;
        const { u, v } = quaternionToDisk(w, i, j, k, 1.0);
        const trail = next.get(inh.id) ?? [];
        trail.push({ u, v });
        if (trail.length > TRAIL_LEN) trail.shift();
        next.set(inh.id, trail);
      }
      for (const id of next.keys()) {
        if (!snap.find(a => a.id === id)) next.delete(id);
      }
      return next;
    });
  });

  // Disk radius = half the smallest dimension, leaving some padding
  const diskRadius = $derived(Math.min(width, height) / 2 - 24);
  const diskCx     = $derived(width  / 2);
  const diskCy     = $derived(height / 2);

  // Project positions into Poincaré disk space
  const projected = $derived(
    projectToDisk(graphStateProp.positions, graphStateProp.focusCenterId, diskRadius)
  );

  // ── Edge reveal offsets (re-used from GraphState bfsOrder) ──────────────────

  let edgeOffsets = $state<Map<string, number>>(new Map());

  $effect(() => {
    const bfsOrder = graphStateProp.bfsOrder;
    const next = new Map<string, number>();
    for (const e of snapshot.edges) next.set(e.id, 0.0);
    edgeOffsets = next;

    const nodeIndex = new Map<string, number>();
    bfsOrder.forEach((id, i) => nodeIndex.set(id, i));

    for (const edge of snapshot.edges) {
      const idx = nodeIndex.get(edge.sourceId) ?? 0;
      setTimeout(() => {
        edgeOffsets = new Map(edgeOffsets).set(edge.id, 1.0);
      }, idx * EDGE_REVEAL_STAGGER_MS);
    }
  });

  // ── Design tokens ──────────────────────────────────────────────────────────

  const COLORS = {
    bg:         '#1a1a1a',
    diskBg:     '#111111',
    diskBorder: '#3a3020',
    node:       '#2a2a2a',
    nodeBorder: '#b87333',
    nodeText:   '#e8e0d0',
    edgeLine:   '#b87333',
    edgeFade:   '#5a4a30',
    focus:      '#d4943a',
    grid:       '#1e1e1e',
    selected:   '#d4943a',
  };

  // Column-based node fill colors — matches KOS brass/copper theme.
  // Semi-transparent fills let the dark disk background show through.
  const COLUMN_FILL: Record<string, string> = {
    GO:      'rgba(184, 115, 51, 0.35)',   // brass — active
    CONSULT: 'rgba(184, 115, 51, 0.18)',   // brass outline — advisory
    WEED:    'rgba(200, 160, 50, 0.22)',   // warning amber
    SPROUT:  'rgba(70,  130, 200, 0.20)', // info blue — growing
    FREEZE:  'rgba(80,  110, 180, 0.16)', // cool blue — frozen
    SEED:    'rgba(42,   42,  42, 0.60)', // muted — backlog
  };

  const COLUMN_BORDER: Record<string, string> = {
    GO:      '#b87333',
    CONSULT: 'rgba(184, 115, 51, 0.6)',
    WEED:    '#c8a032',
    SPROUT:  '#4682c8',
    FREEZE:  '#506eb4',
    SEED:    '#3a3a3a',
  };

  const NODE_RADIUS = 4;
  const FONT = '11px var(--font-mono, monospace)';

  // ── Render ──────────────────────────────────────────────────────────────────

  function render({ context }: { context: CanvasRenderingContext2D }) {
    const r = diskRadius;
    const cx = diskCx, cy = diskCy;

    context.clearRect(0, 0, width, height);

    // Background
    context.fillStyle = COLORS.bg;
    context.fillRect(0, 0, width, height);

    // Disk background + clip
    context.save();
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.fillStyle = COLORS.diskBg;
    context.fill();
    context.strokeStyle = COLORS.diskBorder;
    context.lineWidth = 1;
    context.stroke();
    context.clip();

    // Subtle geodesic grid lines (3 concentric circles)
    context.strokeStyle = COLORS.grid;
    context.lineWidth = 0.5;
    for (const fraction of [0.33, 0.66, 0.88]) {
      context.beginPath();
      context.arc(cx, cy, r * fraction, 0, Math.PI * 2);
      context.stroke();
    }

    // Offset all positions to disk center
    function toCanvas(x: number, y: number): [number, number] {
      return [x - diskRadius + cx, y - diskRadius + cy];
    }

    // ── Edges ──
    context.font = FONT;
    for (const edge of snapshot.edges) {
      const src = projected.get(edge.sourceId);
      const tgt = projected.get(edge.targetId);
      if (!src || !tgt) continue;

      const progress = edgeOffsets.get(edge.id) ?? 0;
      if (progress <= 0) continue;

      const [sx, sy] = toCanvas(src.x + src.width  / 2, src.y + src.height / 2);
      const [tx, ty] = toCanvas(tgt.x + tgt.width  / 2, tgt.y + tgt.height / 2);

      const [ax, ay, pcx, pcy, ex, ey, ae] = getArrow(sx, sy, tx, ty, {
        bow: 0.15,
        stretch: 0.3,
        padStart: src.width / 2 + 4,
        padEnd:   tgt.width / 2 + 4,
      });

      const dx = ex - ax, dy = ey - ay;
      const approxLen = Math.sqrt(dx * dx + dy * dy) * 1.2;
      const dash = approxLen * progress;

      context.save();
      context.strokeStyle = progress >= 1.0 ? COLORS.edgeLine : COLORS.edgeFade;
      context.lineWidth   = 1.5;
      context.setLineDash([dash, approxLen]);
      context.beginPath();
      context.moveTo(ax, ay);
      context.quadraticCurveTo(pcx, pcy, ex, ey);
      context.stroke();
      context.restore();

      if (progress >= 1.0) {
        context.save();
        context.fillStyle = COLORS.edgeLine;
        context.translate(ex, ey);
        context.rotate(ae);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(-7, -3);
        context.lineTo(-7,  3);
        context.closePath();
        context.fill();
        context.restore();
      }
    }

    // ── Nodes ──
    for (const node of snapshot.nodes) {
      const pos = projected.get(node.id);
      if (!pos) continue;

      const column = (node.data?.column as string | undefined) ?? '';
      const isSelected = node.id === selectedId;
      const [px, py] = toCanvas(pos.x, pos.y);
      const { width: w, height: h } = pos;

      context.fillStyle   = isSelected ? COLORS.selected : (COLUMN_FILL[column] ?? COLORS.node);
      context.strokeStyle = isSelected ? COLORS.selected : (COLUMN_BORDER[column] ?? COLORS.nodeBorder);
      context.lineWidth   = isSelected ? 2 : 1;

      context.beginPath();
      context.roundRect(px, py, w, h, NODE_RADIUS);
      context.fill();
      context.stroke();

      context.fillStyle    = COLORS.nodeText;
      context.font         = FONT;
      context.textAlign    = 'center';
      context.textBaseline = 'middle';
      const label = node.label.length > 16 ? node.label.slice(0, 14) + '…' : node.label;
      context.fillText(label, px + w / 2, py + h / 2, w - 12);
    }

    // ── Inhabitants (S³ orientations) ────────────────────────────────────────
    // Project each inhabitant quaternion to disk coords here (diskRadius known).
    // Trails are in unit-disk space; scale by r to get pixel coords.
    if (inhabitants.length > 0) {
      for (const inh of inhabitants) {
        const [w, i, j, k] = inh.orientation;
        const agent = quaternionToDisk(w, i, j, k, 1.0); // unit coords; scaled by r below
        const trail = agentTrails.get(inh.id) ?? [];

        // Draw fading trail
        if (trail.length > 1) {
          for (let t = 0; t < trail.length - 1; t++) {
            const alpha = (t / (trail.length - 1)) * 0.5;
            const pt = trail[t];
            const pn = trail[t + 1];
            context.save();
            context.strokeStyle = `rgba(212, 148, 58, ${alpha})`; // brass fade
            context.lineWidth = 1.5;
            context.beginPath();
            context.moveTo(cx + pt.u * r, cy + pt.v * r);
            context.lineTo(cx + pn.u * r, cy + pn.v * r);
            context.stroke();
            context.restore();
          }
        }

        // Draw glowing agent dot
        const ax = cx + agent.u * r;
        const ay = cy + agent.v * r;
        const dotR = 5;

        // Outer glow
        const glow = context.createRadialGradient(ax, ay, 0, ax, ay, dotR * 3);
        glow.addColorStop(0, 'rgba(212, 148, 58, 0.6)');
        glow.addColorStop(1, 'rgba(212, 148, 58, 0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(ax, ay, dotR * 3, 0, Math.PI * 2);
        context.fill();

        // Core dot
        context.fillStyle = '#d4943a';
        context.beginPath();
        context.arc(ax, ay, dotR, 0, Math.PI * 2);
        context.fill();

        // Short ID label
        context.fillStyle = 'rgba(232, 224, 208, 0.85)';
        context.font = '9px var(--font-mono, monospace)';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillText(inh.id.slice(0, 6), ax, ay + dotR + 3);
      }
    }

    context.restore(); // end clip
  }
</script>

<Canvas {width} {height}>
  <Layer {render} />
</Canvas>
