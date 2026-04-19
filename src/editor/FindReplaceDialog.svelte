<!--
  FindReplaceDialog - Full implementation with CodeMirror 6 search integration

  Provides find/replace functionality with:
  - Find next/previous navigation
  - Replace single match
  - Replace all matches
  - Case-sensitive search option
  - Match highlighting via CodeMirror search extension
  - Keyboard shortcuts (Enter to find next, Shift+Enter for previous)
-->
<script lang="ts">
  import { EditorView } from '@codemirror/view';
  import {
    openSearchPanel,
    closeSearchPanel,
    findNext,
    findPrevious,
    replaceNext,
    replaceAll,
    setSearchQuery,
    search,
    getSearchQuery
  } from '@codemirror/search';
  import { SearchQuery } from '@codemirror/search';
  import { onMount, tick } from 'svelte';

  interface Props {
    editorView: EditorView | null;
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'find' | 'replace';
  }

  let {
    editorView,
    isOpen,
    onClose,
    initialMode = 'find'
  }: Props = $props();

  // State
  let findQuery = $state('');
  let replaceQuery = $state('');
  let caseSensitive = $state(false);
  let showReplace = $derived(initialMode === 'replace');
  let matchCount = $state(0);
  let currentMatchIndex = $state(0);
  let findInput: HTMLInputElement | null = $state(null);
  let replaceInput: HTMLInputElement | null = $state(null);
  let noMatches = $state(false);

  // Focus find input when opened
  $effect(() => {
    if (isOpen) {
      tick().then(() => {
        findInput?.focus();
        findInput?.select();
      });
    }
  });

  // Update search query in CodeMirror when findQuery changes
  $effect(() => {
    if (editorView && isOpen) {
      updateSearchQuery();
    }
  });

  // Update search when case sensitivity changes
  $effect(() => {
    if (editorView && isOpen && findQuery) {
      updateSearchQuery();
    }
  });

  function updateSearchQuery() {
    if (!editorView) return;

    const query = new SearchQuery({
      search: findQuery,
      replace: replaceQuery,
      caseSensitive: caseSensitive,
      literal: true,
      regexp: false,
      wholeWord: false
    });

    editorView.dispatch({ effects: setSearchQuery.of(query) });
    updateMatchCount();
  }

  function updateMatchCount() {
    if (!editorView || !findQuery) {
      matchCount = 0;
      currentMatchIndex = 0;
      noMatches = false;
      return;
    }

    const query = getSearchQuery(editorView.state);
    if (!query.valid) {
      matchCount = 0;
      noMatches = false;
      return;
    }

    let count = 0;
    let currentIndex = 0;
    const cursor = query.getCursor(editorView.state);
    const currentSelection = editorView.state.selection.main;

    let pos = cursor.next();
    while (!pos.done) {
      count++;
      // Check if this match contains the current selection
      if (pos.value.from <= currentSelection.from && pos.value.to >= currentSelection.to) {
        currentIndex = count;
      }
      pos = cursor.next();
    }

    matchCount = count;
    currentMatchIndex = currentIndex;
    noMatches = count === 0 && findQuery.length > 0;
  }

  function handleFindNext() {
    if (!editorView || !findQuery) return;

    findNext(editorView);
    updateMatchCount();
  }

  function handleFindPrevious() {
    if (!editorView || !findQuery) return;

    findPrevious(editorView);
    updateMatchCount();
  }

  function handleReplace() {
    if (!editorView || !findQuery) return;

    replaceNext(editorView);
    updateMatchCount();
  }

  function handleReplaceAll() {
    if (!editorView || !findQuery) return;

    const initialMatches = matchCount;
    replaceAll(editorView);
    updateMatchCount();

    // Show feedback
    if (initialMatches > 0) {
      matchCount = 0;
      currentMatchIndex = 0;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (event.shiftKey) {
        handleFindPrevious();
      } else {
        if (showReplace && document.activeElement === replaceInput && replaceQuery) {
          handleReplace();
        } else {
          handleFindNext();
        }
      }
    } else if (event.key === 'Tab') {
      if (showReplace) {
        event.preventDefault();
        if (document.activeElement === findInput) {
          replaceInput?.focus();
        } else {
          findInput?.focus();
        }
      }
    }
  }

  function handleClose() {
    if (editorView) {
      // Clear search query
      editorView.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: '' })) });
    }
    findQuery = '';
    replaceQuery = '';
    noMatches = false;
    onClose();
  }

  function toggleReplaceMode() {
    showReplace = !showReplace;
    tick().then(() => {
      findInput?.focus();
    });
  }

  function toggleCaseSensitive() {
    caseSensitive = !caseSensitive;
  }
</script>

