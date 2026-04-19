<script lang="ts">
  // NodepadBlock — Flat, inline-editing block inspired by Nodepad spatial notes
  // Key differences from bad first attempt:
  // - NO nested card containers (single flat element)
  // - NO edit mode toggle (just click and type)
  // - NO collapse button (content flows naturally)
  // - Stable cursor (no $effect overwriting content while typing)
  
  import { measureBlock, type BlockMetrics, DEFAULT_FONT } from '../core/block-layout.js';
  import { 
    type BlockType, 
    type EnchantedBlockData,
    BLOCK_TYPE_COLORS,
    BLOCK_TYPE_ICONS,
    classifyBlockHeuristic,
  } from '../core/block-types.js';
  
  interface Props {
    block: EnchantedBlockData;
    maxWidth?: number;
    onChange?: (content: string) => void;
    onTypeChange?: (type: BlockType) => void;
  }
  
  let { 
    block, 
    maxWidth = 320,
    onChange,
    onTypeChange,
  }: Props = $props();
  
  // ── Stable Local State ─────────────────────────────────────────────────────
  // CRITICAL: Local content copy prevents parent re-renders from resetting cursor
  let localContent = $state('');
  let isFocused = $state(false);
  let hasUnsavedChanges = $state(false);
  let contentEl: HTMLDivElement | undefined = $state();
  
  // Initialize content on mount (once only)
  $effect(() => {
    if (contentEl && localContent === '') {
      localContent = block.content;
      contentEl.innerText = block.content;
    }
  });
  
  // ── Derived ────────────────────────────────────────────────────────────────
  const metrics = $derived<BlockMetrics>(
    measureBlock(localContent, DEFAULT_FONT, maxWidth, { whiteSpace: 'pre-wrap' })
  );
  
  const suggestedType = $derived(
    block.type === 'general' && localContent.length > 10
      ? classifyBlockHeuristic(localContent)
      : null
  );
  
  const displayType = $derived(suggestedType?.type ?? block.type);
  const typeColor = $derived(BLOCK_TYPE_COLORS[displayType]);
  const typeIcon = $derived(BLOCK_TYPE_ICONS[displayType]);
  
  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleInput() {
    if (!contentEl) return;
    localContent = contentEl.innerText;
    hasUnsavedChanges = true;
    // Auto-save on input (debounced by parent or just stream it)
    onChange?.(localContent);
  }
  
  function handleFocus() {
    isFocused = true;
  }
  
  function handleBlur() {
    isFocused = false;
    hasUnsavedChanges = false;
  }
  
  function cycleType() {
    const types: BlockType[] = ['claim', 'question', 'idea', 'task', 'reference', 'general'];
    const currentIndex = types.indexOf(block.type);
    const nextType = types[(currentIndex + 1) % types.length];
    onTypeChange?.(nextType);
  }
  
  function handleKeydown(e: KeyboardEvent) {
    // Tab inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
  }
</script>

<div
  class="nodepad-block"
  style:--type-color={typeColor}
  style:max-width="{maxWidth}px"
  class:suggested={!!suggestedType && block.type === 'general'}
>
  <!-- Header: Type indicator + ID -->
  <div class="block-header">
    <button class="type-chip" onclick={cycleType} title="Click to change type">
      <span class="type-icon">{typeIcon}</span>
      <span class="type-name">{displayType}</span>
    </button>
    <span class="block-id">{block.id}</span>
  </div>
  
  <!-- Content: Always editable (like Nodepad) -->
  <!-- CRITICAL: No {block.content} binding here - we set innerText manually to prevent cursor reset -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    bind:this={contentEl}
    class="block-content"
    contenteditable="true"
    role="textbox"
    aria-multiline="true"
    tabindex="0"
    oninput={handleInput}
    onfocus={handleFocus}
    onblur={handleBlur}
    onkeydown={handleKeydown}
  ></div>
  
  <!-- Footer: Annotation if present -->
  {#if block.annotation}
    <div class="block-annotation">
      <span class="annotation-dot">•</span>
      {block.annotation}
    </div>
  {/if}
  
  <!-- Saving indicator -->
  {#if hasUnsavedChanges}
    <div class="save-indicator">•</div>
  {/if}
</div>

<style>
  .nodepad-block {
    /* FLAT: No nested containers, no card styling - just the essentials */
    position: relative;
    padding: 12px 14px;
    background: var(--color-bg-elevated, #252422);
    border-left: 3px solid var(--type-color, #b87333);
    border-radius: 0 6px 6px 0;
    /* CRITICAL: Constant dimensions - no size change on focus/hover */
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
    box-sizing: border-box;
  }
  
  .nodepad-block:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  .nodepad-block:focus-within {
    /* Use outline instead of border change to avoid layout shift */
    outline: 2px solid color-mix(in srgb, var(--type-color, #b87333) 50%, transparent);
    outline-offset: 2px;
  }
  
  .nodepad-block.suggested {
    border-left-style: dashed;
  }
  
  /* Header */
  .block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    gap: 8px;
  }
  
  .type-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: color-mix(in srgb, var(--type-color, #b87333) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--type-color, #b87333) 25%, transparent);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    color: var(--type-color, #b87333);
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;
  }
  
  .type-chip:hover {
    background: color-mix(in srgb, var(--type-color, #b87333) 25%, transparent);
    border-color: color-mix(in srgb, var(--type-color, #b87333) 50%, transparent);
  }
  
  .type-icon {
    font-size: 10px;
  }
  
  .type-name {
    text-transform: capitalize;
  }
  
  .block-id {
    font-size: 11px;
    color: var(--color-text-muted, #706858);
    font-family: var(--font-mono, monospace);
  }
  
  /* Content - The key: just a contenteditable div, no wrapper, no truncation */
  .block-content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-primary, #e8e4dc);
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 1.6em;
    outline: none;
    caret-color: var(--type-color, #b87333);
  }
  
  .block-content:empty::before {
    content: 'Click to add content...';
    color: var(--color-text-muted, #706858);
    font-style: italic;
    pointer-events: none;
  }
  
  /* Annotation */
  .block-annotation {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border, #333);
    font-size: 12px;
    color: var(--color-text-secondary, #a09880);
    font-style: italic;
  }
  
  .annotation-dot {
    color: var(--type-color, #b87333);
    margin-right: 4px;
  }
  
  /* Save indicator (subtle dot when typing) */
  .save-indicator {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--type-color, #b87333);
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
