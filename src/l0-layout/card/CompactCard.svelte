<script lang="ts">
  import Card from '../../u0-primitives/card/Card.svelte';
  import Button from '../../u0-primitives/button/Button.svelte';
  import RsvpReader from '../../u0-primitives/rsvp/RsvpReader.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    abstract?: string;
    content: string;
    maxPreviewChars?: number;
    class?: string;
  }

  let {
    title,
    abstract = '',
    content,
    maxPreviewChars = 120,
    class: className = ''
  }: Props = $props();

  let isHovered = $state(false);
  let showRsvp = $state(false);

  // Only show RSVP trigger if content exceeds preview threshold
  let hasMoreContent = $derived(content.length > maxPreviewChars);
  let previewText = $derived(
    hasMoreContent 
      ? content.slice(0, maxPreviewChars) + '…' 
      : content
  );
</script>

<Card 
  class={`ds-compact-card ${className}`}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => { isHovered = false; showRsvp = false; }}
>
  {#if title}
    <header class="ds-card-header">
      <h3 class="ds-card-title">{title}</h3>
    </header>
  {/if}
  
  <div class="ds-card-content">
    {#if abstract}
      <p class="ds-text-secondary">{abstract}</p>
    {/if}
    
    <p class="ds-card-preview">{previewText}</p>
    
    {#if isHovered && hasMoreContent}
      <div class="rsvp-trigger mt-3">
        <Button 
          variant="ghost" 
          size="sm"
          onclick={() => showRsvp = !showRsvp}
          class="w-full"
        >
          {showRsvp ? '✕ Close' : '⚡ Rapid Read'}
        </Button>
      </div>
    {/if}
  </div>
  
  {#if showRsvp}
    <div class="rsvp-overlay mt-4" style="max-height: 400px; overflow-y: auto;">
      <RsvpReader 
        mode="preview"
        text={content}
        initialWpm={250}
        maxWpm={600}
        onComplete={() => showRsvp = false}
      />
    </div>
  {/if}
</Card>

<style>
  .ds-compact-card {
    transition: box-shadow var(--transition-normal);
  }
  
  .ds-compact-card:hover {
    box-shadow: var(--shadow-card-hover);
  }
  
  .rsvp-trigger {
    display: flex;
    justify-content: center;
  }
  
  .rsvp-overlay {
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    background: var(--color-bg-panel-elevated);
  }
  
  .ds-card-preview {
    line-height: 1.5;
    color: var(--color-text-secondary);
  }
  
  /* Hide overflow preview text when not hovered */
  .ds-compact-card:hover .ds-card-preview {
    max-height: 4.5rem; /* ~3 lines */
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
  }
</style>