<script lang="ts">
  // N4 AdaptiveManifold — Unified canvas component driven by LayoutOrchestrator
  // Renders nodes/edges with animated transitions between topologies.
  // C-1 fix: resolves --n4-* tokens via getComputedStyle at mount.

  import { onMount, onDestroy, untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { Canvas, Layer } from 'svelte-canvas';
  import type {
    ManifoldSnapshot,
    ManifoldNode,
    LayoutAlgorithm,
    ClassificationResult,
    LayoutPreferences,
    LayoutSuggestion,
    NodeStyleRegistry,
    NodeStatus,
    ResolvedThemeColors,
    NodeIndicatorState,
    PhaseTheme,
  } from './types.js';
  import { DEFAULT_LAYOUT_PREFERENCES } from './types.js';
  import { resolvePhaseTheme, DEFAULT_PHASE_THEME } from './phase-theme.js';
  import type { NodeLayout } from '../n1-flow-canvas/types.js';
  import { LayoutOrchestrator } from './orchestrator.js';
  import { ManifoldProvider } from './providers/manifold-provider.js';
  import { GravitationalProvider } from './providers/gravitational-provider.js';
  import { EDGE_REVEAL_STAGGER_MS } from '../n1-flow-canvas/types.js';
  import DetailCard from './DetailCard.svelte';

  // ── Props ──────────────────────────────────────────────────────────────────

  interface Props {
    snapshot: ManifoldSnapshot;
    width?: number;
    height?: number;
    selectedId?: string | null;
    preferences?: LayoutPreferences;
    styleRegistry?: NodeStyleRegistry;
    onalgorithmchange?: (algorithm: LayoutAlgorithm) => void;
    onclassification?: (result: ClassificationResult) => void;
    onsuggestion?: (suggestion: LayoutSuggestion | null) => void;
    onselectnode?: (nodeId: string | null) => void;
    indicatorStates?: Map<string, NodeIndicatorState>;
    flowPhase?: string;
  }

  let {
    snapshot,
    width = 800,
    height = 600,
    selectedId = null,
    preferences = DEFAULT_LAYOUT_PREFERENCES,
    styleRegistry = {},
    onalgorithmchange,
    onclassification,
    onsuggestion,
    onselectnode,
    indicatorStates = new Map(),
    flowPhase = 'seed',
  }: Props = $props();

  // ── Orchestrator ───────────────────────────────────────────────────────────

  const orchestrator = new LayoutOrchestrator(
    [new ManifoldProvider(), new GravitationalProvider()],
    DEFAULT_LAYOUT_PREFERENCES,
  );

  // Reactive orchestrator state
  let activeAlgorithm: LayoutAlgorithm = $state('manifold');
  let positions: Map<string, NodeLayout> = $state(new Map());
  let bfsOrder: ReadonlyArray<string> = $state([]);
  let transitioning: boolean = $state(false);
  let lastClassification: ClassificationResult | null = $state(null);
  let suggestion: LayoutSuggestion | null = $state(null);
  let mounted = false;

  // Edge reveal offsets
  let edgeOffsets = $state<Map<string, number>>(new Map());

  // Phase theme — resolved from CSS tokens on mount
  let phaseTheme: PhaseTheme = $state(DEFAULT_PHASE_THEME);

  // Ambient animation loop — tick drives svelte-canvas re-render each frame
  let animationFrameId: number | null = null;
  let animTick = $state(0);

  // ── Theme color resolution (C-1 fix) ──────────────────────────────────────

  let containerEl: HTMLDivElement | undefined = $state(undefined);
  let colors: ResolvedThemeColors = $state({
    canvasBg: '#1a1a1a',
    nodeActive: '#b87333',
    nodeIdle: '#a09880',
    nodeBlocked: '#f39c12',
    nodeCompleted: '#a09880',
    nodeCritical: '#c0392b',
    nodeBg: '#222',
    nodeBorder: 'rgba(184, 115, 51, 0.15)',
    nodeText: '#e8e0d0',
    edgeColor: 'rgba(184, 115, 51, 0.25)',
    edgeActive: '#b87333',
    pulseColor: '#b87333',
    pulseCritical: '#c0392b',
  });

  function resolveTokens(): void {
    if (!containerEl) return;
    kindAccentCache.clear();
    const cs = getComputedStyle(containerEl);
    const get = (prop: string, fallback: string) => cs.getPropertyValue(prop).trim() || fallback;
    colors = {
      canvasBg: get('--n4-canvas-bg', '#1a1a1a'),
      nodeActive: get('--n4-node-border-selected', '#b87333'),
      nodeIdle: get('--n4-node-text-muted', '#a09880'),
      nodeBlocked: get('--color-status-warning', '#f39c12'),
      nodeCompleted: get('--n4-node-text-muted', '#a09880'),
      nodeCritical: get('--color-status-error', '#c0392b'),
      nodeBg: get('--n4-node-bg', '#222'),
      nodeBorder: get('--n4-node-border', 'rgba(184, 115, 51, 0.15)'),
      nodeText: get('--n4-node-text', '#e8e0d0'),
      edgeColor: get('--n4-edge-color', 'rgba(184, 115, 51, 0.25)'),
      edgeActive: get('--n4-edge-color-active', '#b87333'),
      pulseColor: get('--color-accent', '#b87333'),
      pulseCritical: get('--color-status-error', '#c0392b'),
    };
    phaseTheme = resolvePhaseTheme(containerEl);
  }

  // ── Status → color mapping ────────────────────────────────────────────────

  // Alpha compositing helper — handles hex, rgb(), hsl() color formats.
  // Hex suffix appending breaks when CSS tokens return rgb/hsl values.
  function withAlpha(color: string, alpha: number): string {
    const hex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) return color + hex;
    if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    if (color.startsWith('hsl(')) return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
    return color;
  }

  // Schematic fills — opaque canvas background so traces don't bleed through node bodies.
  // Looks visually transparent (matches canvas bg) but blocks geometry behind it.
  function statusToFill(status: NodeStatus, phaseBg: string): string {
    void status;
    return phaseBg;
  }

  // Stroke color by status — thinner and dimmer for idle/completed.
  function statusToBorder(status: NodeStatus): string {
    switch (status) {
      case 'active':    return withAlpha(colors.nodeActive, 0.85);
      case 'idle':      return withAlpha(colors.nodeActive, 0.22);
      case 'blocked':   return withAlpha(colors.nodeBlocked, 0.7);
      case 'completed': return withAlpha(colors.nodeActive, 0.08);
      case 'critical':  return withAlpha(colors.nodeCritical, 0.8);
    }
  }

  // Stroke width: agents always prominent, tasks scaled by activity.
  function strokeWidthFor(kind: string, status: NodeStatus, isSelected: boolean): number {
    if (isSelected) return 1.5;
    if (kind === 'agent') return 1.5;
    if (status === 'active') return 1;
    if (status === 'completed') return 0.5;
    return 0.75;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  const unsubscribe = orchestrator.subscribe((state) => {
    activeAlgorithm = state.activeAlgorithm;
    positions = state.positions;
    bfsOrder = state.bfsOrder;
    transitioning = state.transitioning;
    lastClassification = state.lastClassification;
    suggestion = state.suggestion;

    if (state.lastClassification) onclassification?.(state.lastClassification);
    onalgorithmchange?.(state.activeAlgorithm);
    onsuggestion?.(state.suggestion);
  });

  onMount(() => {
    mounted = true;
    resolveTokens();
    orchestrator.requestLayout(snapshot, width, height);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startAmbientLoop();
    }
  });

  onDestroy(() => {
    mounted = false;
    stopAmbientLoop();
    unsubscribe();
    orchestrator.destroy();
  });

  // Deterministic phase offset per agent — avoids metronomic sync across agents. S-02 compliant.
  function agentPulseOffset(agentId: string): number {
    let h = 0;
    for (let i = 0; i < agentId.length; i++) {
      h = (Math.imul(31, h) + agentId.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % 2000;
  }

  function startAmbientLoop() {
    function tick() {
      // Drive re-renders when nodes exist (ambient drift) or a layout transition is running.
      // Zero-node canvases and fully idle post-transition states skip the increment.
      if (snapshot.nodes.length > 0 || transitioning) animTick++;
      animationFrameId = requestAnimationFrame(tick);
    }
    animationFrameId = requestAnimationFrame(tick);
  }

  function stopAmbientLoop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // Re-layout when snapshot or dimensions change (debounced by orchestrator)
  $effect(() => {
    void snapshot;
    void width;
    void height;
    if (mounted) {
      orchestrator.requestLayout(snapshot, width, height);
    }
  });

  // Update preferences on orchestrator when they change
  $effect(() => {
    orchestrator.setPreferences(preferences);
  });

  // Re-resolve tokens on theme changes (observe attribute mutations on root)
  $effect(() => {
    if (!containerEl) return;
    const observer = new MutationObserver(() => resolveTokens());
    const root = document.documentElement;
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  });

  // Schedule edge reveal after BFS order changes
  $effect(() => {
    void bfsOrder;
    if (bfsOrder.length > 0) scheduleEdgeReveal(bfsOrder);
  });

  // On first layout, fit all nodes into view so separation is visible
  let hasFitted = false;
  $effect(() => {
    if (!hasFitted && positions.size > 0 && width > 0 && height > 0) {
      hasFitted = true;
      // Use fit() to show all nodes with proper separation
      fit();
    }
  });

  // ── Exported action methods (accessible via bind:this) ────────────────────

  /** Accept the current layout suggestion — locks suggested algorithm. */
  export function acceptSuggestion() { orchestrator.acceptSuggestion(); }
  /** Dismiss the current layout suggestion — keep current algorithm. */
  export function dismissSuggestion() { orchestrator.dismissSuggestion(); }
  /** Pin the current layout (disable auto-classification). */
  export function pinLayout() { orchestrator.pinLayout(); }

  /** Zoom and pan to fit all current nodes into the viewport. */
  export function fit() {
    if (positions.size === 0) { zoom = 1; panX = 0; panY = 0; return; }
    // Larger padding for horizontal task cards (140×32px)
    const CARD_PAD_X = 100;
    const CARD_PAD_Y = 40;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of positions.values()) {
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      minX = Math.min(minX, cx - CARD_PAD_X);
      maxX = Math.max(maxX, cx + CARD_PAD_X);
      minY = Math.min(minY, cy - CARD_PAD_Y);
      maxY = Math.max(maxY, cy + CARD_PAD_Y);
    }
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const MARGIN = 60;
    const newZoom = Math.max(ZOOM_MIN, Math.min(1, Math.min(
      (width - MARGIN * 2) / contentW,
      (height - MARGIN * 2) / contentH,
    )));
    panX = width / 2 - (minX + contentW / 2) * newZoom;
    panY = height / 2 - (minY + contentH / 2) * newZoom;
    zoom = newZoom;
  }

  // ── Edge reveal ────────────────────────────────────────────────────────────

  function scheduleEdgeReveal(order: ReadonlyArray<string>) {
    // Preserve already-revealed edges — only animate newly added ones.
    // IMPORTANT: read edgeOffsets via untrack() so this function can be called
    // from a $effect without registering edgeOffsets as a dependency. Without
    // untrack, the setTimeout callbacks that write edgeOffsets re-trigger the
    // effect → infinite reactive loop → entire app becomes unresponsive.
    const current = untrack(() => edgeOffsets);
    const next = new Map<string, number>();
    for (const e of snapshot.edges) {
      next.set(e.id, current.get(e.id) ?? 0.0);
    }
    edgeOffsets = next;

    const nodeIndex = new Map<string, number>();
    order.forEach((id, i) => nodeIndex.set(id, i));

    for (const edge of snapshot.edges) {
      if ((current.get(edge.id) ?? 0) >= 1.0) continue; // already visible
      const idx = nodeIndex.get(edge.source) ?? 0;
      setTimeout(() => {
        edgeOffsets = new Map(untrack(() => edgeOffsets)).set(edge.id, 1.0);
      }, idx * EDGE_REVEAL_STAGGER_MS);
    }
  }

  // ── Zoom / pan state ──────────────────────────────────────────────────────

  let zoom: number = $state(1);
  let panX: number = $state(0);
  let panY: number = $state(0);
  let isDragging = $state(false);
  let dragLast = { x: 0, y: 0 };
  let dragMoved = false; // distinguish click from drag

  const ZOOM_MIN = 0.05;
  const ZOOM_MAX = 4;

  /** Convert a canvas-element pixel coordinate to world space. */
  function screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return { x: (sx - panX) / zoom, y: (sy - panY) / zoom };
  }

  /** Convert world coords to canvas-element pixel coords (for overlay positioning). */
  function worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return { x: wx * zoom + panX, y: wy * zoom + panY };
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const mx = (event.clientX - rect.left) * scaleX;
    const my = (event.clientY - rect.top) * scaleY;

    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * factor));

    // Zoom toward cursor: keep the world point under cursor fixed
    panX = mx - (mx - panX) * (newZoom / zoom);
    panY = my - (my - panY) * (newZoom / zoom);
    zoom = newZoom;
  }

  function handleMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    isDragging = true;
    dragMoved = false;
    dragLast = { x: event.clientX, y: event.clientY };
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) {
      // Hover detection when not dragging
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const sx = (event.clientX - rect.left) * scaleX;
      const sy = (event.clientY - rect.top) * scaleY;
      const prevHover = hoveredId;
      hoveredId = hitNode(event);
      if (hoveredId !== prevHover && hoveredId && !expandedId) {
        // Hover started on a new node
        onselectnode?.(hoveredId);
      }
    }
    if (!isDragging) return;
    const dx = event.clientX - dragLast.x;
    const dy = event.clientY - dragLast.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
    panX += dx;
    panY += dy;
    dragLast = { x: event.clientX, y: event.clientY };
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleMouseLeave() {
    isDragging = false;
    hoveredId = null; // clear hover on mouse leave
  }

  // ── Canvas hit test ────────────────────────────────────────────────────────

  function hitNode(event: MouseEvent): string | null {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const sx = (event.clientX - rect.left) * scaleX;
    const sy = (event.clientY - rect.top) * scaleY;
    const { x: wx, y: wy } = screenToWorld(sx, sy);

    // LOD-aware hit areas — match the visual size at current zoom level.
    const LOD_OVERVIEW = 0.3;
    const LOD_MID = 0.8;
    const lodTier = zoom < LOD_OVERVIEW ? 'overview' : zoom < LOD_MID ? 'mid' : 'close';

    for (const node of snapshot.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;
      const ncx = pos.x + pos.width / 2;
      const ncy = pos.y + pos.height / 2;

      let hitW: number, hitH: number;
      if (lodTier === 'overview') {
        // 8×8 pad + generous click buffer
        hitW = 20; hitH = 20;
      } else if (lodTier === 'mid') {
        // 44×18 chip + buffer
        hitW = 56; hitH = 28;
      } else {
        // Full flag extent. Tip anchors at node centroid; flag extends outward.
        const FLAG_TIP_HIT = 8;
        const FLAG_W_HIT = 110;
        const FLAG_H_HIT = 36;
        const TIP_BUFFER = 8;

        if (wy < ncy - FLAG_H_HIT / 2 || wy > ncy + FLAG_H_HIT / 2) continue;
        const flipLeft = (ncx * zoom + panX) > width * 0.55;
        if (flipLeft) {
          if (wx >= ncx - FLAG_TIP_HIT - FLAG_W_HIT && wx <= ncx + TIP_BUFFER) return node.id;
        } else {
          if (wx >= ncx - TIP_BUFFER && wx <= ncx + FLAG_TIP_HIT + FLAG_W_HIT) return node.id;
        }
        continue;
      }

      if (wx >= ncx - hitW / 2 && wx <= ncx + hitW / 2 &&
          wy >= ncy - hitH / 2 && wy <= ncy + hitH / 2) {
        return node.id;
      }
    }
    return null;
  }

  // ── Click-to-expand + hover-to-reveal detail cards ────────────────────────

  let expandedId: string | null = $state(null); // pinned card
  let hoveredId: string | null = $state(null); // hover card (unpinned)

  let activeCardId = $derived(expandedId ?? hoveredId);
  let activeCardNode = $derived(
    activeCardId ? snapshot.nodes.find((n) => n.id === activeCardId) ?? null : null,
  );
  let isCardPinned = $derived(expandedId !== null);

  // Card position: world coords → screen coords, clamped to container bounds.
  let cardPosition = $derived.by(() => {
    if (!activeCardId || !containerEl) return null;
    const pos = positions.get(activeCardId);
    if (!pos) return null;
    const W = containerEl.offsetWidth || width;
    const H = containerEl.offsetHeight || height;
    const cardWidth = 220;
    const gap = 12;
    const nodeRight = worldToScreen(pos.x + pos.width, pos.y);
    const nodeLeft  = worldToScreen(pos.x, pos.y);
    const rightSpace = W - nodeRight.x;
    const rawX = rightSpace > cardWidth + gap ? nodeRight.x + gap : nodeLeft.x - cardWidth - gap;
    const x = Math.max(8, Math.min(W - cardWidth - 8, rawX));
    const y = Math.max(8, Math.min(H - 300, nodeRight.y - 20));
    return { x, y, nodeCX: nodeRight.x - (nodeRight.x - nodeLeft.x) / 2, nodeCY: nodeRight.y };
  });

  function handleCanvasClick(event: MouseEvent) {
    if (dragMoved) return; // suppress click after pan
    const id = hitNode(event);
    onselectnode?.(id);
    if (id) {
      // Click pins/unpins the card
      expandedId = expandedId === id ? null : id;
    } else {
      expandedId = null;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const NODE_RADIUS = 4;

  // ── Per-kind accent color cache (resolved once from CSS vars) ─────────────

  let kindAccentCache: Map<string, string> = new Map();

  function resolveKindAccent(accentVar: string): string {
    const cached = kindAccentCache.get(accentVar);
    if (cached) return cached;
    if (!containerEl) return colors.nodeBorder;
    const cs = getComputedStyle(containerEl);
    const val = cs.getPropertyValue(accentVar).trim() || colors.nodeBorder;
    kindAccentCache.set(accentVar, val);
    return val;
  }

  // ── Shape drawing ─────────────────────────────────────────────────────────

  function beginShape(
    context: CanvasRenderingContext2D,
    shape: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    context.beginPath();
    switch (shape) {
      case 'rect':
        context.rect(x, y, w, h);
        break;
      case 'circle': {
        const r = Math.min(w, h) / 2;
        context.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
        break;
      }
      case 'diamond': {
        const cx = x + w / 2, cy = y + h / 2;
        context.moveTo(cx, y);
        context.lineTo(x + w, cy);
        context.lineTo(cx, y + h);
        context.lineTo(x, cy);
        context.closePath();
        break;
      }
      case 'hexagon': {
        const cx = x + w / 2, cy = y + h / 2;
        const rx = w / 2, ry = h / 2;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = cx + rx * Math.cos(angle);
          const py = cy + ry * Math.sin(angle);
          if (i === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        context.closePath();
        break;
      }
      case 'pill': {
        const r = h / 2;
        if (w <= h) {
          context.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
        } else {
          context.moveTo(x + r, y);
          context.lineTo(x + w - r, y);
          context.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
          context.lineTo(x + r, y + h);
          context.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
          context.closePath();
        }
        break;
      }
      default: // 'rounded-rect' and unknown
        context.roundRect(x, y, w, h, NODE_RADIUS);
        break;
    }
  }

  // ── Badge sizes — component body centered at node centroid ──────────────
  // Badge is the drawn type indicator; interlocks with the flag tip at its edge.
  // Indicator layer renders on top and does not affect hit testing.
  function symbolSize(kind: string): { w: number; h: number } {
    switch (kind) {
      case 'task':  return { w: 72, h: 48 }; 
      case 'agent': return { w: 14, h: 14 };
      case 'signal': return { w: 10, h: 10 };
      default: return { w: 12, h: 8 }; 
    }
  }

  function render({ context }: { context: CanvasRenderingContext2D }) {
    void animTick; // subscribe to animation frames — causes re-render on each RAF tick
    const now = performance.now();
    context.clearRect(0, 0, width, height);

    // ── Phase-driven background (no transform — always fills viewport) ─────
    const phase = flowPhase as keyof typeof phaseTheme;
    const phaseBg = phaseTheme[phase]?.background ?? colors.canvasBg;
    context.fillStyle = phaseBg;
    context.fillRect(0, 0, width, height);

    // ── Apply zoom/pan transform for all world-space drawing ──────────────
    context.save();
    context.translate(panX, panY);
    context.scale(zoom, zoom);

    // ── Engineering dot grid — PCB substrate texture ──────────────────────
    // Compute grid bounds in world space so we only draw visible dots
    const worldLeft   = -panX / zoom;
    const worldTop    = -panY / zoom;
    const worldRight  = (width  - panX) / zoom;
    const worldBottom = (height - panY) / zoom;
    const GRID = 22;
    const gridStartX = Math.floor(worldLeft  / GRID) * GRID;
    const gridStartY = Math.floor(worldTop   / GRID) * GRID;
    context.fillStyle = 'rgba(184, 115, 51, 0.055)';
    for (let gx = gridStartX; gx < worldRight; gx += GRID) {
      for (let gy = gridStartY; gy < worldBottom; gy += GRID) {
        context.beginPath();
        context.arc(gx, gy, 0.75, 0, Math.PI * 2);
        context.fill();
      }
    }

    // ── LOD tier selection ────────────────────────────────────────────────────
    const LOD_OVERVIEW = 0.3;
    const LOD_MID = 0.8;
    const lodTier = zoom < LOD_OVERVIEW ? 'overview' : zoom < LOD_MID ? 'mid' : 'close';

    // ── Edges: two-pass casing then line, straight only, no arrowheads ────
    // Hidden at overview zoom — pads/dots don't need trace clutter.
    if (lodTier !== 'overview') {
      // Pass 1 — casing: wide stroke in background color creates crossing effect
    for (const edge of snapshot.edges) {
      const src = positions.get(edge.source);
      const tgt = positions.get(edge.target);
      if (!src || !tgt) continue;
      if ((edgeOffsets.get(edge.id) ?? 0) <= 0) continue;

      const sx = src.x + src.width / 2;
      const sy = src.y + src.height / 2;
      const tx = tgt.x + tgt.width / 2;
      const ty = tgt.y + tgt.height / 2;

      context.save();
      context.strokeStyle = phaseBg;
      context.lineWidth = 4;
      context.setLineDash([]);
      context.beginPath();
      context.moveTo(sx, sy);
      context.lineTo(tx, sy); // horizontal first
      context.lineTo(tx, ty); // then vertical
      context.stroke();
      context.restore();
    }

    // Pass 2 — actual trace: reveal via dash offset, straight line
    for (const edge of snapshot.edges) {
      const src = positions.get(edge.source);
      const tgt = positions.get(edge.target);
      if (!src || !tgt) continue;

      const progress = edgeOffsets.get(edge.id) ?? 0;
      if (progress <= 0) continue;

      const sx = src.x + src.width / 2;
      const sy = src.y + src.height / 2;
      const tx = tgt.x + tgt.width / 2;
      const ty = tgt.y + tgt.height / 2;
      // Manhattan path: horizontal segment + vertical segment
      const segH = Math.abs(tx - sx);
      const segV = Math.abs(ty - sy);
      const lineLen = segH + segV;
      const revealLen = lineLen * progress;

      // Vary opacity by edge strength so overlapping lines remain distinguishable
      const edgeStrength = (edge.metadata as Record<string, unknown>)?.strength as number | undefined ?? 0.5;
      context.save();
      context.strokeStyle = progress >= 1.0
        ? `rgba(184, 115, 51, ${0.45 + edgeStrength * 0.35})`
        : 'rgba(184, 115, 51, 0.30)';
      context.lineWidth = 1.5;
      // Permanently dashed when fully revealed — individual lines are traceable in dense graphs.
      // During reveal animation keep a solid growing stroke, then settle to dashes.
      context.setLineDash(progress >= 1.0 ? [6, 4] : (lineLen > 0 ? [revealLen, lineLen] : []));
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(sx, sy);
      context.lineTo(tx, sy); // horizontal first
      context.lineTo(tx, ty); // then vertical
      context.stroke();
      context.restore();
    }

    } // end lodTier !== 'overview' for edges

    // ── Flag + Badge constants (close tier only) ──────────────────────────────
    const FLAG_PAD_X = 8;
    const FLAG_TIP   = 7;
    const FLAG_R     = 3;

    const PRIORITY_COLORS: Record<string, string> = {
      p0: '#c0392b', p1: '#b87333', p2: '#c8a84b', p3: '#4a4438',
    };

    // ── Node rendering: LOD-aware ─────────────────────────────────────────────
    // Z-index: agents render last (on top), tasks first (below)
    const nodesByLayer = [...snapshot.nodes].sort((a, b) => {
      if (a.kind === 'agent' && b.kind !== 'agent') return 1;
      if (a.kind !== 'agent' && b.kind === 'agent') return -1;
      return 0;
    });

    for (const node of nodesByLayer) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const isSelected = node.id === selectedId;
      const isActive = node.status === 'active';
      const ncx = pos.x + pos.width / 2;
      const ncy = pos.y + pos.height / 2;

      // ── Signals: always a small dot ─────────────────────────────────────
      if (node.kind === 'signal') {
        const sr = lodTier === 'overview' ? 3 : 5;
        context.shadowColor = 'rgba(184, 115, 51, 0.4)';
        context.shadowBlur = isSelected ? 10 : 4;
        context.beginPath();
        context.arc(ncx, ncy, sr, 0, Math.PI * 2);
        context.fillStyle = phaseBg;
        context.fill();
        context.strokeStyle = isSelected ? colors.nodeActive : withAlpha(colors.nodeActive, 0.5);
        context.lineWidth = isSelected ? 1.2 : 0.75;
        context.stroke();
        context.shadowBlur = 0;
        continue;
      }

      context.shadowBlur = 0;
      context.textBaseline = 'middle';

      // ═══════════════════════════════════════════════════════════════════
      // OVERVIEW TIER (zoom < 0.3): pads + dots
      // ═══════════════════════════════════════════════════════════════════
      if (lodTier === 'overview') {
        if (node.kind === 'agent') {
          // Agent: glowing dot with velocity tail
          const r = 6;
          const indState = indicatorStates.get(node.id);
          const isActiveLoop = indState && indState.loopPhase !== 'idle';

          // Velocity tail (directional streak)
          if (isActiveLoop) {
            const tailLen = 12;
            const angle = Math.atan2(ncy - (pos.y - 6), ncx - pos.x);
            context.beginPath();
            context.moveTo(ncx, ncy);
            context.lineTo(ncx - Math.cos(angle) * tailLen, ncy - Math.sin(angle) * tailLen);
            context.strokeStyle = `rgba(184, 115, 51, 0.5)`;
            context.lineWidth = 2;
            context.stroke();
          }

          context.beginPath();
          context.arc(ncx, ncy, r, 0, Math.PI * 2);
          context.fillStyle = isActiveLoop ? 'rgba(184, 115, 51, 0.9)' : 'rgba(184, 115, 51, 0.4)';
          context.fill();
          if (isSelected) {
            context.strokeStyle = colors.nodeActive;
            context.lineWidth = 1.5;
            context.stroke();
          }
        } else if (node.kind === 'task') {
          // Task: 8×8 pad, color = priority
          const priority = (node.metadata as Record<string, unknown>)?.priority as string | undefined;
          const padSize = 8;
          const pColor = priority ? PRIORITY_COLORS[priority] : '#a09880';

          // Status affects alpha
          let alpha = 0.7;
          if (node.status === 'active') alpha = 0.9;
          else if (node.status === 'blocked') alpha = 1.0;
          else if (node.status === 'completed') alpha = 0.25;

          context.fillStyle = withAlpha(pColor, alpha);
          context.beginPath();
          context.roundRect(ncx - padSize / 2, ncy - padSize / 2, padSize, padSize, 1.5);
          context.fill();

          // Blocked tasks get a red outline
          if (node.status === 'blocked') {
            context.strokeStyle = withAlpha('#c0392b', 0.8);
            context.lineWidth = 1;
            context.stroke();
          }

          if (isSelected) {
            context.strokeStyle = colors.nodeActive;
            context.lineWidth = 1.5;
            context.beginPath();
            context.roundRect(ncx - padSize / 2 - 2, ncy - padSize / 2 - 2, padSize + 4, padSize + 4, 2.5);
            context.stroke();
          }
        }
        continue; // done with overview tier
      }

      // ═══════════════════════════════════════════════════════════════════
      // MID TIER (0.3 ≤ zoom < 0.8): chips with wt:NNN
      // ═══════════════════════════════════════════════════════════════════
      if (lodTier === 'mid') {
        if (node.kind === 'agent') {
          // Agent: hexagon symbol (shape distinguishes agents from task chips)
          const hexW = 40, hexH = 36;
          beginShape(context, 'hexagon', ncx - hexW / 2, ncy - hexH / 2, hexW, hexH);
          context.fillStyle = 'rgba(28, 22, 14, 0.9)';
          context.fill();
          context.strokeStyle = withAlpha(colors.nodeActive, 0.6);
          context.lineWidth = 1.5;
          context.stroke();
        } else if (node.kind === 'task') {
          // Task: 40×18 chip showing wt:NNN
          const wtId = (node.metadata as Record<string, unknown>)?.wt_id as string | undefined;
          const priority = (node.metadata as Record<string, unknown>)?.priority as string | undefined;
          const refDes = wtId
            ? wtId.replace('wt-sovra-', 'wt:s-').replace('wt-', 'wt:')
            : 'wt:?';

          const chipW = 44;
          const chipH = 18;
          const chipX = ncx - chipW / 2;
          const chipY = ncy - chipH / 2;

          // Priority determines border color
          const pColor = priority ? PRIORITY_COLORS[priority] : null;
          const borderColor = pColor ? withAlpha(pColor, 0.6) : withAlpha(colors.nodeActive, 0.2);

          context.beginPath();
          context.roundRect(chipX, chipY, chipW, chipH, 3);
          context.fillStyle = isActive ? 'rgba(28, 22, 14, 0.85)' : 'rgba(20, 16, 12, 0.7)';
          context.fill();
          context.strokeStyle = borderColor;
          context.lineWidth = node.status === 'blocked' ? 1.5 : 0.75;
          context.stroke();

          // Chevron accent on left edge (priority color)
          if (pColor) {
            context.beginPath();
            context.moveTo(chipX, chipY);
            context.lineTo(chipX + 3, chipY);
            context.lineTo(chipX + 3, chipY + chipH);
            context.lineTo(chipX, chipY + chipH);
            context.closePath();
            context.fillStyle = withAlpha(pColor, 0.7);
            context.fill();
          }

          context.textAlign = 'center';
          context.font = '7px var(--font-mono, monospace)';
          context.fillStyle = isActive ? 'rgba(232, 224, 208, 0.85)' : 'rgba(160, 152, 128, 0.65)';
          context.fillText(refDes, ncx + 2, ncy + 1);
        }
        continue; // done with mid tier
      }

      // ═══════════════════════════════════════════════════════════════════
      // CLOSE TIER (zoom ≥ 0.8): Redesigned compact visualization
      // Agents: Large hexagons, front and center
      // Tasks: Compact vertical pills, orbit agents
      // ═══════════════════════════════════════════════════════════════════
      const priority = (node.metadata as Record<string, unknown>)?.priority as string | undefined;
      const pColor = priority ? PRIORITY_COLORS[priority] : null;

      if (node.kind === 'agent') {
        const indState = indicatorStates.get(node.id);
        const phaseLine = (indState && indState.loopPhase !== 'idle')
          ? indState.loopPhase.toUpperCase() : null;

        // Large prominent hexagon - 52×46px, agents are the stars
        const HEX_W = 52, HEX_H = 46;
        beginShape(context, 'hexagon', ncx - HEX_W / 2, ncy - HEX_H / 2, HEX_W, HEX_H);
        context.fillStyle = 'rgba(24, 20, 16, 0.95)';
        context.fill();
        
        // Thick brass border
        context.strokeStyle = withAlpha(colors.nodeActive, isSelected ? 1.0 : 0.75);
        context.lineWidth = isSelected ? 2.5 : 1.5;
        context.stroke();

        // Priority-colored accent if available
        if (pColor) {
          beginShape(context, 'hexagon', ncx - HEX_W / 2 - 3, ncy - HEX_H / 2 - 3, HEX_W + 6, HEX_H + 6);
          context.strokeStyle = withAlpha(pColor, 0.4);
          context.lineWidth = 1;
          context.stroke();
        }

        // Label: centered in hexagon, small and clean
        context.textAlign = 'center';
        context.font = 'bold 10px var(--font-mono, monospace)';
        context.fillStyle = withAlpha(colors.nodeActive, 0.95);
        // Truncate to fit
        const shortName = node.label.length > 10 ? node.label.slice(0, 9) + '…' : node.label;
        context.fillText(shortName, ncx, ncy + 1);

        // Phase indicator below the hexagon
        if (phaseLine) {
          context.font = '9px var(--font-mono, monospace)';
          context.fillStyle = withAlpha(pColor ?? colors.nodeActive, 0.8);
          context.fillText(phaseLine, ncx, ncy + HEX_H / 2 + 14);
        }

      } else if (node.kind === 'task') {
        // Compact task badge - ID + status, clean and scannable
        const wtId = (node.metadata as Record<string, unknown>)?.wt_id as string | undefined;
        const shortId = wtId ? wtId.replace('wt-sovra-', 's').replace('wt-', '') : '?';
        const column = (node.metadata as Record<string, unknown>)?.flow_phase as string | undefined;
        
        // Badge size: compact but readable
        const badgeW = 72;
        const badgeH = 48;
        const px = ncx - badgeW / 2;
        const py = ncy - badgeH / 2;

        // Background with priority color subtle tint
        context.beginPath();
        context.roundRect(px, py, badgeW, badgeH, 6);
        const baseColor = isActive ? '32, 28, 22' : '22, 18, 14';
        context.fillStyle = pColor 
          ? `rgba(${baseColor}, 0.95)`
          : `rgba(${baseColor}, 0.9)`;
        context.fill();

        // Priority accent: top border
        if (pColor) {
          context.beginPath();
          context.roundRect(px, py, badgeW, 3, [3, 3, 0, 0]);
          context.fillStyle = withAlpha(pColor, 0.9);
          context.fill();
        }

        // Border
        context.strokeStyle = pColor 
          ? withAlpha(pColor, isActive ? 0.7 : 0.4)
          : withAlpha(colors.nodeActive, isActive ? 0.5 : 0.25);
        context.lineWidth = isActive ? 1.5 : 1;
        context.stroke();

        // Worktree ID - large and centered (the key identifier)
        context.textAlign = 'center';
        context.font = 'bold 14px var(--font-mono, monospace)';
        context.fillStyle = withAlpha(pColor ?? colors.nodeActive, 0.95);
        context.fillText(shortId, ncx, ncy + 2);

        // Status label below
        const statusLabel = column ? column.slice(0, 3) : 'IDLE';
        context.font = '8px var(--font-mono, monospace)';
        context.fillStyle = withAlpha(colors.nodeActive, 0.6);
        context.fillText(statusLabel, ncx, py + badgeH - 6);
      }
    }

    // ── Indicator Layer: only at close zoom ───────────────────────────────────
    if (lodTier === 'close') {
      const phaseIntensity = phaseTheme[phase]?.indicatorIntensity ?? 1.0;

      for (const node of snapshot.nodes) {
        const pos = positions.get(node.id);
        if (!pos) continue;
        const indicator = indicatorStates.get(node.id);
        if (!indicator || indicator.loopPhase === 'idle') continue;

        const size = symbolSize(node.kind);
        const ncx = pos.x + pos.width / 2;
        const ncy = pos.y + pos.height / 2;
        const baseRadius = Math.max(size.w, size.h) / 2;

        // Hexagon geometry for all agent indicators
        const HEX_IND_W = 44, HEX_IND_H = 40;

        switch (indicator.loopPhase) {
          case 'think': {
            const offset = agentPulseOffset(node.id);
            const pulsePeriodMs = (phaseTheme[phase]?.ambientPulseSpeed ?? 2) * 1000;
            const pulsePhase = ((now + offset) % pulsePeriodMs) / pulsePeriodMs;
            const alpha = phaseIntensity * (0.3 + 0.4 * Math.sin(pulsePhase * Math.PI * 2));
            const P = 5;
            beginShape(context, 'hexagon',
              ncx - HEX_IND_W / 2 - P, ncy - HEX_IND_H / 2 - P,
              HEX_IND_W + 2 * P, HEX_IND_H + 2 * P);
            context.strokeStyle = `rgba(184, 115, 51, ${alpha})`;
            context.lineWidth = 2;
            context.stroke();
            break;
          }
          case 'perceive': {
            if (indicator.traceTargetId) {
              const targetPos = positions.get(indicator.traceTargetId);
              if (targetPos) {
                const tx = targetPos.x + targetPos.width / 2;
                const ty = targetPos.y + targetPos.height / 2;
                context.beginPath();
                context.moveTo(ncx, ncy);
                context.lineTo(tx, ty);
                context.strokeStyle = `rgba(184, 115, 51, ${0.6 * phaseIntensity})`;
                context.lineWidth = 1;
                context.setLineDash([4, 4]);
                context.stroke();
                context.setLineDash([]);
              }
            }
            break;
          }
          case 'act': {
            // Emit particles from the hexagon edge facing the target
            const targetPos = indicator.traceTargetId ? positions.get(indicator.traceTargetId) : null;
            const targetCX = targetPos ? targetPos.x + targetPos.width / 2 : ncx + 999;
            const emitX = targetCX > ncx ? ncx + HEX_IND_W / 2 : ncx - HEX_IND_W / 2;
            for (let i = 0; i < 5; i++) {
              const t = ((now + i * 200) % 1000) / 1000;
              const alpha = phaseIntensity * (1 - t);
              const particleR = Math.max(0.5, 2 * (1 - t * 0.5));
              let px: number, py: number;
              if (targetPos) {
                const tx = targetPos.x + targetPos.width / 2;
                const ty = targetPos.y + targetPos.height / 2;
                const edgeDx = tx - emitX;
                const edgeDy = ty - ncy;
                const len = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy) || 1;
                const perpX = -edgeDy / len;
                const perpY = edgeDx / len;
                const spread = (i - 2) * 4;
                px = emitX + (edgeDx / len) * t * 50 + perpX * spread;
                py = ncy + (edgeDy / len) * t * 50 + perpY * spread;
              } else {
                const angle = (i / 5) * Math.PI * 2;
                px = ncx + Math.cos(angle) * (HEX_IND_W / 2 + t * 30);
                py = ncy + Math.sin(angle) * (HEX_IND_H / 2 + t * 30);
              }
              context.beginPath();
              context.arc(px, py, particleR, 0, Math.PI * 2);
              context.fillStyle = `rgba(184, 115, 51, ${alpha})`;
              context.fill();
            }
            break;
          }
        }
      }

      // Task-state indicators — close zoom only
      // Draw subtle glow around claimed tasks and idle pulse
      const TASK_W = 72;
      const TASK_H = 48;
      
      for (const node of snapshot.nodes) {
        if (node.kind !== 'task') continue;
        const pos = positions.get(node.id);
        if (!pos) continue;
        
        const ncx = pos.x + pos.width / 2;
        const ncy = pos.y + pos.height / 2;
        const px = ncx - TASK_W / 2;
        const py = ncy - TASK_H / 2;

        if (node.metadata?.claiming_agent) {
          // Claimed: solid brass outline
          context.beginPath();
          context.roundRect(px - 3, py - 3, TASK_W + 6, TASK_H + 6, 6);
          context.strokeStyle = `rgba(184, 115, 51, ${0.6 * phaseIntensity})`;
          context.lineWidth = 2;
          context.stroke();
        } else if (node.status === 'idle') {
          // Idle: gentle pulse
          const pulsePhase = (now % 3000) / 3000;
          const alpha = phaseIntensity * (0.1 + 0.2 * Math.sin(pulsePhase * Math.PI * 2));
          context.beginPath();
          context.roundRect(px - 2, py - 2, TASK_W + 4, TASK_H + 4, 5);
          context.strokeStyle = `rgba(184, 115, 51, ${alpha})`;
          context.lineWidth = 1.5;
          context.stroke();
        }
      }
    }

    // ── End zoom/pan transform ─────────────────────────────────────────────
    context.restore();
  }
</script>

<div
  class="n4-manifold"
  bind:this={containerEl}
  role="button"
  tabindex="0"
  style:cursor={isDragging ? 'grabbing' : 'grab'}
  onclick={handleCanvasClick}
  onwheel={handleWheel}
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onmouseleave={handleMouseLeave}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleCanvasClick(e as any);
    if (e.key === 'Escape') expandedId = null;
    // Reset zoom/pan with 0 key
    if (e.key === '0') { zoom = 1; panX = 0; panY = 0; }
  }}
