<script lang="ts">
   /**
    * MarkdownEditor Component - Phase 2
    *
    * CodeMirror 6 integration with markdown support.
    * Includes external file change detection and find/replace.
    *
    * NOTE: This is a heavy stateful component (CodeMirror creates ~200+ DOM nodes).
    * Prefer {#if} over visibility:hidden when toggling to avoid mounting hidden
    * editor instances. Use visibility:hidden only for the outer chrome wrapper.
    */

  import { onMount, onDestroy, untrack } from 'svelte';
  import { EditorView } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { writeTextFile, readTextFile, getMtimeMs, isTauri } from '../t0-transport/fs';
  import FindReplaceDialog from './FindReplaceDialog.svelte';
  import CorrectionTooltip from './components/CorrectionTooltip.svelte';
  import ExternalChangeDialog from './ExternalChangeDialog.svelte';
  import { buildExtensions } from './codemirror-config';
  import { markdownToHtml } from './markdown-preview';
  import type { CompletionSource } from './extensions/autocomplete';
  import type { SpellCheckCorrection, SpellCheckDictionary } from './extensions/spellcheck';

  interface Props {
    filePath: string | null;
    initialContent: string;
    onChange?: (content: string) => void;
    onSave?: () => void;
    onClose?: () => void;
    onExternalChange?: (content: string) => void;
    completionSource?: CompletionSource;
    spellCheckDictionary?: SpellCheckDictionary;
  }

  interface ActiveCorrection extends SpellCheckCorrection {
    from: number;
    to: number;
  }

  let { filePath, initialContent, onChange, onSave, onClose, onExternalChange, completionSource, spellCheckDictionary }: Props = $props();

  let content = $state(untrack(() => initialContent));
  let isDirty = $state(false);
  let isSaving = $state(false);
  let saveError = $state<string | null>(null);
  let showPreview = $state(false);
  let activeCorrection = $state<ActiveCorrection | null>(null);

  // Auto-save
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

  // Persistence backend (T0 transport). Static per session: without a Tauri
  // host there is no file backend, and the UI must say so instead of "Saved".
  const persistenceAvailable = isTauri();

  // External change detection
  let showExternalChangeDialog = $state(false);
  let externalChangeCheckInterval: ReturnType<typeof setInterval> | null = null;
  let isCheckingExternalChanges = $state(false);
  let lastKnownMtimeMs: number | null = null;
  
  // CodeMirror instance
  let editorContainer: HTMLDivElement;
  let editorView = $state<EditorView | null>(null);

  // Find/Replace state
  let showFindReplace = $state(false);

  // Computed
  let fileName = $derived(filePath?.split('/').pop() || filePath || 'Untitled');
  let saveStatus = $derived(
    isSaving ? 'Saving...' :
    saveError ? 'Error!' :
    filePath && !persistenceAvailable ? 'Not persisted' :
    isDirty ? 'Unsaved' : 'Saved'
  );

  // Open find/replace dialog
  function openFindReplace(withReplace: boolean) {
    showFindReplace = true;
    // The dialog will handle toggling replace mode via the button
    // We could pass this as a prop if we want to open directly to replace mode
  }

  // Close find/replace dialog
  function closeFindReplace() {
    showFindReplace = false;
    editorView?.focus();
  }

  async function handleCorrectionClick(
    correction: SpellCheckCorrection,
    _view: EditorView,
    from: number,
    to: number
  ) {
    activeCorrection = { ...correction, from, to };
  }

  function handleAcceptCorrection(suggestion: string) {
    if (!activeCorrection || !editorView) return;
    editorView.dispatch({
      changes: { from: activeCorrection.from, to: activeCorrection.to, insert: suggestion },
    });
    activeCorrection = null;
  }

  function handleAddWordToDictionary() {
    if (!activeCorrection) return;
    spellCheckDictionary?.addWord(activeCorrection.original);
    activeCorrection = null;
  }

  function handleDismissCorrection() {
    activeCorrection = null;
  }

  // Check for external file changes (mtime-based via T0 transport)
  async function checkExternalChanges() {
    if (!filePath || !persistenceAvailable || isCheckingExternalChanges || showExternalChangeDialog || !isDirty) return;

    isCheckingExternalChanges = true;
    try {
      const mtime = await getMtimeMs(filePath);
      if (mtime !== null && lastKnownMtimeMs !== null && mtime > lastKnownMtimeMs) {
        showExternalChangeDialog = true;
      }
    } catch (err) {
      // Silently fail - file might not exist
      console.debug('External change check failed:', err);
    } finally {
      isCheckingExternalChanges = false;
    }
  }

  // Handle reload from disk
  async function handleReloadFromDisk() {
    if (!filePath) return;
    
    try {
      const newContent = await readTextFile(filePath);

      // Update editor content
      if (editorView) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: newContent
          }
        });
      }

      content = newContent;
      isDirty = false;
      saveError = null;

      // Notify parent
      onExternalChange?.(newContent);
      onChange?.(newContent);

      // Update tracked modification time
      try { lastKnownMtimeMs = await getMtimeMs(filePath); } catch { /* keep prior value */ }
    } catch (err) {
      console.error('Failed to reload file:', err);
      saveError = err instanceof Error ? err.message : 'Failed to reload file';
    } finally {
      showExternalChangeDialog = false;
    }
  }

  // Handle keep current (ignore external changes)
  function handleKeepCurrent() {
    showExternalChangeDialog = false;
    // Mark as dirty to indicate divergence from disk
    isDirty = true;
  }

  // Initialize CodeMirror
  onMount(() => {
    const extensions = buildExtensions({
      completionSource,
      spellCheckDictionary,
      onCorrectionClick: handleCorrectionClick,
      onSave: saveContent,
      onFind: () => openFindReplace(false),
      onFindReplace: () => openFindReplace(true),
      onDocChanged: (newContent) => {
        content = newContent;
        activeCorrection = null;
        isDirty = true;
        saveError = null;
        onChange?.(content);
        // Auto-save: debounced 800ms after last keystroke
        if (filePath) {
          if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
          autoSaveTimeout = setTimeout(() => saveContent(), 800);
        }
      }
    });

    const state = EditorState.create({
      doc: initialContent,
      extensions
    });

    editorView = new EditorView({
      state,
      parent: editorContainer
    });

    // Seed the tracked modification time, then start external change
    // detection polling (every 2 seconds). Skipped without a backend.
    if (filePath && persistenceAvailable) {
      getMtimeMs(filePath)
        .then((m) => { lastKnownMtimeMs = m; })
        .catch(() => { /* file may not exist yet */ });
    }
    externalChangeCheckInterval = setInterval(checkExternalChanges, 2000);
    
    // Also check when window regains focus
    const handleWindowFocus = () => {
      checkExternalChanges();
    };
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      if (externalChangeCheckInterval) {
        clearInterval(externalChangeCheckInterval);
        externalChangeCheckInterval = null;
      }
    };
  });

  // Cleanup
  onDestroy(() => {
    editorView?.destroy();
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    if (externalChangeCheckInterval) {
      clearInterval(externalChangeCheckInterval);
      externalChangeCheckInterval = null;
    }
  });

  // Update content when file changes
  $effect(() => {
    if (editorView && initialContent !== editorView.state.doc.toString()) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: initialContent
        }
      });
      content = initialContent;
      isDirty = false;
      saveError = null;
    }
  });

  // Save file
  async function saveContent() {
    if (!isDirty || isSaving || !filePath) return;

    // No backend → no write. The status chip reads "Not persisted"; do not
    // mark clean or fire onSave, and never pretend the save succeeded.
    if (!persistenceAvailable) return;

    isSaving = true;
    saveError = null;

    try {
      await writeTextFile(filePath, content);
      isDirty = false;
      onSave?.();

      // Update tracked modification time after save
      try { lastKnownMtimeMs = await getMtimeMs(filePath); } catch { /* keep prior value */ }
    } catch (err) {
      saveError = err instanceof Error ? err.message : String(err);
      console.error('Failed to save file:', err);
    } finally {
      isSaving = false;
    }
  }

  function togglePreview() {
    showPreview = !showPreview;
  }
