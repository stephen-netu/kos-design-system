<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    src?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'offline' | 'away' | 'busy' | 'typing' | null;
    class?: string;
  }

  let {
    src,
    name = '',
    size = 'md',
    status = null,
    class: className = ''
  }: Props = $props();

  let hasError = $state(false);

  let fallbackInitials = $derived(
    name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  );

  function handleError() {
    hasError = true;
  }
</script>

<div class="ds-avatar-wrapper size-{size} {className}">
  <div class="ds-avatar-inner" aria-label={name}>
    {#if src && !hasError}
      <img 
        class="ds-avatar-image" 
        {src} 
        alt={name} 
        onerror={handleError}
      />
    {:else}
      <div class="ds-avatar-fallback">
        <span class="ds-avatar-initials">{fallbackInitials || '?'}</span>
      </div>
    {/if}
  </div>

  {#if status}
    <div class="ds-avatar-status status-{status}" title={status}>
      {#if status === 'typing'}
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .ds-avatar-wrapper {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
  }

  .ds-avatar-inner {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--radius-full);
    overflow: hidden;
    background: var(--color-bg-panel-elevated);
    border: 1px solid var(--border-subtle);
    box-shadow: var(--shadow-sm);
  }

  .ds-avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ds-avatar-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-bg-panel-elevated), var(--color-bg-panel));
    color: var(--color-text-secondary);
  }

  .ds-avatar-initials {
    font-family: var(--font-sans);
    font-weight: 600;
  }

  /* --- Sizes --- */
  .size-sm { 
    width: 1.5rem; 
    height: 1.5rem; 
  }
  .size-sm .ds-avatar-initials { font-size: var(--text-xs); }

  .size-md { 
    width: 2.25rem; 
    height: 2.25rem; 
  }
  .size-md .ds-avatar-initials { font-size: var(--text-sm); }

  .size-lg { 
    width: 3rem; 
    height: 3rem; 
  }
  .size-lg .ds-avatar-initials { font-size: var(--text-lg); }

  .size-xl {
    width: 4rem;
    height: 4rem;
  }
  .size-xl .ds-avatar-initials { font-size: var(--text-xl); }

  /* --- Status Dot --- */
  .ds-avatar-status {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 25%;
    height: 25%;
    min-width: 10px;
    min-height: 10px;
    border-radius: var(--radius-full);
    background-color: var(--color-offline);
    border: 2px solid var(--color-bg-app); /* Cuts a ring out of the avatar */
    z-index: 10;
  }

  .status-online { background-color: var(--color-online); box-shadow: 0 0 6px rgba(74, 222, 128, 0.4); }
  .status-away { background-color: var(--color-away); }
  .status-busy { background-color: var(--color-busy); }
  .status-offline { background-color: var(--color-offline); }
  
  .status-typing { 
    background-color: var(--color-typing);
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    width: auto;
    padding: 0 4px;
    min-width: 16px;
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-glow);
  }

  .typing-dot {
    width: 3px;
    height: 3px;
    background-color: #111;
    border-radius: var(--radius-full);
    animation: typing-bounce 1.4s infinite ease-in-out both;
  }

  .typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dot:nth-child(2) { animation-delay: -0.16s; }

  @keyframes typing-bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
</style>
