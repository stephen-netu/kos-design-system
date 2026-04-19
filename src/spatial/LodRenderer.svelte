<script lang="ts">
  // LodRenderer — 4-level LOD rendering with cross-fade transitions
  // wt-902: The signature visual system — recursive zoom experience
  //
  // Renders each cell at the appropriate LOD level based on current zoom.
  // Manages cross-fade transitions between levels (300ms default).
  // Parent provides render callbacks per level; LodRenderer manages which shows.
  //
  // L0 (>0.8x): Full cell — editable, titlebar, resize handles
  // L1 (0.4x-0.8x): Compact — title + type icon + first-line preview
  // L2 (0.15x-0.4x): Chip — colored circle, 2-letter abbrev
  // L3 (<0.15x): Pixel field — cells dissolve into color mosaic
  //
  // S-02: Transition timing from monotonic tick counter, not wall-clock.
  // S-05: Bounded cell count. No unbounded iteration.

  import type { Snippet } from 'svelte';
  import type { CellPosition } from './force-canvas-types.js';
  import type { LodLevel, LodRendererConfig, CellLodState } from './lod-types.js';
  import { zoomToLod, DEFAULT_LOD_THRESHOLDS, chipAbbrev } from './lod-types.js';

  // ── Props ────────────────────────────────────────────────────────────────

  interface Props {
    /** Cell positions from ForceCanvas */
    positions: CellPosition[];
    /** Current camera zoom factor (0–∞, 1.0 = default) */
    zoom: number;
    /** Container width in px */
    width: number;
    /** Container height in px */
    height: number;
    /** Camera pan offset X */
    panX?: number;
    /** Camera pan offset Y */
    panY?: number;
    /** Config overrides */
    config?: LodRendererConfig;

    // ── Level render callbacks (snippets) ──────────────────────────────

    /** L0: Full cell editor view */
    renderL0?: Snippet<[CellPosition, LodLevel]>;
    /** L1: Compact card view */
    renderL1?: Snippet<[CellPosition, LodLevel]>;
    /** L2: Dot/chip view */
    renderL2?: Snippet<[CellPosition, LodLevel]>;
    /** L3 renders as a full-zone pixel field — no per-cell callback.
     *  Instead, the parent provides an L3 overlay snippet. */
    renderL3?: Snippet<[CellPosition[], number]>; // positions[], zoom

    /** Click handler — forwarded from individual cells */
    onCellClick?: (cellId: string, level: LodLevel) => void;
  }

  let {
    positions,
    zoom,
    width,
    height,
    panX = 0,
    panY = 0,
    config,
    renderL0,
    renderL1,
    renderL2,
    renderL3,
    onCellClick,
  }: Props = $props();

  // ── Config ───────────────────────────────────────────────────────────────

  const thresholds = $derived(config?.thresholds ?? DEFAULT_LOD_THRESHOLDS);
  const crossFadeDuration = $derived(config?.crossFadeDuration ?? 300);

  // ── Current LOD level ────────────────────────────────────────────────────

  const currentLod = $derived(zoomToLod(zoom, thresholds));

  // ── Per-cell LOD state for cross-fade ────────────────────────────────────

  // Map<cellId, CellLodState> — tracks transition state per cell
  let lodStates: Map<string, CellLodState> = $state(new Map());
  let animFrameId: number | null = null;

  // Update LOD states when level changes
  $effect(() => {
    const level = currentLod;
    const now = performance.now();
    let needsAnimation = false;

    for (const pos of positions) {
      const existing = lodStates.get(pos.cell.id);

      if (!existing) {
        // New cell — no transition
        lodStates.set(pos.cell.id, {
          cellId: pos.cell.id,
          currentLevel: level,
          previousLevel: null,
          transitionProgress: null,
          transitionStart: null,
        });
      } else if (existing.currentLevel !== level) {
        // Level changed — start cross-fade
        lodStates.set(pos.cell.id, {
          cellId: pos.cell.id,
          currentLevel: level,
          previousLevel: existing.currentLevel,
          transitionProgress: 0,
          transitionStart: now,
        });
        needsAnimation = true;
      }
    }

    // Clean up cells that no longer exist
    const activeIds = new Set(positions.map((p) => p.cell.id));
    for (const id of lodStates.keys()) {
      if (!activeIds.has(id)) lodStates.delete(id);
    }

    if (needsAnimation) startAnimation();
  });

  function startAnimation() {
    if (animFrameId !== null) return;
    animFrameId = requestAnimationFrame(animateTransitions);
  }

  function animateTransitions() {
    const now = performance.now();
    let anyActive = false;

    for (const [id, state] of lodStates) {
      if (state.transitionProgress === null || state.transitionStart === null) continue;

      const elapsed = now - state.transitionStart;
      const progress = Math.min(1, elapsed / crossFadeDuration);

      lodStates.set(id, { ...state, transitionProgress: progress });

      if (progress < 1) {
        anyActive = true;
      } else {
        // Transition complete — clear previous level
        lodStates.set(id, {
          ...state,
          previousLevel: null,
          transitionProgress: null,
          transitionStart: null,
        });
      }
    }

    if (anyActive) {
      animFrameId = requestAnimationFrame(animateTransitions);
    } else {
      animFrameId = null;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getOpacity(cellId: string, forLevel: 'current' | 'previous'): number {
    const state = lodStates.get(cellId);
    if (!state || state.transitionProgress === null) {
      return forLevel === 'current' ? 1 : 0;
    }
    // ease-out cubic
    const t = state.transitionProgress;
    const eased = 1 - Math.pow(1 - t, 3);
    return forLevel === 'current' ? eased : 1 - eased;
  }

  function getLodState(cellId: string): CellLodState | undefined {
    return lodStates.get(cellId);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  import { onDestroy } from 'svelte';

  onDestroy(() => {
    if (animFrameId !== null) cancelAnimationFrame(animFrameId);
  });
</script>

<div
  class="lod-renderer"
  style:width="{width}px"
  style:height="{height}px"
>
  <div
    class="lod-viewport"
    style:transform="translate({panX}px, {panY}px) scale({zoom})"
    style:transform-origin="0 0"
  >
    {#if currentLod === 3 && renderL3}
      <!-- L3: pixel field — render full-zone overlay -->
      <div class="lod-l3-field" style:width="{width / zoom}px" style:height="{height / zoom}px">
        {@render renderL3(positions, zoom)}
      </div>
    {:else}
      <!-- L0/L1/L2: per-cell rendering -->
      {#each positions as pos (pos.cell.id)}
        {@const state = getLodState(pos.cell.id)}
        {@const isTransitioning = state?.transitionProgress !== null && state?.transitionProgress !== undefined}

        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="lod-cell"
          style:left="{pos.x - pos.radius}px"
          style:top="{pos.y - pos.radius}px"
          onclick={() => onCellClick?.(pos.cell.id, currentLod)}
          data-lod={currentLod}
          data-cell-id={pos.cell.id}
        >
          <!-- Current level -->
          <div
            class="lod-layer lod-current"
            style:opacity={getOpacity(pos.cell.id, 'current')}
          >
            {#if currentLod === 0 && renderL0}
              {@render renderL0(pos, currentLod)}
            {:else if currentLod === 1 && renderL1}
              {@render renderL1(pos, currentLod)}
            {:else if currentLod === 2 && renderL2}
              {@render renderL2(pos, currentLod)}
            {:else}
              <!-- Fallback: chip -->
              <div
                class="lod-chip"
                style:width="{pos.radius * 2}px"
                style:height="{pos.radius * 2}px"
              >
                <span class="lod-chip-label">{chipAbbrev(pos.cell.label)}</span>
              </div>
            {/if}
          </div>

          <!-- Previous level (cross-fade out) -->
          {#if isTransitioning && state?.previousLevel !== null}
            <div
              class="lod-layer lod-previous"
              style:opacity={getOpacity(pos.cell.id, 'previous')}
            >
              {#if state.previousLevel === 0 && renderL0}
                {@render renderL0(pos, state.previousLevel)}
              {:else if state.previousLevel === 1 && renderL1}
                {@render renderL1(pos, state.previousLevel)}
              {:else if state.previousLevel === 2 && renderL2}
                {@render renderL2(pos, state.previousLevel)}
              {:else}
                <div
                  class="lod-chip"
                  style:width="{pos.radius * 2}px"
                  style:height="{pos.radius * 2}px"
                >
                  <span class="lod-chip-label">{chipAbbrev(pos.cell.label)}</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .lod-renderer {
    position: relative;
    overflow: hidden;
  }

  .lod-viewport {
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform;
  }

  .lod-cell {
    position: absolute;
    cursor: pointer;
  }

  .lod-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    will-change: opacity;
  }

  .lod-previous {
    pointer-events: none;
  }

  /* ── L2 chip fallback ──────────────────────────────────────────── */

  .lod-chip {
    border-radius: 50%;
    background: var(--color-accent, #b87333);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.85;
    transition: opacity 0.1s;
  }

  .lod-chip:hover {
    opacity: 1;
  }

  .lod-chip-label {
    font-family: var(--font-mono, monospace);
    font-size: 9px;
    font-weight: 600;
    color: var(--color-text-primary, #e8e0d0);
    letter-spacing: 0.5px;
    user-select: none;
  }

  /* ── L3 field ──────────────────────────────────────────────────── */

  .lod-l3-field {
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
