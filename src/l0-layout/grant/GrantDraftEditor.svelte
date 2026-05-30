<script lang="ts">
  import TextArea from '../../f0-forms/textarea/TextArea.svelte';

  interface DraftSection {
    name: string;
    content: string;
    word_count: number;
    complete: boolean;
  }

  interface ReviewerNote {
    author: string;
    section: string | null;
    content: string;
    resolved: boolean;
    created_at: number;
  }

  interface Props {
    sections: DraftSection[];
    reviewerNotes: ReviewerNote[];
    status: string;
    loading?: boolean;
    class?: string;
    onSectionEdit?: (sectionName: string, content: string) => void;
    onAddNote?: (section: string | null, content: string) => void;
    onToggleComplete?: (sectionName: string) => void;
    onStatusChange?: (status: string) => void;
  }

  let {
    sections,
    reviewerNotes,
    status,
    loading = false,
    class: className = '',
    onSectionEdit,
    onAddNote,
    onToggleComplete,
    onStatusChange,
  }: Props = $props();

  let editingSection = $state<string | null>(null);
  let editContent = $state('');
  let noteSection = $state('');
  let noteContent = $state('');

  let progress = $derived(() => {
    if (!sections.length) return 0;
    const done = sections.filter(s => s.complete).length;
    return Math.round((done / sections.length) * 100);
  });

  function startEdit(section: DraftSection) {
    editingSection = section.name;
    editContent = section.content;
  }

  function cancelEdit() {
    editingSection = null;
    editContent = '';
  }

  function saveEdit() {
    if (editingSection && onSectionEdit) {
      onSectionEdit(editingSection, editContent);
    }
    editingSection = null;
    editContent = '';
  }

  function submitNote() {
    if (onAddNote && noteContent.trim()) {
      onAddNote(noteSection || null, noteContent);
      noteContent = '';
      noteSection = '';
    }
  }

  function formatDate(ts: number): string {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
</script>

<div class="ds-draft-editor {className}">
  <div class="ds-draft-editor-progress">
    <div class="ds-draft-progress-bar">
      <div class="ds-draft-progress-fill" style="width: {progress()}%"></div>
    </div>
    <span class="ds-draft-progress-label">{progress()}% complete</span>
  </div>

  <div class="ds-draft-editor-sections">
    {#each sections as section (section.name)}
      <div class="ds-draft-section">
        <div class="ds-draft-section-header">
          <h4 class="ds-draft-section-title">
            {section.name}
            {#if section.complete}
              <span class="ds-draft-section-check" title="Complete">✓</span>
            {/if}
          </h4>
          <span class="ds-draft-section-words">{section.word_count} words</span>
        </div>

        {#if editingSection === section.name}
          <TextArea
            bind:value={editContent}
            rows={8}
            class="ds-draft-section-editor"
          />
          <div class="ds-draft-section-actions">
            <button class="ds-draft-btn-secondary" class:disabled={loading} onclick={cancelEdit}>Cancel</button>
            <button class="ds-draft-btn-primary" class:disabled={loading} onclick={saveEdit}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        {:else}
          <p class="ds-draft-section-preview">
            {section.content || 'No content yet.'}
          </p>
          {#if onSectionEdit}
            <button
              class="ds-draft-btn-secondary"
              onclick={() => startEdit(section)}
            >
              Edit
            </button>
          {/if}
          {#if onToggleComplete}
            <button
              class="ds-draft-btn-secondary"
              onclick={() => onToggleComplete(section.name)}
            >
              {section.complete ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
          {/if}
        {/if}
      </div>
    {/each}
  </div>

  <div class="ds-draft-editor-notes">
    <h3 class="ds-draft-notes-header">Reviewer Notes</h3>

    {#if reviewerNotes.length}
      {#each reviewerNotes as note (note.created_at)}
        <div class="ds-draft-note" class:is-resolved={note.resolved}>
          <div class="ds-draft-note-meta">
            <span class="ds-draft-note-author">{note.author}</span>
            {#if note.section}
              <span class="ds-draft-note-target">on {note.section}</span>
            {/if}
            <span class="ds-draft-note-date">{formatDate(note.created_at)}</span>
            {#if note.resolved}
              <span class="ds-draft-note-resolved">Resolved</span>
            {/if}
          </div>
          <p class="ds-draft-note-content">{note.content}</p>
        </div>
      {/each}
    {:else}
      <p class="ds-draft-notes-empty">No reviewer notes yet.</p>
    {/if}

    {#if onAddNote}
      <div class="ds-draft-add-note">
        <h4 class="ds-draft-add-note-title">Add Note</h4>
        <input
          type="text"
          class="ds-draft-note-input"
          placeholder="Section (optional)…"
          bind:value={noteSection}
        />
        <TextArea
          bind:value={noteContent}
          rows={3}
          placeholder="Write a note…"
        />
        <button
          class="ds-draft-btn-primary"
          class:disabled={loading || !noteContent.trim()}
          onclick={submitNote}
        >
          Add Note
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .ds-draft-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 720px;
  }

  .ds-draft-editor-progress {
    position: relative;
  }

  .ds-draft-progress-bar {
    height: 6px;
    background: var(--color-bg-panel-elevated);
    border-radius: 3px;
    overflow: hidden;
  }

  .ds-draft-progress-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 3px;
    transition: width var(--transition-normal);
  }

  .ds-draft-progress-label {
    position: absolute;
    right: 0;
    top: -18px;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .ds-draft-editor-sections {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .ds-draft-section {
    padding: var(--space-4);
    background: var(--color-bg-panel-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
  }

  .ds-draft-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }

  .ds-draft-section-title {
    font-size: var(--text-sm);
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .ds-draft-section-check {
    color: var(--color-success);
    font-weight: 700;
  }

  .ds-draft-section-words {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .ds-draft-section-preview {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-2);
    white-space: pre-wrap;
    line-height: 1.4;
    max-height: 80px;
    overflow: hidden;
  }

  .ds-draft-section-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }

  .ds-draft-btn-primary {
    background: var(--color-accent);
    border: none;
    border-radius: var(--radius-sm);
    color: #111;
    cursor: pointer;
    font-size: var(--text-sm);
    font-weight: 600;
    padding: 5px 12px;
  }

  .ds-draft-btn-primary.disabled {
    opacity: 0.5;
    cursor: default;
  }

  .ds-draft-btn-secondary {
    background: transparent;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    cursor: pointer;
    font-size: var(--text-sm);
    font-weight: 500;
    padding: 5px 10px;
    margin-right: var(--space-1);
  }

  .ds-draft-btn-secondary:hover {
    background: var(--color-bg-panel-elevated);
  }

  .ds-draft-btn-secondary.disabled {
    opacity: 0.5;
    cursor: default;
  }

  .ds-draft-editor-notes {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .ds-draft-notes-header {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-accent);
    margin: 0;
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-default);
  }

  .ds-draft-note {
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-panel-elevated);
    border-left: 3px solid var(--color-warning);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  .ds-draft-note.is-resolved {
    border-left-color: var(--color-success);
    opacity: 0.7;
  }

  .ds-draft-note-meta {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    margin-bottom: var(--space-1);
    font-size: var(--text-xs);
  }

  .ds-draft-note-author {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .ds-draft-note-target {
    color: var(--color-accent);
  }

  .ds-draft-note-date {
    color: var(--color-text-muted);
    margin-left: auto;
  }

  .ds-draft-note-resolved {
    color: var(--color-success);
    font-weight: 600;
  }

  .ds-draft-note-content {
    font-size: var(--text-sm);
    margin: 0;
    white-space: pre-wrap;
    color: var(--color-text-secondary);
  }

  .ds-draft-notes-empty {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-style: italic;
  }

  .ds-draft-add-note {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-default);
  }

  .ds-draft-add-note-title {
    font-size: var(--text-sm);
    font-weight: 600;
    margin: 0;
  }

  .ds-draft-note-input {
    background: var(--color-bg-panel-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-3);
    width: 100%;
  }
</style>
