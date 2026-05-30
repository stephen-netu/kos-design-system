<script lang="ts">
  // N1 FlowCanvas — Canvas 2D graph with ELK layout + BFS edge reveal
  // S-02: BFS order drives edge reveal stagger (no Math.random)
  // S-05: worker terminated on component destroy

  import { onMount, onDestroy } from 'svelte';
  import { Canvas, Layer } from 'svelte-canvas';
  import { getArrow } from 'perfect-arrows';
  import type { GraphSnapshot, GraphStateApi } from './types.js';
  import { GraphState } from './graph-state.svelte.js';
  import { runLayout } from './layout.js';
  import { EDGE_REVEAL_STAGGER_MS } from './types.js';
   import { getCanvasTheme } from '../p0-primitives/canvas-theme';

  // ── Props ────────────────────────────────────────────────────────────────────

  interface Props {
    snapshot: GraphSnapshot;
    state?: GraphStateApi;
    width?: number;
    height?: number;
  }

  // Destructure as `graphStateProp` to avoid conflict with the `$state` rune.
  let { snapshot, state: graphStateProp, width = 800, height = 600 }: Props = $props();

  // ── Internal state ──────────────────────────────────────────────────────────

  // svelte-ignore state_referenced_locally
  const _state = graphStateProp instanceof GraphState ? graphStateProp : new GraphState();
  let mounted = false;
  /** Edge reveal offsets: edge id → 0.0 (hidden) .. 1.0 (fully drawn) */
  let edgeOffsets = $state<Map<string, number>>(new Map());

  // ── Layout (runs on main thread — ELK is async, won't block UI) ─────────────
  // The previous Worker approach failed in Tauri: ELK's bundled JS tries to
  // spawn a sub-Worker inside the layout Worker, which Tauri's WKWebView
  // doesn't support (nested Workers unavailable, Worker = undefined in scope).

  function requestLayout() {
    if (!mounted) return;
    runLayout(snapshot, width, height).then(result => {
      _state.applyLayout(result);
      scheduleEdgeReveal(result.bfsOrder);
    }).catch(() => {
      // Layout failed — leave existing positions in place
    });
  }

  onMount(() => {
    mounted = true;
    requestLayout();
  });

  onDestroy(() => {
    mounted = false;
    if (_state instanceof GraphState) _state.destroy();
  });

  // Re-layout when snapshot changes
  $effect(() => {
    void snapshot;
    requestLayout();
  });

  // ── Edge reveal animation (BFS stagger) ────────────────────────────────────

  function scheduleEdgeReveal(bfsOrder: ReadonlyArray<string>) {
    // Reset all edges to hidden
    const next = new Map<string, number>();
    for (const e of snapshot.edges) next.set(e.id, 0.0);
    edgeOffsets = next;

    // BFS order: each node index N → reveal its outgoing edges after N * STAGGER_MS
    const nodeIndex = new Map<string, number>();
    bfsOrder.forEach((id, i) => nodeIndex.set(id, i));

    for (const edge of snapshot.edges) {
      const idx = nodeIndex.get(edge.sourceId) ?? 0;
      setTimeout(() => {
        edgeOffsets = new Map(edgeOffsets).set(edge.id, 1.0);
      }, idx * EDGE_REVEAL_STAGGER_MS);
    }
  }

  // ── Design tokens (runtime theme-aware) ──────────────────────────────────

  const COLORS = getCanvasTheme();

  const NODE_RADIUS = 4;
  const FONT = '12px var(--font-mono, monospace)';

  // ── Render ──────────────────────────────────────────────────────────────────

  function render({ context }: { context: CanvasRenderingContext2D }) {
    const positions = _state.positions;
    const focusId   = (_state as GraphState).focusCenterId;

    context.clearRect(0, 0, width, height);

    // Background
    context.fillStyle = COLORS.bg;
    context.fillRect(0, 0, width, height);

    // ── Edges ──
    context.font = FONT;
    for (const edge of snapshot.edges) {
      const src = positions.get(edge.sourceId);
      const tgt = positions.get(edge.targetId);
      if (!src || !tgt) continue;

      const progress = edgeOffsets.get(edge.id) ?? 0;
      if (progress <= 0) continue;

      const sx = src.x + src.width  / 2;
      const sy = src.y + src.height / 2;
      const tx = tgt.x + tgt.width  / 2;
      const ty = tgt.y + tgt.height / 2;

      const [ax, ay, cx, cy, ex, ey, ae] = getArrow(sx, sy, tx, ty, {
        bow: 0.2,
        stretch: 0.4,
        padStart: src.width / 2 + 4,
        padEnd:   tgt.width / 2 + 4,
      });

      // BFS reveal via lineDashOffset
      const path = new Path2D();
      path.moveTo(ax, ay);
      path.quadraticCurveTo(cx, cy, ex, ey);

      // Estimate path length for dash sizing (approximation)
      const dx = ex - ax, dy2 = ey - ay;
      const approxLen = Math.sqrt(dx * dx + dy2 * dy2) * 1.2;
      const dash = approxLen * progress;

      context.save();
      context.strokeStyle = progress >= 1.0 ? COLORS.edgeLine : COLORS.edgeFade;
      context.lineWidth   = 1.5;
      context.setLineDash([dash, approxLen]);
      context.lineDashOffset = 0;
      context.stroke(path);
      context.restore();

      // Arrowhead
      if (progress >= 1.0) {
        context.save();
        context.fillStyle = COLORS.edgeLine;
        context.translate(ex, ey);
        context.rotate(ae);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(-8, -4);
        context.lineTo(-8,  4);
        context.closePath();
        context.fill();
        context.restore();
      }
    }

    // ── Nodes ──
    for (const node of snapshot.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const isFocus  = node.id === focusId;
      const { x, y, width: w, height: h } = pos;

      // Node body
      context.fillStyle   = isFocus ? COLORS.focus : COLORS.node;
      context.strokeStyle = COLORS.nodeBorder;
      context.lineWidth   = isFocus ? 2 : 1;

      context.beginPath();
      context.roundRect(x, y, w, h, NODE_RADIUS);
      context.fill();
      context.stroke();

      // Label
      context.fillStyle  = COLORS.nodeText;
      context.font       = FONT;
      context.textAlign  = 'center';
      context.textBaseline = 'middle';
      // Truncate if needed
      const maxWidth = w - 16;
      const label = node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label;
      context.fillText(label, x + w / 2, y + h / 2, maxWidth);
    }
  }
</script>

<Canvas {width} {height}>
  <Layer {render} />
</Canvas>
