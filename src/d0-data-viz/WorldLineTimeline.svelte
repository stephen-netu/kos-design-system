<script lang="ts">
  import type { WorldLineData, WorldLineCharacter, WorldLineEvent, EventType } from './world-line-types';

  // ── Props ──
  let {
    data,
    selectedEventId = '',
    onEventSelect,
    height = 200,
  }: {
    data: WorldLineData;
    selectedEventId?: string;
    onEventSelect: (id: string) => void;
    height?: number;
  } = $props();

  // ── Constants (from mockup) ──
  const LABEL_W = 112;
  const PAD_R = 40;
  const ROW_H = 52;
  const TOP_H = 28;
  const NODE_R = 10;

  // ── State ──
  let svgEl: SVGSVGElement;
  let containerW = $state(800);

  // ── Derived ──
  const totalH = $derived(TOP_H + data.characters.length * ROW_H + 36);
  const effectiveH = $derived(Math.max(height, totalH));

  function rowCenters(): number[] {
    return data.characters.map((_, i) => TOP_H + i * ROW_H + ROW_H / 2);
  }

  function eventX(evZoneW: number, normX: number[]): number[] {
    return normX.map(n => LABEL_W + n * evZoneW);
  }

  function hexPts(cx: number, cy: number, r: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  function shapePoints(type: EventType, cx: number, cy: number, r: number): string {
    if (type === 'arrival') {
      return `${cx + r},${cy} ${cx - r * 0.7},${cy - r} ${cx - r * 0.7},${cy + r}`;
    } else if (type === 'conflict') {
      return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
    } else {
      // ritual — hexagon
      return hexPts(cx, cy, r);
    }
  }

  function eventNormX(): number[] {
    const n = data.events.length;
    if (n === 0) return [];
    if (n === 1) return [0.5];
    return data.events.map((_, i) => 0.12 + (i / (n - 1)) * 0.71);
  }

  // ── Resize ──
  $effect(() => {
    if (!svgEl) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerW = entry.contentRect.width;
      }
    });
    observer.observe(svgEl.parentElement!);
    return () => observer.disconnect();
  });
</script>