>
  <Canvas {width} {height}>
    <Layer {render} />
  </Canvas>

  {#if activeCardNode && cardPosition}
    <!-- Tether line from node to card -->
    <svg
      style:position="absolute"
      style:left="0"
      style:top="0"
      style:width="{width}px"
      style:height="{height}px"
      style:pointer-events="none"
      style:z-index="5"
    >
      <line
        x1={cardPosition.nodeCX}
        y1={cardPosition.nodeCY}
        x2={cardPosition.x + (cardPosition.x > cardPosition.nodeCX ? 0 : 220)}
        y2={cardPosition.y + 30}
        stroke="rgba(184, 115, 51, 0.4)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
    </svg>
    <div
      transition:fly={{ x: 12, y: -4, duration: 200 }}
      style:position="absolute"
      style:left="{cardPosition.x}px"
      style:top="{cardPosition.y}px"
      style:z-index="10"
    >
      <DetailCard
        node={activeCardNode}
        pinned={isCardPinned}
        onclose={() => { expandedId = null; }}
      />
    </div>
  {/if}
</div>

<style>
  .n4-manifold {
    width: 100%;
    height: 100%;
    position: relative;
    outline: none;
    /* overflow: visible so DetailCard + shadow aren't clipped at canvas edge.
       The <canvas> element clips its own drawing; no wrapper clip needed. */
    overflow: visible;
  }

</style>
