<script lang="ts">
  import { renderMarkdown } from './markdown.js';

  interface Props {
    content: string;
    isEditing: boolean;
    onEditStart?: () => void;
    onEditEnd?: () => void;
    onContentChange?: (content: string) => void;
  }

  let {
    content = '',
    isEditing = false,
    onEditStart,
    onEditEnd,
    onContentChange,
  }: Props = $props();

  let editableEl: HTMLDivElement | undefined = $state();
  let renderedHtml = $derived(renderMarkdown(content));
  /** Guard: skip external sync while user is actively typing */
  let isUserTyping = $state(false);
  let typingTimer: ReturnType<typeof setTimeout> | undefined;

  function handleFocus() {
    onEditStart?.();
  }

  function handleBlur() {
    isUserTyping = false;
    clearTimeout(typingTimer);
    onEditEnd?.();
  }

  function handleInput() {
    if (!editableEl) return;
    isUserTyping = true;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { isUserTyping = false; }, 500);
    onContentChange?.(editableEl.innerText);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      editableEl?.blur();
    }
    // Tab inserts two spaces via Selection/Range (no deprecated execCommand)
    if (e.key === 'Tab') {
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
  }

  // Sync external content changes into the contenteditable — skip while user is typing
  $effect(() => {
    if (editableEl && isEditing && !isUserTyping && editableEl.innerText !== content) {
      editableEl.innerText = content;
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ds-block-content" ondblclick={onEditStart}>
  {#if isEditing}
    <!-- Editing mode: contenteditable div -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={editableEl}
      class="ds-block-editable"
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      tabindex="0"
      onfocus={handleFocus}
      onblur={handleBlur}
      oninput={handleInput}
      onkeydown={handleKeydown}
    ></div>
  {:else}
    <!-- Rendered mode: parsed markdown -->
    <div class="ds-block-rendered">
      {@html renderedHtml}
    </div>
  {/if}
</div>

  <!-- svelte-ignore css_unused_selector -->
  <style>
  .ds-block-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-2, 8px) var(--space-3, 12px);
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm, 13px);
    line-height: 1.6;
    color: var(--color-text-primary, #e8e0d0);
  }

  .ds-block-editable {
    min-height: 100%;
    outline: none;
    white-space: pre-wrap;
    word-break: break-word;
    caret-color: var(--color-accent, var(--color-accent));
  }

  .ds-block-editable:empty::before {
    content: 'Start writing...';
    color: var(--color-text-muted, #a09880);
    pointer-events: none;
  }

  .ds-block-rendered {
    min-height: 2em;
  }

  /* Markdown rendered styles — scoped descendants for {@html} content */
  .ds-block-rendered .md-h {
    margin: 12px 0 6px 0;
    font-weight: 600;
    color: var(--color-text-primary, #e8e0d0);
  }

  .ds-block-rendered .md-h1 { font-size: 1.4em; }
  .ds-block-rendered .md-h2 { font-size: 1.2em; }
  .ds-block-rendered .md-h3 { font-size: 1.1em; }
  .ds-block-rendered .md-h4,
  .ds-block-rendered .md-h5,
  .ds-block-rendered .md-h6 { font-size: 1em; }

  .ds-block-rendered .md-p {
    margin: 6px 0;
  }

  .ds-block-rendered .md-ul {
    margin: 6px 0;
    padding-left: 20px;
    list-style: none;
  }

  .ds-block-rendered .md-li {
    margin: 3px 0;
  }

  .ds-block-rendered .md-li::before {
    content: '• ';
    color: var(--color-accent, var(--color-accent));
  }

  .ds-block-rendered .md-bq {
    margin: 6px 0;
    padding: 6px 10px;
    border-left: 3px solid var(--color-accent, var(--color-accent));
    background: var(--color-accent-subtle);
    font-style: italic;
  }

  .ds-block-rendered .md-hr {
    border: none;
    border-top: 1px solid var(--color-border, #333);
    margin: 12px 0;
  }

  .ds-block-rendered .md-gap {
    height: 6px;
  }

  .ds-block-rendered .md-code {
    padding: 1px 5px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius-sm, 3px);
    font-family: var(--font-mono, monospace);
    font-size: 0.9em;
    color: var(--color-accent, var(--color-accent));
  }

  .ds-block-rendered strong {
    font-weight: 600;
    color: var(--color-text-primary, #e8e0d0);
  }

  .ds-block-rendered em {
    font-style: italic;
    color: var(--color-text-muted, #a09880);
  }

  .ds-block-rendered del {
    text-decoration: line-through;
    color: var(--color-text-muted, #a09880);
  }

  .ds-block-rendered .md-wiki {
    color: var(--color-accent, var(--color-accent));
    text-decoration: underline;
    text-decoration-style: dotted;
    cursor: pointer;
  }

  .ds-block-rendered .md-wiki:hover {
    text-decoration-style: solid;
  }
</style>
