<script lang="ts">
  /**
   * MarkdownEditor Component - Phase 2
   *
   * CodeMirror 6 integration with markdown support.
   * Includes external file change detection and find/replace.
   */

  import { onMount, onDestroy, untrack } from 'svelte';
  import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars,
           drawSelection, dropCursor, rectangularSelection, crosshairCursor,
           highlightActiveLine } from '@codemirror/view';
  import { EditorState, type Extension } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { search } from '@codemirror/search';
  import { writeFile, readFile } from '../tauri';
  import { vaultStore } from '../stores/vaultStore.svelte';
  import FindReplaceDialog from './FindReplaceDialog.svelte';

  interface Props {
    filePath: string | null;
    initialContent: string;
    onChange?: (content: string) => void;
    onSave?: () => void;
    onClose?: () => void;
    onExternalChange?: (newContent: string) => void;
  }

  const props : Props = $props();

  // Editor state — untrack() tells Svelte we intentionally capture only the initial prop value
  let content = $state(untrack(() => props.initialContent));
  let isDirty = $state(false);
  let isSaving = $state(false);
  let saveError = $state<string | null>(null);
  let showPreview = $state(false);

  // Auto-save
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

  // External change detection
  let showExternalChangeDialog = $state(false);
  let externalChangeCheckInterval: ReturnType<typeof setInterval> | null = null;
  let isCheckingExternalChanges = $state(false);
  
  // CodeMirror instance
  let editorContainer: HTMLDivElement;
  let editorView = $state<EditorView | null>(null);

  // Find/Replace state
  let showFindReplace = $state(false);

  // Computed
  let fileName = $derived(props.filePath?.split('/').pop() || props.filePath || 'Untitled');
  let saveStatus = $derived(
    isSaving ? 'Saving...' : 
    saveError ? 'Error!' : 
    isDirty ? 'Unsaved' : 'Saved'
  );

  // Custom keymap for save and find/replace
  const saveKeymap = keymap.of([{
    key: 'Ctrl-s',
    mac: 'Cmd-s',
    run: () => {
      saveContent();
      return true;
    }
  }, {
    key: 'Ctrl-f',
    mac: 'Cmd-f',
    run: () => {
      openFindReplace(false);
      return true;
    }
  }, {
    key: 'Ctrl-Shift-f',
    mac: 'Cmd-Shift-f',
    run: () => {
      openFindReplace(true);
      return true;
    }
  }]);

  // Open find/replace dialog
  function openFindReplace(withReplace: boolean) {
    showFindReplace = true;
    // The dialog will handle toggling replace mode via the button
    // We could pass this as a prop if we want to open directly to replace mode
  }

  // Close find/replace dialog
  function closeFindReplace() {
    showFindReplace = false;
    // Focus back to editor
    editorView?.focus();
  }

  // Custom dark theme matching Atelier - uses CSS variables via style injection
  const atelierTheme = EditorView.theme({
    '&': {
      backgroundColor: 'var(--bg-canvas)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      fontFamily: "var(--font-mono)"
    },
    '.cm-content': {
      caretColor: 'var(--accent-primary)',
      padding: '16px'
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--accent-primary)'
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--accent-subtle)'
    },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-app)',
      borderRight: '1px solid var(--border-subtle)',
      color: 'var(--text-tertiary)'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--accent-subtle)',
      color: 'var(--accent-primary)'
    },
    '.cm-selectionBackground': {
      backgroundColor: 'var(--accent-subtle)'
    }
  }, { dark: true });

  // Check for external file changes
  async function checkExternalChanges() {
    if (!props.filePath || isCheckingExternalChanges || showExternalChangeDialog || !isDirty) return;
    
    isCheckingExternalChanges = true;
    try {
      const hasChanged = await vaultStore.hasFileChangedExternally(props.filePath);
      if (hasChanged) {
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
    if (!props.filePath) return;
    
    try {
      const newContent = await readFile(props.filePath);
      
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
      props.onExternalChange?.(newContent);
      props.onChange?.(newContent);
      
      // Update tracked state in vaultStore
      const modifiedAt = await vaultStore.getFileModifiedTime(props.filePath);
      vaultStore.updateFileState(props.filePath, newContent, modifiedAt);
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

  // Minimal editor setup (replaces basicSetup)
  const minimalSetup: Extension[] = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    keymap.of(defaultKeymap),
    keymap.of(historyKeymap),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
  ];

  // Initialize CodeMirror
  onMount(() => {
    const extensions: Extension[] = [
      minimalSetup,
      markdown(),
      atelierTheme,
      saveKeymap,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          content = update.state.doc.toString();
          isDirty = true;
          saveError = null;
           props.onChange?.(content);
          // Auto-save: debounced 800ms after last keystroke
          if (props.filePath) {
            if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => saveContent(), 800);
          }
        }
      })
    ];

    const state = EditorState.create({
        doc: props.initialContent,
      extensions
    });

    editorView = new EditorView({
      state,
      parent: editorContainer
    });

    // Start external change detection polling (every 2 seconds)
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
    if (editorView && props.initialContent !== editorView.state.doc.toString()) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: props.initialContent
        }
      });
      content = props.initialContent;
      isDirty = false;
      saveError = null;
    }
  });

  // Save file
  async function saveContent() {
    if (!isDirty || isSaving || !props.filePath) return;
    
    isSaving = true;
    saveError = null;
    
    try {
      await writeFile(props.filePath, content);
      isDirty = false;
      props.onSave?.();
      
      // Update tracked modification time after save
      const modifiedAt = await vaultStore.getFileModifiedTime(props.filePath);
      vaultStore.updateFileState(props.filePath, content, modifiedAt);
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

  // Simple markdown preview
  function markdownToHtml(md: string): string {
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/gim, '<br>');
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
      {#if props.onClose}
        <button 
          class="action-btn"
          onclick={props.onClose}
        >
          Close
        </button>
      {/if}
      {#if !props.filePath}
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

  {#if saveError}
    <div class="error-banner">
      Failed to save: {saveError}
    </div>
  {/if}
</div>

<!-- External Change Detection Dialog -->
{#if showExternalChangeDialog}
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <h3>File Changed Externally</h3>
      </div>
      <div class="dialog-body">
        <p>This file has been modified outside of Atelier.</p>
        <p>Would you like to reload it from disk, or keep your current changes?</p>
      </div>
      <div class="dialog-footer">
        <button 
          class="action-btn"
          onclick={handleKeepCurrent}
        >
          Keep Current
        </button>
        <button 
          class="action-btn primary"
          onclick={handleReloadFromDisk}
        >
          Reload from Disk
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .markdown-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-canvas, #141414);
    color: var(--text-primary, #f5f2eb);
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
    background: var(--bg-panel, #1a1a1a);
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .file-name {
    font-weight: 500;
    font-size: 14px;
  }

  .save-status {
    font-size: 12px;
    color: var(--text-tertiary, #6b6b6b);
  }

  .save-status.dirty {
    color: var(--accent-primary, #b87333);
  }

  .save-status.error {
    color: var(--color-error, #ef4444);
  }

  .editor-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    padding: 6px 12px;
    border: 1px solid var(--border-subtle, #2a2a2a);
    background: var(--bg-panel-elevated, #252525);
    color: var(--text-secondary, #a0a0a0);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: var(--border-subtle);
    color: var(--text-primary, #f5f2eb);
  }

  .action-btn.active {
    background: var(--accent-subtle, rgba(184, 115, 51, 0.15));
    color: var(--accent-primary, #b87333);
    border-color: var(--accent-primary, #b87333);
  }

  .action-btn.primary {
    background: var(--accent-primary, #b87333);
    color: white;
    border-color: var(--accent-primary, #b87333);
  }

  .action-btn.primary:hover {
    background: var(--accent-hover, #c9843d);
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
    background: var(--bg-panel, #1a1a1a);
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
    background: var(--bg-panel-elevated, #252525);
    padding: 2px 6px;
    border-radius: var(--radius-sm, 3px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.9em;
  }

  .preview-content :global(pre) {
    background: var(--bg-panel-elevated, #252525);
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
    border-left: 3px solid var(--accent-primary);
    padding-left: 12px;
    margin-left: 0;
    margin-bottom: 12px;
    color: var(--text-secondary);
  }

  .preview-content :global(a) {
    color: var(--accent-primary);
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

  /* Dialog Styles */
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--bg-panel, #1a1a1a);
    border: 1px solid var(--border-subtle, #2a2a2a);
    border-radius: var(--radius-lg, 8px);
    min-width: 400px;
    max-width: 500px;
    box-shadow: var(--shadow-lg, 0 10px 40px rgba(0,0,0,0.5));
  }

  .dialog-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #f5f2eb);
  }

  .dialog-body {
    padding: 20px;
  }

  .dialog-body p {
    margin: 0 0 12px 0;
    color: var(--text-secondary, #a0a0a0);
    font-size: 14px;
    line-height: 1.5;
  }

  .dialog-body p:last-child {
    margin-bottom: 0;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--border-subtle, #2a2a2a);
  }
</style>
