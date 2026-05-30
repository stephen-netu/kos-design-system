<script lang="ts">
  interface Props {
    onDrag: (delta: number) => void;
    class?: string;
  }

  let { onDrag, class: className = '' }: Props = $props();

  let isDragging = $state(false);
  let lastY = $state(0);

  function handlePointerDown(e: PointerEvent) {
    e.preventDefault();
    isDragging = true;
    lastY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const delta = e.clientY - lastY;
    lastY = e.clientY;
    onDrag(delta);
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* no-op */ }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="section-splitter {className}"
  class:section-splitter--active={isDragging}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerUp}
  role="separator"
  aria-orientation="horizontal"
>
  <span class="section-splitter__grip"></span>
</div>

<style>
  .section-splitter {
    height: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: ns-resize;
    background: var(--color-bg-panel, #222);
    border-top: 1px solid var(--border-color, #333);
    flex-shrink: 0;
    user-select: none;
    transition: background 0.1s, border-top-color 0.1s;
  }

  .section-splitter:hover,
  .section-splitter--active {
    background: color-mix(in srgb, var(--accent-primary, var(--color-accent)) 10%, var(--color-bg-panel, #222));
    border-top-color: var(--accent-primary, var(--color-accent));
  }

  /* Three-line grip — center line via element, top/bottom via box-shadow */
  .section-splitter__grip {
    width: 28px;
    height: 2px;
    border-radius: 1px;
    background: var(--color-text-muted, #555);
    pointer-events: none;
    box-shadow: 0 -4px 0 var(--color-text-muted, #555), 0 4px 0 var(--color-text-muted, #555);
    transition: background 0.1s, box-shadow 0.1s;
  }

  .section-splitter:hover .section-splitter__grip,
  .section-splitter--active .section-splitter__grip {
    background: var(--accent-primary, var(--color-accent));
    box-shadow: 0 -4px 0 var(--accent-primary, var(--color-accent)), 0 4px 0 var(--accent-primary, var(--color-accent));
  }
</style>
