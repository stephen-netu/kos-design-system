<script lang="ts">
  /**
   * FileTree - Fabric Component
   *
   * Hierarchical file browser tree with expand/collapse and selection.
   * Decoupled from shell stores — uses props/callbacks for all state.
   *
   * @package @stephen-netu/design-system/fabric/data
   */
  import Self from './FileTree.svelte';
  import { ChevronRight, FileText, Folder } from '@lucide/svelte';

  export interface FileEntry {
    id: string;
    name: string;
    type: 'file' | 'directory';
    path: string;
    children?: FileEntry[];
    isExpanded?: boolean;
    isSelected?: boolean;
  }

  interface Props {
    items: FileEntry[];
    onFileSelect: (entry: FileEntry) => void;
    onDirectoryToggle?: (entry: FileEntry, expanded: boolean) => void;
    class?: string;
  }

  let { items, onFileSelect, onDirectoryToggle, class: className = '' }: Props = $props();

  let expandedPaths = $state<Set<string>>(new Set());
  let selectedPath = $state<string | null>(null);

  function handleToggle(entry: FileEntry) {
    if (entry.type !== 'directory') return;

    const next = new Set(expandedPaths);
    if (next.has(entry.path)) {
      next.delete(entry.path);
    } else {
      next.add(entry.path);
    }
    expandedPaths = next;
    onDirectoryToggle?.(entry, next.has(entry.path));
  }

  function handleSelect(entry: FileEntry) {
    if (entry.type === 'file') {
      selectedPath = entry.path;
    }
    onFileSelect(entry);
  }

  function isExpanded(entry: FileEntry): boolean {
    return entry.isExpanded ?? expandedPaths.has(entry.path);
  }

  function isSelected(entry: FileEntry): boolean {
    return entry.isSelected ?? selectedPath === entry.path;
  }

  function handleChevronKeydown(entry: FileEntry, e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      e.preventDefault();
      handleToggle(entry);
    }
  }
</script>

<div class="file-tree {className}">
  {#each items as entry (entry.id)}
    <div class="file-tree__node">
      <button
        class="file-tree__row"
        class:file-tree__row--directory={entry.type === 'directory'}
        class:file-tree__row--selected={isSelected(entry)}
        onclick={() => handleSelect(entry)}
        aria-expanded={entry.type === 'directory' ? isExpanded(entry) : undefined}
        aria-current={isSelected(entry) ? 'true' : undefined}
      >
        {#if entry.type === 'directory'}
          <span
            class="file-tree__chevron"
            class:file-tree__chevron--open={isExpanded(entry)}
            onclick={(e) => { e.stopPropagation(); handleToggle(entry); }}
            onkeydown={(e) => handleChevronKeydown(entry, e)}
            role="button"
            tabindex="0"
            aria-label={isExpanded(entry) ? 'Collapse directory' : 'Expand directory'}
          >
            <ChevronRight size={12} />
          </span>
          <Folder size={14} class="file-tree__icon file-tree__icon--folder" />
        {:else}
          <span class="file-tree__spacer"></span>
          <FileText size={14} class="file-tree__icon file-tree__icon--file" />
        {/if}
        <span class="file-tree__name">{entry.name}</span>
      </button>

      {#if entry.type === 'directory' && entry.children && isExpanded(entry)}
        <div class="file-tree__children" role="group">
          <Self items={entry.children} {onFileSelect} {onDirectoryToggle} />
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .file-tree {
    font-size: 13px;
    line-height: 1.4;
    color: var(--color-text-primary);
    user-select: none;
  }

  .file-tree__node {
    margin: 0;
  }

  .file-tree__row {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    width: 100%;
    padding: 2px 8px;
    background: transparent;
    border: none;
    border-radius: 0;
    color: var(--color-text-secondary);
    cursor: pointer;
    text-align: left;
    font: inherit;
    transition: background var(--transition-fast, 110ms) linear, color var(--transition-fast, 110ms) linear;
  }

  .file-tree__row:hover {
    background: var(--color-bg-panel);
    color: var(--color-text-primary);
  }

  .file-tree__row--selected {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
    box-shadow: inset 2px 0 0 var(--color-accent);
  }

  .file-tree__chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: transform var(--transition-fast, 110ms) linear;
    flex-shrink: 0;
  }

  .file-tree__chevron--open {
    transform: rotate(90deg);
    color: var(--color-accent);
  }

  .file-tree__spacer {
    display: block;
    width: 14px;
    flex-shrink: 0;
  }

  .file-tree__icon {
    flex-shrink: 0;
  }

  .file-tree__icon--folder {
    color: var(--color-accent-muted, var(--color-accent));
  }

  .file-tree__icon--file {
    color: var(--color-text-tertiary);
  }

  .file-tree__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-tree__children {
    padding-left: 16px;
  }
</style>
