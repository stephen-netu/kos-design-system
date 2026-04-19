<script lang="ts">
  /**
   * KeyboardShortcuts - Fabric Component
   * 
   * Keyboard shortcut display and binding visualization.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @kos/design-system/fabric/input
   * @adr 2026-04-12-leap-substrate-refactor-001
   */
  import { X, Command, CornerDownLeft } from '@lucide/svelte';

  export interface ShortcutBinding {
    key: string;
    modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
    description: string;
    scope?: string;
  }

  export interface ShortcutGroup {
    name: string;
    shortcuts: ShortcutBinding[];
  }

  interface Props {
    groups: ShortcutGroup[];
    isOpen: boolean;
    onClose: () => void;
    onShortcutClick?: (shortcut: ShortcutBinding) => void;
    searchable?: boolean;
    title?: string;
  }

  const props: Props = $props();

  let searchQuery = $state('');
  let searchInput: HTMLInputElement | null = $state(null);

  // Focus search when opened
  $effect(() => {
    if (props.isOpen && props.searchable && searchInput) {
      searchInput.focus();
    }
  });

  const filteredGroups = $derived(() => {
    if (!props.searchable || !searchQuery.trim()) return props.groups;

    const query = searchQuery.toLowerCase();
    return props.groups
      .map(group => ({
        ...group,
        shortcuts: group.shortcuts.filter(s =>
          s.description.toLowerCase().includes(query) ||
          s.key.toLowerCase().includes(query) ||
          formatBinding(s).toLowerCase().includes(query)
        )
      }))
      .filter(group => group.shortcuts.length > 0);
  });

  function formatBinding(shortcut: ShortcutBinding): string {
    const mods = (shortcut.modifiers || []).map(m => {
      switch (m) {
        case 'ctrl': return 'Ctrl';
        case 'alt': return 'Alt';
        case 'shift': return 'Shift';
        case 'meta': return '⌘';
        default: return m;
      }
    });
    return [...mods, shortcut.key.toUpperCase()].join(' + ');
  }

  function getPlatformSymbol(modifier: string): string {
    if (modifier === 'meta') return '⌘';
    return modifier.charAt(0).toUpperCase() + modifier.slice(1);
  }

  function handleKeydown(e: KeyboardEvent) {
    // Close on Escape
    if (e.key === 'Escape' && props.isOpen) {
      props.onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if props.isOpen}
  <div class="shortcuts-overlay" role="dialog" aria-modal="true" aria-label={props.title || 'Keyboard shortcuts'}>
    <div class="shortcuts-panel">
      <header class="panel-header">
        <h2 class="panel-title">{props.title || 'Keyboard shortcuts'}</h2>
        <button class="close-btn" onclick={props.onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      {#if props.searchable}
        <div class="search-box">
          <Command size={14} />
          <input
            bind:this={searchInput}
            type="text"
            placeholder="Search shortcuts..."
            bind:value={searchQuery}
            aria-label="Search shortcuts"
          />
          {#if searchQuery}
            <button class="clear-btn" onclick={() => searchQuery = ''} aria-label="Clear search">
              <X size={12} />
            </button>
          {/if}
        </div>
      {/if}

      <div class="shortcuts-content">
        {#each filteredGroups() as group}
          <section class="shortcut-group">
            <h3 class="group-title">{group.name}</h3>
            <ul class="shortcut-list" role="list">
              {#each group.shortcuts as shortcut}
                <li class="shortcut-item" role="listitem">
                  <button
                    class="shortcut-btn"
                    onclick={() => props.onShortcutClick?.(shortcut)}
                    title={shortcut.scope ? `Scope: ${shortcut.scope}` : undefined}
                  >
                    <span class="shortcut-keys">
                      {#each (shortcut.modifiers || []) as mod}
                        <kbd class="key mod">{getPlatformSymbol(mod)}</kbd>
                      {/each}
                      <kbd class="key">{shortcut.key.toUpperCase()}</kbd>
                    </span>
                    <span class="shortcut-desc">{shortcut.description}</span>
                    {#if shortcut.scope}
                      <span class="shortcut-scope">{shortcut.scope}</span>
                    {/if}
                  </button>
                </li>
              {/each}
            </ul>
          </section>
        {/each}

        {#if filteredGroups().length === 0}
          <div class="no-results">
            <CornerDownLeft size={24} />
            <p>No shortcuts found matching "{searchQuery}"</p>
          </div>
        {/if}
      </div>

      <footer class="panel-footer">
        <span class="hint">Press <kbd>Esc</kbd> to close</span>
      </footer>
    </div>
  </div>
{/if}

<style>
  .shortcuts-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  }

  .shortcuts-panel {
    width: min(560px, 90vw);
    max-height: 80vh;
    background: var(--color-bg-panel, #222222);
    border: 1px solid var(--border-default, #333333);
    border-radius: var(--radius-xl, 0.75rem);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
  }

  .panel-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary, #f2efe9);
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-tertiary, #706858);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm, 0.25rem);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, background 0.15s;
  }

  .close-btn:hover {
    color: var(--color-text-primary, #f2efe9);
    background: rgba(255, 255, 255, 0.05);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    color: var(--color-text-tertiary, #706858);
  }

  .search-box input {
    flex: 1;
    background: none;
    border: none;
    color: var(--color-text-primary, #f2efe9);
    font-size: 14px;
    outline: none;
  }

  .search-box input::placeholder {
    color: var(--color-text-tertiary, #706858);
  }

  .clear-btn {
    background: none;
    border: none;
    color: var(--color-text-tertiary, #706858);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-sm, 0.25rem);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clear-btn:hover {
    color: var(--color-text-secondary, #a09880);
  }

  .shortcuts-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .shortcut-group {
    margin-bottom: 24px;
  }

  .group-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-tertiary, #706858);
    margin: 0 0 12px 0;
  }

  .shortcut-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .shortcut-item {
    margin: 0;
  }

  .shortcut-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 12px;
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-md, 0.375rem);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s, border-color 0.15s;
  }

  .shortcut-btn:hover {
    background: var(--color-bg-canvas, #1a1a1a);
    border-color: var(--border-subtle, rgba(255,255,255,0.06));
  }

  .shortcut-keys {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 100px;
  }

  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    background: var(--color-bg-canvas, #1a1a1a);
    border: 1px solid var(--border-default, #333333);
    border-radius: var(--radius-sm, 0.25rem);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-secondary, #a09880);
  }

  .key.mod {
    min-width: 28px;
  }

  .shortcut-desc {
    flex: 1;
    font-size: 13px;
    color: var(--color-text-primary, #f2efe9);
  }

  .shortcut-scope {
    font-size: 10px;
    padding: 2px 6px;
    background: var(--color-bg-canvas, #1a1a1a);
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--color-text-tertiary, #706858);
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    color: var(--color-text-tertiary, #706858);
  }

  .no-results p {
    font-size: 13px;
    margin: 0;
  }

  .panel-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    background: var(--color-bg-canvas, #1a1a1a);
  }

  .hint {
    font-size: 12px;
    color: var(--color-text-tertiary, #706858);
  }

  .hint kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 4px;
    margin: 0 2px;
    background: var(--color-bg-panel, #222222);
    border: 1px solid var(--border-default, #333333);
    border-radius: var(--radius-sm, 0.25rem);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 10px;
  }
</style>
