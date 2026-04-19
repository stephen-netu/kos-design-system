<script lang="ts">
  import { Search } from '@lucide/svelte';
  import Input from '../../u0-primitives/input/Input.svelte';
  
  interface Props {
    value?: string;
    placeholder?: string;
    shortcut?: string;
    class?: string;
    disabled?: boolean;
    onsearch?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    placeholder = 'Search...',
    shortcut = '⌘K',
    class: className = '',
    disabled = false,
    onsearch
  }: Props = $props();

  let inputRef = $state<HTMLElement | null>(null);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      onsearch?.(value);
    }
  }

  // Handle global shortcut to focus
  function handleWindowKeydown(e: KeyboardEvent) {
    if (disabled) return;
    
    // Check for Cmd/Ctrl + K (or whatever the shortcut implies)
    // This is a simplified check; in a real app you'd parse `shortcut`
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const inputEl = inputRef?.querySelector('input');
      inputEl?.focus();
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="ds-searchbar {className}" bind:this={inputRef}>
  <Input
    type="search"
    bind:value
    {placeholder}
    {disabled}
    class="ds-search-input"
  >
    {#snippet iconLeading()}
      <Search size={16} />
    {/snippet}
    
    {#snippet iconTrailing()}
      {#if shortcut && !value}
        <div class="ds-search-shortcut">
          <kbd>{shortcut}</kbd>
        </div>
      {/if}
    {/snippet}
  </Input>
</div>

<style>
  .ds-searchbar {
    position: relative;
    width: 100%;
    max-width: 400px; /* Sensible default */
  }

  /* Make the input perfectly round the edges for a distinct search look */
  :global(.ds-search-input.ds-input-wrapper) {
    border-radius: var(--radius-full);
    background: var(--color-bg-app); /* Deep integration look by default */
  }

  .ds-search-shortcut {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ds-search-shortcut kbd {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--color-text-muted);
    background: var(--color-bg-panel);
    border: 1px solid var(--border-subtle);
    padding: 2px 6px;
    border-radius: var(--radius-sm, 4px);
    pointer-events: none;
    user-select: none;
  }
</style>
