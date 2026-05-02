<script lang="ts">
  import Button from '../button/Button.svelte';
  import { segmentForRsvp, calculateOrp, getWordDisplayTime, type RsvpWord } from './rsvp-utils';

  let { 
    text = '',
    mode = 'preview',
    initialWpm = 300,
    maxWpm = mode === 'preview' ? 600 : 1000,
    autoStart = false,
    onComplete = () => {},
    onPause = () => {}
  }: {
    text?: string;
    mode?: 'preview' | 'full';
    initialWpm?: number;
    maxWpm?: number;
    autoStart?: boolean;
    onComplete?: () => void;
    onPause?: () => void;
  } = $props();

  let isPlaying = $state(false);
  let currentWpm = $state(initialWpm);
  let wordIndex = $state(0);
  let words: RsvpWord[] = $derived(segmentForRsvp(text));
  
  // Bounds-safe current word with fallback
  let currentWord = $derived(words[wordIndex] || { 
    text: '', 
    prefix: '', 
    pivot: '', 
    suffix: '' 
  });
  
  let orpPosition = $derived(calculateOrp(currentWord.text));
  let progressText = $derived(words.length > 0 
    ? `Word ${wordIndex + 1} of ${words.length}` 
    : 'No content');

  // Reset state when text changes
  $effect(() => {
    if (text) {
      wordIndex = 0;
      isPlaying = false;
    }
  });

  // Dynamic timer using word-specific delays
  $effect(() => {
    if (!isPlaying || !words.length || wordIndex >= words.length) return;
    
    const word = words[wordIndex];
    const displayTime = getWordDisplayTime(currentWpm, word);
    
    const timer = setTimeout(() => {
      if (wordIndex >= words.length - 1) {
        isPlaying = false;
        onComplete();
        return;
      }
      wordIndex++;
    }, displayTime);
    
    return () => clearTimeout(timer);
  });

  // Auto-start when enabled
  $effect(() => {
    if (autoStart && !isPlaying && text.length > 0 && words.length > 0) {
      isPlaying = true;
    }
  });

  // Keyboard controls
  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case ' ':
        event.preventDefault();
        isPlaying = !isPlaying;
        if (!isPlaying) onPause();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        wordIndex = Math.max(0, wordIndex - 10);
        break;
      case 'Escape':
        event.preventDefault();
        isPlaying = false;
        onComplete();
        break;
    }
  }

  // Toggle play/pause with tracking
  function togglePlayback() {
    isPlaying = !isPlaying;
    if (!isPlaying) onPause();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div 
  class="rsvp-container" 
  role="region" 
  aria-label="Rapid serial visual presentation reader"
  tabindex="0"
>
  <!-- Screen reader announcement of current word -->
  <span class="sr-only" aria-live="polite" aria-atomic="true">
    {currentWord.text || 'No content'}
  </span>
  
  <!-- Visual display (hidden from screen readers to avoid double announcement) -->
  <div class="rsvp-display" style="--orp-offset: {orpPosition}ch" aria-hidden="true">
    {#if words.length > 0 && currentWord.text}
      <span class="rsvp-prefix">{currentWord.prefix}</span>
      <span class="rsvp-pivot">{currentWord.pivot}</span>
      <span class="rsvp-suffix">{currentWord.suffix}</span>
    {:else}
      <span class="rsvp-empty">—</span>
    {/if}
  </div>
  
  <div class="rsvp-progress" aria-hidden="true">
    <span class="rsvp-progress-text">{progressText}</span>
  </div>
  
  <div class="rsvp-controls">
    <Button 
      variant="ghost" 
      size="sm" 
      onclick={togglePlayback}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {isPlaying ? '⏸' : '▶'}
    </Button>
    <input 
      type="range" 
      min="200" 
      max={maxWpm} 
      bind:value={currentWpm} 
      aria-label="Reading speed (words per minute)"
      disabled={words.length === 0}
    />
    <span class="rsvp-wpm" aria-label="Current speed">{currentWpm} WPM</span>
  </div>
  
  <div class="rsvp-help" aria-hidden="true">
    <span class="rsvp-help-text">Space: pause/resume • ←: back 10 • Esc: close</span>
  </div>
</div>

<style>
  .rsvp-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-6);
    background: var(--color-bg-panel);
    border-radius: var(--radius-lg);
    min-width: 320px;
    box-shadow: var(--shadow-card);
  }
  
  .rsvp-display {
    font-family: var(--font-sans);
    font-size: var(--text-2xl);
    font-weight: 500;
    color: var(--color-text-primary);
    position: relative;
    min-height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  
  .rsvp-prefix,
  .rsvp-pivot,
  .rsvp-suffix {
    display: inline-block;
  }
  
  .rsvp-pivot {
    color: var(--color-accent); /* Brass/copper #b87333 */
    font-weight: 600;
  }
  
  .rsvp-controls {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    max-width: 400px;
  }
  
  input[type="range"] {
    flex-grow: 1;
    accent-color: var(--color-accent);
  }
  
  .rsvp-wpm {
    font-variant-numeric: tabular-nums;
    min-width: 5ch;
    text-align: right;
    color: var(--color-text-secondary);
  }
  
  .rsvp-progress {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
  }
  
  .rsvp-progress-text {
    font-variant-numeric: tabular-nums;
  }
  
  .rsvp-help {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-align: center;
    margin-top: var(--space-2);
  }
  
  .rsvp-help-text {
    opacity: 0.7;
  }
  
  .rsvp-empty {
    color: var(--color-text-muted);
    font-style: italic;
  }
  
  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  /* Disabled state */
  input[type="range"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>