<div class="wl-container" style="height: {effectiveH}px; --row-h: {ROW_H}px;">
  <svg
    bind:this={svgEl}
    class="wl-canvas"
    viewBox="0 0 {containerW} {effectiveH}"
    preserveAspectRatio="xMidYMid meet"
  >
    {#if data.characters.length > 0 && data.events.length > 0}
    {@const rcs = rowCenters()}
    {@const evZoneW = containerW - LABEL_W - PAD_R}
    {@const exs = eventX(evZoneW, eventNormX())}

    <!-- ── Era bands ── -->
    {#each data.eras as era}
      {@const ex0 = LABEL_W + era.xNorm[0] * evZoneW}
      {@const ex1 = LABEL_W + era.xNorm[1] * evZoneW}
      <rect x={ex0} y="0" width={ex1 - ex0} height={effectiveH} fill={era.color} />
      {#if era.xNorm[1] < 1}
        <line x1={ex1} y1="0" x2={ex1} y2={effectiveH} stroke="rgba(255,255,255,0.08)" stroke-width="1" />
      {/if}
      <text
        x={(ex0 + ex1) / 2}
        y="15"
        text-anchor="middle"
        fill="rgba(110,118,129,0.6)"
        font-family="var(--font-mono)"
        font-size="8"
        letter-spacing="2"
      >{era.label}</text>
    {/each}

    <!-- ── Event column labels (above rows) ── -->
    {#each data.events as ev, ei}
      {#each ev.label as line, li}
        <text
          x={exs[ei]}
          y={effectiveH - 56 + li * 12}
          text-anchor="middle"
          fill={ev.id === selectedEventId ? '#d29922' : 'rgba(110,118,129,0.6)'}
          font-family="var(--font-mono)"
          font-size="7.5"
          letter-spacing="1.2"
        >{line}</text>
      {/each}
      <!-- Tick line from rows to label -->
      <line
        x1={exs[ei]}
        y1={TOP_H + data.characters.length * ROW_H}
        x2={exs[ei]}
        y2={TOP_H + data.characters.length * ROW_H + 6}
        stroke={ev.id === selectedEventId ? '#d29922' : 'rgba(110,118,129,0.3)'}
        stroke-width="1"
      />
    {/each}

    <!-- ── Horizontal world lines (per character) ── -->
    {#each data.characters as char, ci}
      {@const cy = rcs[ci]}
      {@const charEvents: {x: number; state: string}[] = data.events
        .map((ev, i) => ({ ev, i, x: exs[i], state: ev.attendance[char.id] }))
        .filter(e => e.state)}
      {#each charEvents.slice(0, -1) as ce, k}
        {@const next = charEvents[k + 1]}
        {@const isGap = ce.state === 'psi' || next.state === 'psi'}
        <line
          x1={ce.x}
          y1={cy}
          x2={next.x}
          y2={cy}
          stroke={char.color}
          stroke-width="1.5"
          opacity="0.45"
          stroke-dasharray={isGap ? '5 4' : 'none'}
        />
      {/each}
    {/each}

    <!-- ── Intersection connectors (vertical at shared events) ── -->
    {#each data.events as ev, ei}
      {@const attendees = data.characters.filter(c => ev.attendance[c.id])}
      {#if attendees.length >= 2}
        {@const ys = attendees.map(c => rcs[data.characters.indexOf(c)])}
        {@const y1 = Math.min(...ys) + NODE_R + 2}
        {@const y2 = Math.max(...ys) - NODE_R - 2}
        {@const mid = (y1 + y2) / 2}
        <line
          x1={exs[ei]}
          y1={y1}
          x2={exs[ei]}
          y2={y2}
          stroke="rgba(255,255,255,0.18)"
          stroke-width="1"
          stroke-dasharray="3 3"
        />
        <rect
          x={exs[ei] - 10}
          y={mid - 7}
          width="20"
          height="14"
          rx="3"
          fill="#0d1117"
          stroke="rgba(255,255,255,0.12)"
          stroke-width="1"
        />
        <text
          x={exs[ei]}
          y={mid + 4}
          text-anchor="middle"
          fill="rgba(255,255,255,0.35)"
          font-family="var(--font-mono)"
          font-size="7.5"
          font-weight="600"
        >×{attendees.length}</text>
      {/if}
    {/each}

    <!-- ── Row label dividers ── -->
    {#each data.characters as _, ci}
      {#if ci > 0}
        {@const y = rcs[ci] - ROW_H / 2}
        <line x1="0" y1={y} x2={containerW} y2={y} stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      {/if}
    {/each}

    <!-- ── Character row labels (left) ── -->
    {#each data.characters as char, ci}
      {@const cy = rcs[ci]}
      <rect x="0" y={cy - ROW_H / 2} width="2" height={ROW_H} fill={char.color} opacity="0.5" />
      <circle cx="18" cy={cy} r="4" fill={char.color} opacity="0.8" />
      <text
        x="28"
        y={cy + 4}
        fill="rgba(139,148,158,0.85)"
        font-family="var(--font-mono)"
        font-size="8.5"
        font-weight="500"
        letter-spacing="1"
      >{char.label}</text>
    {/each}

    <!-- ── Event nodes (on top) ── -->
    {#each data.events as ev, ei}
      {#each data.characters as char}
        {@const st = ev.attendance[char.id]}
        {#if st}
          {@const cy = rcs[data.characters.indexOf(char)]}
          {@const isSelected = ev.id === selectedEventId}
          {@const isPsi = st === 'psi'}
          {@const cx = exs[ei]}
          {@const fillColor = isPsi ? 'transparent' : char.color}
          {@const strokeColor = char.color}

          <g
            class="wl-node"
            class:psi={isPsi}
            class:selected={isSelected}
            role="button"
            tabindex="0"
            cursor="pointer"
            onclick={() => onEventSelect(ev.id)}
            onkeydown={(e) => e.key === 'Enter' && onEventSelect(ev.id)}
          >
            {#if isPsi}
              <!-- Gold animated ring for ψ nodes -->
              <circle
                {cx}
                cy={cy}
                r={NODE_R + 5}
                fill="none"
                stroke="#d29922"
                stroke-width="1"
                opacity="0.6"
              >
                <animate attributeName="opacity" values="0.6;0.15;0.6" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="r" values="{NODE_R + 5};{NODE_R + 9};{NODE_R + 5}" dur="2.4s" repeatCount="indefinite" />
              </circle>
            {/if}

            {#if isSelected}
              <!-- Selection halo -->
              <circle {cx} cy={cy} r={NODE_R + 7} fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
            {/if}

            {#if ev.type === 'encounter'}
              <circle
                {cx}
                cy={cy}
                r={NODE_R * 0.85}
                fill={fillColor}
                stroke={strokeColor}
                stroke-width="1.8"
                opacity={isPsi ? '0.9' : '1'}
              />
            {:else}
              <polygon
                points={shapePoints(ev.type, cx, cy, NODE_R)}
                fill={fillColor}
                stroke={strokeColor}
                stroke-width="1.8"
                opacity={isPsi ? '0.9' : '1'}
              />
            {/if}

            {#if isPsi}
              <!-- Subtle inner fill for ψ -->
              {#if ev.type === 'encounter'}
                <circle {cx} cy={cy} r={NODE_R * 0.85} fill="{char.color}18" stroke="none" />
              {:else}
                <polygon
                  points={shapePoints(ev.type, cx, cy, NODE_R)}
                  fill="{char.color}18"
                  stroke="none"
                />
              {/if}
            {/if}
          </g>
        {/if}
      {/each}

      <!-- Selected event vertical tick at top -->
      {#if ev.id === selectedEventId}
        <line
          x1={exs[ei]}
          y1="20"
          x2={exs[ei]}
          y2="26"
          stroke="#d29922"
          stroke-width="2"
        />
      {/if}
    {/each}
    {/if}
  </svg>
</div>

<style>
  .wl-canvas {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .wl-node {
    transition: opacity 0.15s ease;
  }

  .wl-node:hover {
    opacity: 1;
  }
</style>