{#if isOpen}
  <div class="find-replace-dialog" role="dialog" aria-modal="true" aria-label={showReplace ? 'Find and replace' : 'Find'} onkeydown={handleKeyDown}>
    <div class="dialog-header">
      <span class="dialog-title">{showReplace ? 'Find and Replace' : 'Find'}</span>
      <button class="close-btn" onclick={handleClose} aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="dialog-body">
      <div class="input-row">
        <input
          bind:this={findInput}
          type="text"
          class="find-input"
          class:no-match={noMatches}
          placeholder="Find..."
          bind:value={findQuery}
        />
        <button
          class="case-btn"
          class:active={caseSensitive}
          onclick={toggleCaseSensitive}
          title="Match case"
          aria-label="Toggle case sensitivity"
        >
          Aa
        </button>
      </div>

      {#if showReplace}
        <div class="input-row">
          <input
            bind:this={replaceInput}
            type="text"
            class="replace-input"
            placeholder="Replace with..."
            bind:value={replaceQuery}
          />
        </div>
      {/if}

      {#if matchCount > 0}
        <div class="match-info">
          {currentMatchIndex} of {matchCount} match{matchCount !== 1 ? 'es' : ''}
        </div>
      {:else if noMatches}
        <div class="match-info no-match">No matches</div>
      {/if}

      <div class="button-row">
        <div class="nav-buttons">
          <button class="nav-btn" onclick={handleFindPrevious} title="Previous match (Shift+Enter)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10 4L5 7L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="nav-btn" onclick={handleFindNext} title="Next match (Enter)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 4L9 7L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        {#if showReplace}
          <div class="replace-buttons">
            <button
              class="action-btn secondary"
              onclick={handleReplace}
              disabled={!findQuery || matchCount === 0}
            >
              Replace
            </button>
            <button
              class="action-btn primary"
              onclick={handleReplaceAll}
              disabled={!findQuery || matchCount === 0}
            >
              Replace All
            </button>
          </div>
        {:else}
          <button class="mode-toggle" onclick={toggleReplaceMode}>
            Replace...
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .find-replace-dialog {
    position: absolute;
    top: 10px;
    right: 10px;
    background: var(--bg-panel, #252525);
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
    border-radius: 8px;
    padding: 0;
    z-index: 100;
    min-width: 320px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  }

  .dialog-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary, #e8e6e3);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary, #a0a0a0);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: var(--bg-canvas, #1a1a1a);
    color: var(--text-primary, #e8e6e3);
  }

  .dialog-body {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .input-row {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  input {
    flex: 1;
    background: var(--bg-canvas, #1a1a1a);
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    padding: 8px 12px;
    color: var(--text-primary, #e8e6e3);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;
  }

  input:focus {
    border-color: var(--accent-primary, #b87333);
  }

  input.no-match {
    border-color: var(--color-error, #ef4444);
    background: rgba(239, 68, 68, 0.1);
  }

  input::placeholder {
    color: var(--text-tertiary, #6b6b6b);
  }

  .case-btn {
    background: var(--bg-canvas, #1a1a1a);
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    padding: 8px 10px;
    color: var(--text-secondary, #a0a0a0);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .case-btn:hover {
    border-color: var(--accent-primary, #b87333);
    color: var(--text-primary, #e8e6e3);
  }

  .case-btn.active {
    background: var(--accent-primary, #b87333);
    border-color: var(--accent-primary, #b87333);
    color: white;
  }

  .match-info {
    font-size: 12px;
    color: var(--text-secondary, #a0a0a0);
    padding: 0 2px;
  }

  .match-info.no-match {
    color: var(--color-error, #ef4444);
  }

  .button-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 6px;
  }

  .nav-buttons {
    display: flex;
    gap: 4px;
  }

  .nav-btn {
    background: var(--bg-canvas, #1a1a1a);
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    padding: 6px 8px;
    color: var(--text-secondary, #a0a0a0);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--accent-subtle, rgba(184, 115, 51, 0.15));
    border-color: var(--accent-primary, #b87333);
    color: var(--accent-primary, #b87333);
  }

  .nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .replace-buttons {
    display: flex;
    gap: 6px;
  }

  .action-btn {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }

  .action-btn.secondary {
    background: var(--bg-canvas, #1a1a1a);
    border-color: var(--border-subtle, rgba(255, 255, 255, 0.1));
    color: var(--text-secondary, #a0a0a0);
  }

  .action-btn.secondary:hover:not(:disabled) {
    border-color: var(--accent-primary, #b87333);
    color: var(--text-primary, #e8e6e3);
  }

  .action-btn.primary {
    background: var(--accent-primary, #b87333);
    border-color: var(--accent-primary, #b87333);
    color: white;
  }

  .action-btn.primary:hover:not(:disabled) {
    background: var(--accent-hover, #c9843d);
    border-color: var(--accent-hover, #c9843d);
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .mode-toggle {
    background: none;
    border: none;
    color: var(--accent-primary, #b87333);
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.15s ease;
  }

  .mode-toggle:hover {
    background: var(--accent-subtle, rgba(184, 115, 51, 0.15));
  }
</style>