</script>

<div class="markdown-editor" data-testid="markdown-editor">
  <!-- Header -->
  <div class="editor-header" data-testid="editor-header">
    <div class="file-info">
      <span class="file-name" data-testid="editor-filename">{fileName}</span>
      <span class="save-status" class:dirty={isDirty} class:error={saveError} data-testid="save-status">
        {saveStatus}
      </span>
    </div>
    <div class="editor-actions">
      <button 
        class="action-btn" 
        class:active={showPreview}
        onclick={togglePreview}
      >
        Preview
      </button>
      {#if onClose}
        <button 
          class="action-btn"
          onclick={onClose}
        >
          Close
        </button>
      {/if}
      {#if filePath && persistenceAvailable}
        <button
          class="action-btn primary"
          onclick={saveContent}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      {/if}
    </div>
  </div>

  <!-- Body -->
  <div class="editor-body" class:split={showPreview}>
    <div class="editor-pane" bind:this={editorContainer}>
      <!-- Find/Replace Dialog -->
      <FindReplaceDialog
        {editorView}
        isOpen={showFindReplace}
        onClose={closeFindReplace}
      />
    </div>

    {#if showPreview}
      <div class="preview-pane">
        <div class="preview-content">
          {@html markdownToHtml(content)}
        </div>
      </div>
    {/if}
  </div>

  {#if activeCorrection}
    <CorrectionTooltip
      correction={{ original: activeCorrection.original, suggestions: activeCorrection.suggestions }}
      position={activeCorrection.position}
      onAccept={handleAcceptCorrection}
      onDismiss={handleDismissCorrection}
      onAddToDictionary={handleAddWordToDictionary}
    />
  {/if}

  {#if saveError}
    <div class="error-banner">
      Failed to save: {saveError}
    </div>
  {/if}
</div>

<!-- External Change Detection Dialog -->
{#if showExternalChangeDialog}
  <ExternalChangeDialog
    onReload={handleReloadFromDisk}
    onKeepCurrent={handleKeepCurrent}
  />
{/if}

<style>
  .markdown-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-bg-canvas, #141414);
    color: var(--color-text-primary, #f5f2eb);
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
    background: var(--color-bg-panel, #1a1a1a);
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .file-name {
    font-weight: 500;
    font-size: 14px;
  }

  .save-status {
    font-size: 12px;
    color: var(--color-text-tertiary, #6b6b6b);
  }

  .save-status.dirty {
    color: var(--color-accent);
  }

  .save-status.error {
    color: var(--color-error, #ef4444);
  }

  .editor-actions {
    display: flex;
    gap: var(--space-2);
  }

  .action-btn {
    padding: 6px 12px;
    border: 1px solid var(--border-subtle, #2a2a2a);
    background: var(--color-bg-panel-elevated, #252525);
    color: var(--color-text-secondary, #a0a0a0);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: var(--border-subtle);
    color: var(--color-text-primary, #f5f2eb);
  }

  .action-btn.active {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .action-btn.primary {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }

  .action-btn.primary:hover {
    background: var(--color-accent-hover, #c9843d);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .editor-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-body.split .editor-pane,
  .editor-body.split .preview-pane {
    flex: 1;
    width: 50%;
  }

  .editor-pane {
    flex: 1;
    overflow: hidden;
    position: relative;
    :global(.cm-editor) {
      height: 100%;
    }
    :global(.cm-scroller) {
      overflow: auto;
    }
  }

  .preview-pane {
    border-left: 1px solid var(--border-subtle, #2a2a2a);
    overflow-y: auto;
    background: var(--color-bg-panel, #1a1a1a);
  }

  .preview-content {
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
  }

  .preview-content :global(h1),
  .preview-content :global(h2),
  .preview-content :global(h3) {
    margin-top: 0;
    margin-bottom: 16px;
  }

  .preview-content :global(p) {
    margin-bottom: 12px;
  }

  .preview-content :global(code) {
    background: var(--color-bg-panel-elevated, #252525);
    padding: 2px 6px;
    border-radius: var(--radius-sm, 3px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.9em;
  }

  .preview-content :global(pre) {
    background: var(--color-bg-panel-elevated, #252525);
    padding: 12px;
    border-radius: var(--radius-md, 6px);
    overflow-x: auto;
    margin-bottom: 12px;
  }

  .preview-content :global(pre code) {
    background: none;
    padding: 0;
  }

  .preview-content :global(ul),
  .preview-content :global(ol) {
    margin-bottom: 12px;
    padding-left: 24px;
  }

  .preview-content :global(li) {
    margin-bottom: 4px;
  }

  .preview-content :global(blockquote) {
    border-left: 3px solid var(--color-accent);
    padding-left: 12px;
    margin-left: 0;
    margin-bottom: 12px;
    color: var(--color-text-secondary);
  }

  .preview-content :global(a) {
    color: var(--color-accent);
    text-decoration: none;
  }

  .preview-content :global(a:hover) {
    text-decoration: underline;
  }

  .error-banner {
    padding: 8px 16px;
    background: var(--color-error, #ef4444);
    color: white;
    font-size: 13px;
  }
</style>
