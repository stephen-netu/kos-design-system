<script lang="ts">
  // ParticleAssembleMark — animates a canvas particle field converging into
  // an arbitrary set of SVG-authored polygons (a logomark, glyph, or any
  // flat-fill shape). Generalizes the "form the mark from particles" hero
  // moment pattern.
  //
  // NOTE: Heavy stateful component (canvas + RAF loop). Use {#if} to fully
  // mount/unmount — visibility:hidden would keep the rAF loop running.
  //
  // S-05: the assembly RAF loop is bounded — it terminates once particles
  // settle and switches to a single static draw; it does not run forever.
  // Per-particle start edge/position/delay are cosmetically randomized for
  // visual variety only (no business logic depends on this), so
  // Math.random() here does not carry the S-02 determinism concern that
  // applies to kernel/backend computation.

  import { onMount, onDestroy } from 'svelte';
  import { fitScale, easeOutCubic, particleFrame } from './particle-assemble-math.js';

  export interface ParticleShape {
    /** Polygon points in the coordinate space of viewBoxWidth/viewBoxHeight. */
    points: [number, number][];
    /** 'primary' (gradient fill) or 'secondary' (solid accent fill). Defaults to 'primary'. */
    tone?: 'primary' | 'secondary';
  }

  export interface Props {
    shapes: ParticleShape[];
    viewBoxWidth: number;
    viewBoxHeight: number;
    width?: number;
    height?: number;
    primaryColor?: string;
    primaryColor2?: string;
    secondaryColor?: string;
    durationMs?: number;
    active?: boolean;
    class?: string;
    'aria-label'?: string;
  }

  let {
    shapes,
    viewBoxWidth,
    viewBoxHeight,
    width = 200,
    height = 200,
    primaryColor = 'currentColor',
    primaryColor2,
    secondaryColor = 'currentColor',
    durationMs = 900,
    active = true,
    class: className = '',
    'aria-label': ariaLabel
  }: Props = $props();

  interface Particle {
    x: number;
    y: number;
    tx: number;
    ty: number;
    color: string;
    r: number;
    delay: number;
  }

  let canvas: HTMLCanvasElement | undefined = $state();
  let settled = $state(false);
  let rafId: number | null = null;
  let particles: Particle[] = [];
  let observer: IntersectionObserver | null = null;
  let lastDx = 0;
  let lastDy = 0;
  let lastScale = 1;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;

  // Canvas fillStyle cannot parse CSS custom properties or `currentColor` —
  // it isn't part of the CSSOM cascade. Resolve those to a concrete color
  // via the canvas element's computed style before handing them to canvas.
  function resolveColor(value: string): string {
    if (!canvas) return value;
    const trimmed = value.trim();
    const varMatch = trimmed.match(/^var\((--[\w-]+)(?:\s*,\s*(.+))?\)$/);
    if (varMatch) {
      const resolved = getComputedStyle(canvas).getPropertyValue(varMatch[1]).trim();
      return resolved || varMatch[2] || trimmed;
    }
    if (trimmed === 'currentColor') {
      return getComputedStyle(canvas).color;
    }
    return trimmed;
  }

  function drawShapes(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    scale: number
  ) {
    const resolvedPrimary = resolveColor(primaryColor);
    const resolvedPrimary2 = resolveColor(primaryColor2 || primaryColor);
    const resolvedSecondary = resolveColor(secondaryColor);

    const gradient = ctx.createLinearGradient(dx, dy, dx + viewBoxWidth * scale, dy + viewBoxHeight * scale);
    gradient.addColorStop(0, resolvedPrimary);
    gradient.addColorStop(1, resolvedPrimary2);

    for (const shape of shapes) {
      ctx.fillStyle = shape.tone === 'secondary' ? resolvedSecondary : gradient;
      ctx.beginPath();
      shape.points.forEach(([px, py], i) => {
        const x = dx + px * scale;
        const y = dy + py * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    }
  }

  function buildTargets(): { x: number; y: number; r: number; g: number; b: number }[] {
    if (!canvas) return [];
    const cssW = canvas.clientWidth || width;
    const cssH = canvas.clientHeight || height;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;

    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const offCtx = off.getContext('2d');
    if (!offCtx) return [];

    const { scale, dx, dy } = fitScale(viewBoxWidth, viewBoxHeight, canvas.width, canvas.height);

    drawShapes(offCtx, dx, dy, scale);
    lastDx = dx;
    lastDy = dy;
    lastScale = scale;

    const data = offCtx.getImageData(0, 0, off.width, off.height).data;
    const step = Math.max(1, Math.floor(dpr * 1.15));
    const pts: { x: number; y: number; r: number; g: number; b: number }[] = [];
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const idx = (y * off.width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 100) {
          pts.push({ x, y, r: data[idx], g: data[idx + 1], b: data[idx + 2] });
        }
      }
    }
    return pts;
  }

  function initParticles() {
    const pts = buildTargets();
    if (!canvas) return;
    const cw = canvas.width;
    const ch = canvas.height;
    particles = pts.map((p) => {
      const edge = Math.floor(Math.random() * 4);
      let sx: number;
      let sy: number;
      if (edge === 0) { sx = -40; sy = Math.random() * ch; }
      else if (edge === 1) { sx = cw + 40; sy = Math.random() * ch; }
      else if (edge === 2) { sx = Math.random() * cw; sy = -40; }
      else { sx = Math.random() * cw; sy = ch + 40; }
      return {
        x: sx,
        y: sy,
        tx: p.x,
        ty: p.y,
        color: `rgb(${p.r},${p.g},${p.b})`,
        r: (Math.random() * 1.0 + 1.3) * dpr,
        delay: Math.random() * 300
      };
    });
  }

  function renderFinalMark() {
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShapes(ctx, lastDx, lastDy, lastScale);
  }

  function animate(now: number, startTime: number) {
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let allDone = true;
    for (const p of particles) {
      const t = now - startTime - p.delay;
      if (t < 0) { allDone = false; continue; }
      const progress = t / durationMs;
      const eased = easeOutCubic(progress);
      if (progress < 1) allDone = false;
      const frame = particleFrame(p, eased);
      ctx.globalAlpha = frame.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(frame.x, frame.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!allDone) {
      rafId = requestAnimationFrame((n) => animate(n, startTime));
    } else {
      renderFinalMark();
      settled = true;
      rafId = null;
    }
  }

  function start() {
    if (!canvas) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initParticles();
    if (reduceMotion) {
      renderFinalMark();
      settled = true;
      return;
    }
    settled = false;
    const now = performance.now();
    rafId = requestAnimationFrame((n) => animate(n, n));
  }

  function replay() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    start();
  }

  // Re-run assembly when colors change (e.g. an accent-seed picker swap),
  // mirroring the settled-mark retheme behavior — only after first settle,
  // so this never fires during the initial mount's own assembly.
  $effect(() => {
    primaryColor; primaryColor2; secondaryColor;
    if (settled) replay();
  });

  onMount(() => {
    if (!active || !canvas) return;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              start();
              observer?.disconnect();
            }
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(canvas);
    } else {
      start();
    }
  });

  onDestroy(() => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    observer?.disconnect();
  });
</script>

<canvas
  bind:this={canvas}
  class="ds-particle-assemble-mark {className}"
  style:width="{width}px"
  style:height="{height}px"
  aria-hidden={ariaLabel ? undefined : 'true'}
  aria-label={ariaLabel}
  role={ariaLabel ? 'img' : undefined}
></canvas>

<style>
  .ds-particle-assemble-mark {
    display: block;
  }
</style>
