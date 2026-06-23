<script lang="ts">
  import { untrack } from 'svelte';
  import { EditorView } from '@codemirror/view';
  import FindReplaceDialog from './FindReplaceDialog.svelte';
  import CorrectionTooltip from './components/CorrectionTooltip.svelte';
  import ExternalChangeDialog from './ExternalChangeDialog.svelte';
  import DOMPurify from 'dompurify';
  import { markdownToHtml } from './markdown-preview';
  import { useCodeMirror } from './useCodeMirror';
  import { useFilePersistence } from './useFilePersistence';
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

  interface ActiveCorrection extends SpellCheckCorrection { from: number; to: number; }

  let { filePath, initialContent, onChange, onSave, onClose, onExternalChange, completionSource, spellCheckDictionary }: Props = $props();
  let content = $state(untrack(() => initialContent));
  let isDirty = $state(false);
  let isSaving = $state(false);
  let saveError = $state<string | null>(null);
  let showPreview = $state(false);
  let showFindReplace = $state(false);
  let showExternalChangeDialog = $state(false);
  let activeCorrection = $state<ActiveCorrection | null>(null);
  let editorContainer: HTMLDivElement;
  let editorView = $state<EditorView | null>(null);
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  let stopExternalChangeMonitoring: (() => void) | null = null;
  let lastKnownMtimeMs = $state<number | null>(null);
  let isCheckingExternalChanges = $state(false);

  const filePersistence = useFilePersistence({
    getFilePath: () => filePath,
    getContent: () => content,
    getIsDirty: () => isDirty,
    getIsSaving: () => isSaving,
    getIsCheckingExternalChanges: () => isCheckingExternalChanges,
    getShowExternalChangeDialog: () => showExternalChangeDialog,
    getLastKnownMtimeMs: () => lastKnownMtimeMs,
    getEditorView: () => editorView,
    setContent: (value) => { content = value; },
    setIsDirty: (value) => { isDirty = value; },
    setIsSaving: (value) => { isSaving = value; },
    setSaveError: (value) => { saveError = value; },
    setShowExternalChangeDialog: (value) => { showExternalChangeDialog = value; },
    setIsCheckingExternalChanges: (value) => { isCheckingExternalChanges = value; },
    setLastKnownMtimeMs: (value) => { lastKnownMtimeMs = value; },
    onChange: (value) => onChange?.(value),
    onSave: () => onSave?.(),
    onExternalChange: (value) => onExternalChange?.(value)
  });

  const codeMirror = useCodeMirror({
    getContainer: () => editorContainer,
    getInitialContent: () => initialContent,
    completionSource: () => completionSource,
    spellCheckDictionary: () => spellCheckDictionary,
    onCorrectionClick: (correction, _view, from, to) => { activeCorrection = { ...correction, from, to }; },
    onSave: filePersistence.saveContent,
    onFind: () => openFindReplace(),
    onFindReplace: () => openFindReplace(),
    onDocChanged: handleDocChanged,
    onEditorReady: (view) => {
      editorView = view;
      stopExternalChangeMonitoring = filePersistence.startExternalChangeMonitoring();
    },
    onEditorDestroy: () => {
      editorView = null;
      if (autoSaveTimeout) { clearTimeout(autoSaveTimeout); autoSaveTimeout = null; }
      stopExternalChangeMonitoring?.();
      stopExternalChangeMonitoring = null;
    }
  });

  let fileName = $derived(filePath?.split('/').pop() || filePath || 'Untitled');
  let saveStatus = $derived(isSaving ? 'Saving...' : saveError ? 'Error!' : filePath && !filePersistence.persistenceAvailable ? 'Not persisted' : isDirty ? 'Unsaved' : 'Saved');

  function openFindReplace() {
    showFindReplace = true;
  }

  function closeFindReplace() {
    showFindReplace = false;
    codeMirror.focus();
  }

  function handleDocChanged(newContent: string) {
    content = newContent;
    activeCorrection = null;
    isDirty = true;
    saveError = null;
    onChange?.(newContent);
    if (!filePath) return;
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => { void filePersistence.saveContent(); }, 800);
  }

  function handleAcceptCorrection(suggestion: string) {
    if (!activeCorrection || !editorView) return;
    editorView.dispatch({ changes: { from: activeCorrection.from, to: activeCorrection.to, insert: suggestion } });
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

  function handleKeepCurrent() {
    filePersistence.keepCurrent();
  }

  function togglePreview() {
    showPreview = !showPreview;
  }

  $effect(() => {
    if (editorView) {
      codeMirror.syncContent(initialContent);
      content = initialContent;
      isDirty = false;
      saveError = null;
    }
  });
</script>

<div class="markdown-editor" data-testid="markdown-editor">
  <div class="editor-header" data-testid="editor-header">
    <div class="file-info">
      <span class="file-name" data-testid="editor-filename">{fileName}</span>
      <span class="save-status" class:dirty={isDirty} class:error={!!saveError} data-testid="save-status">{saveStatus}</span>
    </div>
    <div class="editor-actions">
      <button class="action-btn" class:active={showPreview} onclick={togglePreview}>Preview</button>
      {#if onClose}<button class="action-btn" onclick={onClose}>Close</button>{/if}
      {#if filePath && filePersistence.persistenceAvailable}
        <button class="action-btn primary" onclick={filePersistence.saveContent} disabled={!isDirty || isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
      {/if}
    </div>
  </div>
  <div class="editor-body" class:split={showPreview}>
    <div class="editor-pane" bind:this={editorContainer}>
      <FindReplaceDialog {editorView} isOpen={showFindReplace} onClose={closeFindReplace} />
    </div>
    {#if showPreview}
      <div class="preview-pane"><div class="preview-content">{@html DOMPurify.sanitize(markdownToHtml(content))}</div></div>
    {/if}
  </div>
  {#if activeCorrection}
    <CorrectionTooltip correction={{ original: activeCorrection.original, suggestions: activeCorrection.suggestions }} position={activeCorrection.position} onAccept={handleAcceptCorrection} onDismiss={handleDismissCorrection} onAddToDictionary={handleAddWordToDictionary} />
  {/if}
  {#if saveError}<div class="error-banner">Failed to save: {saveError}</div>{/if}
</div>
{#if showExternalChangeDialog}<ExternalChangeDialog onReload={filePersistence.reloadFromDisk} onKeepCurrent={handleKeepCurrent} />{/if}

  <!-- svelte-ignore css_unused_selector -->
  <style>
.markdown-editor{display:flex;flex-direction:column;height:100%;background:var(--color-bg-canvas,#141414);color:var(--color-text-primary,#f5f2eb)}.editor-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border-subtle,#2a2a2a);background:var(--color-bg-panel,#1a1a1a)}.file-info{display:flex;align-items:center;gap:var(--space-3)}.file-name{font-weight:500;font-size:14px}.save-status{font-size:12px;color:var(--color-text-tertiary,#6b6b6b)}.save-status.dirty{color:var(--color-accent)}.save-status.error{color:var(--color-error,#ef4444)}.editor-actions{display:flex;gap:var(--space-2)}.action-btn{padding:6px 12px;border:1px solid var(--border-subtle,#2a2a2a);background:var(--color-bg-panel-elevated,#252525);color:var(--color-text-secondary,#a0a0a0);border-radius:var(--radius-sm,4px);cursor:pointer;font-size:13px;transition:all .15s ease}.action-btn:hover{background:var(--border-subtle);color:var(--color-text-primary,#f5f2eb)}.action-btn.active{background:var(--color-accent-subtle);color:var(--color-accent);border-color:var(--color-accent)}.action-btn.primary{background:var(--color-accent);color:white;border-color:var(--color-accent)}.action-btn.primary:hover{background:var(--color-accent-hover,#c9843d)}.action-btn:disabled{opacity:.5;cursor:not-allowed}.editor-body{display:flex;flex:1;overflow:hidden}.editor-body.split>:is(.editor-pane,.preview-pane){flex:1;width:50%}.editor-pane{flex:1;overflow:hidden;position:relative}:global(.cm-editor){height:100%}:global(.cm-scroller){overflow:auto}.preview-pane{border-left:1px solid var(--border-subtle,#2a2a2a);overflow-y:auto;background:var(--color-bg-panel,#1a1a1a)}.preview-content{padding:16px;font-size:14px;line-height:1.6}.preview-content :is(h1,h2,h3){margin-top:0;margin-bottom:16px}.preview-content p,.preview-content ul,.preview-content ol,.preview-content blockquote{margin-bottom:12px}.preview-content ul,.preview-content ol{padding-left:24px}.preview-content li{margin-bottom:4px}.preview-content code{background:var(--color-bg-panel-elevated,#252525);padding:2px 6px;border-radius:var(--radius-sm,3px);font-family:var(--font-mono,'JetBrains Mono',monospace);font-size:.9em}.preview-content pre{background:var(--color-bg-panel-elevated,#252525);padding:12px;border-radius:var(--radius-md,6px);overflow-x:auto;margin-bottom:12px}.preview-content pre code{background:none;padding:0}.preview-content blockquote{border-left:3px solid var(--color-accent);padding-left:12px;margin-left:0;color:var(--color-text-secondary)}.preview-content a{color:var(--color-accent);text-decoration:none}.preview-content a:hover{text-decoration:underline}.error-banner{padding:8px 16px;background:var(--color-error,#ef4444);color:white;font-size:13px}
</style>
