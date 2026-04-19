<script lang="ts">
  // EnchantedBlock — Adaptive card with Pretext measurement
  // Phase 1: Foundation (measurement + adaptive sizing)
  
  import type { Snippet } from 'svelte';
  import { measureBlock, type BlockMetrics, DEFAULT_FONT } from '../core/block-layout.js';
  import { 
    type BlockType, 
    type EnchantedBlockData,
    BLOCK_TYPE_ICONS, 
    BLOCK_TYPE_LABELS,
    BLOCK_TYPE_COLORS,
    nextBlockType,
    classifyBlockHeuristic,
  } from '../core/block-types.js';
  
  // ── Props ─────────────────────────────────────────────────────────────────
  
  interface Props {
    /** Block data (content, type, id) */
    block: EnchantedBlockData;
    /** Allow editing */
    editable?: boolean;
    /** Maximum width constraint */
    maxWidth?: number;
    /** Line height multiplier */
    lineHeight?: number;
    /** Show type badge */
    showTypeBadge?: boolean;
    /** Show annotation (if available) */
    showAnnotation?: boolean;
    /** Callback when content changes */
    onContentChange?: (content: string) => void;
    /** Callback when type changes */
    onTypeChange?: (type: BlockType) => void;
    /** Callback when block is focused */
    onFocus?: () => void;
    /** Optional footer snippet */
    footer?: Snippet<[]>;
  }
  
  let {
    block,
    editable = false,
    maxWidth = 400,
    lineHeight = 1.6,
    showTypeBadge = true,
    showAnnotation = true,
    onContentChange,
    onTypeChange,
    onFocus,
    footer,
  }: Props = $props();
  
  // ── State ──────────────────────────────────────────────────────────────────
  
  let isEditing = $state(false);
  let isExpanded = $state(false);
  let isHovered = $state(false);
  let editableEl: HTMLDivElement | undefined = $state();
  let isUserTyping = $state(false);
  let typingTimer: ReturnType<typeof setTimeout> | undefined;
  
  // ── Derived State ──────────────────────────────────────────────────────────
  
  /** DOM-free measurement via Pretext */
  const metrics = $derived<BlockMetrics>(
    measureBlock(
      block.content,
      DEFAULT_FONT,
      maxWidth,
      { whiteSpace: 'pre-wrap' },
      lineHeight
    )
  );
  
  /** Effective height (respects expand/collapse) */
  const effectiveHeight = $derived(
    isExpanded ? metrics.height : Math.min(metrics.height, 200)
  );
  
  /** Auto-classify if type is general */
  const suggestedType = $derived(
    block.type === 'general' && block.content.length > 10
      ? classifyBlockHeuristic(block.content)
      : null
  );
  
  /** Display type (suggested or actual) */
  const displayType = $derived(suggestedType?.type ?? block.type);
  const typeColor = $derived(BLOCK_TYPE_COLORS[displayType]);
  const typeIcon = $derived(BLOCK_TYPE_ICONS[displayType]);
  const typeLabel = $derived(BLOCK_TYPE_LABELS[displayType]);
  
  // ── Handlers ───────────────────────────────────────────────────────────────
  
  function handleFocus() {
    onFocus?.();
  }
  
  function handleDoubleClick() {
    if (editable && !isEditing) {
      isEditing = true;
    }
  }
  
  function handleBlur() {
    isUserTyping = false;
    clearTimeout(typingTimer);
    if (isEditing) {
      isEditing = false;
      // Sync final content
      if (editableEl && editableEl.innerText !== block.content) {
        onContentChange?.(editableEl.innerText);
      }
    }
  }
  
  function handleInput() {
    if (!editableEl) return;
    isUserTyping = true;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      isUserTyping = false;
      onContentChange?.(editableEl!.innerText);
    }, 300);
  }
  
  function handleKeydown(e: KeyboardEvent) {
    // Escape exits edit mode
    if (e.key === 'Escape' && isEditing) {
      e.preventDefault();
      editableEl?.blur();
    }
    
    // Tab inserts spaces
    if (e.key === 'Tab' && isEditing) {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode('  '));
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        handleInput();
      }
    }
    
    // Ctrl+Enter saves and exits
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && isEditing) {
      e.preventDefault();
      editableEl?.blur();
    }
  }
  
  function handleTypeClick() {
    const newType = nextBlockType(block.type);
    onTypeChange?.(newType);
  }
  
  function toggleExpand() {
    isExpanded = !isExpanded;
  }
  
  // Sync external content changes into contenteditable (skip while typing)
  $effect(() => {
    if (editableEl && isEditing && !isUserTyping && editableEl.innerText !== block.content) {
      editableEl.innerText = block.content;
    }
  });
  
  // Focus editable when entering edit mode
  $effect(() => {
    if (isEditing && editableEl) {
      editableEl.focus();
      // Place cursor at end
      const range = document.createRange();
      range.selectNodeContents(editableEl);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="enchanted-block"
  class:editing={isEditing}
  class:expanded={isExpanded}
  class:overflow={metrics.hasOverflow}
  class:suggested={!!suggestedType && block.type === 'general'}
  style:--type-color={typeColor}
  style:width="{Math.min(metrics.idealWidth, maxWidth)}px"
  style:min-height="{effectiveHeight}px"
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
  onfocus={handleFocus}
  role="article"
  aria-label="{typeLabel} block"
>
  <!-- Type Badge -->
  {#if showTypeBadge}
    <button
      class="type-badge"
      class:suggested={!!suggestedType && block.type === 'general'}
      onclick={handleTypeClick}
      title="Click to cycle type ({typeLabel})"
      aria-label="Block type: {typeLabel}. Click to change."
    >
      <span class="type-icon" aria-hidden="true">{typeIcon}</span>
      <span class="type-label">{typeLabel}</span>
      {#if suggestedType && block.type === 'general'}
        <span class="suggestion-hint" title="Suggested type ({Math.round(suggestedType.confidence * 100)}% confidence)">✦</span>
      {/if}
    </button>
  {/if}
  
  <!-- Content Area -->
  <div class="content-wrapper">
    {#if isEditing}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        bind:this={editableEl}
        class="block-content editable"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        tabindex="0"
        onblur={handleBlur}
        oninput={handleInput}
        onkeydown={handleKeydown}
      >{block.content}</div>
    {:else}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="block-content"
        class:truncated={!isExpanded && metrics.hasOverflow}
        ondblclick={handleDoubleClick}
        role="button"
        tabindex="0"
        aria-label="Double-click to edit"
      >
        {#each block.content.split('\n') as line, i}
          {#if line.length > 0}
            <p class="content-line">{line}</p>
          {:else}
            <br />
          {/if}
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Annotation (appears on hover/focus) -->
  {#if showAnnotation && block.annotation && (isHovered || isExpanded)}
    <div class="annotation" transition:fade={{ duration: 150 }}>
      <span class="annotation-icon">✦</span>
      <span class="annotation-text">{block.annotation}</span>
    </div>
  {/if}
  
  <!-- Overflow Controls -->
  {#if metrics.hasOverflow}
    <button
      class="expand-toggle"
      onclick={toggleExpand}
      aria-label={isExpanded ? 'Collapse content' : 'Expand content'}
    >
      {isExpanded ? '▲ Collapse' : `▼ Expand (${metrics.lineCount} lines)`}
    </button>
  {/if}
  
  <!-- Footer Slot -->
  {#if footer}
    <div class="block-footer">
      {@render footer()}
    </div>
  {/if}
  
  <!-- Edit Hint (visible on hover when editable) -->
  {#if editable && !isEditing && isHovered}
    <div class="edit-hint">
      Double-click to edit
    </div>
  {/if}
</div>

<script module lang="ts">
  // Simple fade transition (inline to avoid import issues)
  function fade(node: HTMLElement, { duration = 150 }: { duration?: number } = {}) {
    return {
      duration,
      css: (t: number) => `opacity: ${t};`
    };
  }
</script>

<style>
  .enchanted-block {
    position: relative;
    background: var(--color-bg-elevated, #2a2a2a);
    border-left: 3px solid var(--type-color, #b87333);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-3, 12px);
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }
  
  .enchanted-block:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    border-left-width: 4px;
  }
  
  .enchanted-block.editing {
    border-left-width: 4px;
    box-shadow: 0 0 0 2px var(--type-color, #b87333);
  }
  
  .enchanted-block.suggested {
    border-style: dashed;
  }
  
  /* Type Badge */
  .type-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    margin-bottom: 8px;
    background: color-mix(in hsl, var(--type-color, #b87333) 15%, transparent);
    border: 1px solid color-mix(in hsl, var(--type-color, #b87333) 30%, transparent);
    border-radius: var(--radius-sm, 4px);
    font-size: var(--text-xs, 11px);
    font-weight: 500;
    color: var(--type-color, #b87333);
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }
  
  .type-badge:hover {
    background: color-mix(in hsl, var(--type-color, #b87333) 25%, transparent);
    border-color: color-mix(in hsl, var(--type-color, #b87333) 50%, transparent);
  }
  
  .type-badge.suggested {
    animation: pulse 2s infinite;
  }
  
  .type-icon {
    font-size: 10px;
  }
  
  .type-label {
    text-transform: capitalize;
  }
  
  .suggestion-hint {
    margin-left: 2px;
    opacity: 0.8;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  /* Content */
  .content-wrapper {
    position: relative;
  }
  
  .block-content {
    font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
    font-size: var(--text-sm, 14px);
    line-height: 1.6;
    color: var(--color-text-primary, #e8e0d0);
    white-space: pre-wrap;
    word-break: break-word;
    cursor: default;
  }
  
  .block-content.truncated {
    max-height: 160px;
    overflow: hidden;
    mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
  }
  
  .block-content.editable {
    min-height: 60px;
    outline: none;
    cursor: text;
    caret-color: var(--type-color, #b87333);
  }
  
  .block-content.editable:empty::before {
    content: 'Start writing...';
    color: var(--color-text-muted, #a09880);
    pointer-events: none;
  }
  
  .content-line {
    margin: 0;
    padding: 2px 0;
  }
  
  /* Annotation */
  .annotation {
    margin-top: var(--space-2, 8px);
    padding-top: var(--space-2, 8px);
    border-top: 1px solid var(--color-border, #333);
    font-size: var(--text-xs, 11px);
    font-style: italic;
    color: var(--color-text-muted, #a09880);
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  
  .annotation-icon {
    color: var(--color-accent, #b87333);
    flex-shrink: 0;
  }
  
  .annotation-text {
    line-height: 1.5;
  }
  
  /* Overflow Toggle */
  .expand-toggle {
    display: block;
    width: 100%;
    margin-top: var(--space-2, 8px);
    padding: 6px;
    background: transparent;
    border: 1px dashed var(--color-border, #333);
    border-radius: var(--radius-sm, 4px);
    font-size: var(--text-xs, 11px);
    color: var(--color-text-muted, #a09880);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .expand-toggle:hover {
    background: var(--color-bg-hover, #333);
    border-color: var(--color-accent, #b87333);
    color: var(--color-accent, #b87333);
  }
  
  /* Footer */
  .block-footer {
    margin-top: var(--space-2, 8px);
    padding-top: var(--space-2, 8px);
    border-top: 1px solid var(--color-border, #333);
  }
  
  /* Edit Hint */
  .edit-hint {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 2px 6px;
    background: var(--color-bg-hover, #333);
    border-radius: var(--radius-sm, 4px);
    font-size: 10px;
    color: var(--color-text-muted, #a09880);
    opacity: 0;
    animation: fadeIn 0.3s ease forwards;
    pointer-events: none;
  }
  
  @keyframes fadeIn {
    to { opacity: 1; }
  }
  
  .enchanted-block:hover .edit-hint {
    opacity: 1;
  }
</style>
