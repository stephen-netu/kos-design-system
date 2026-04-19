<script lang="ts">
  /**
   * ChatPanel - Fabric Component
   * 
   * Chat interface with message history, streaming display, and citations.
   * Decoupled from shell stores - uses props/callbacks for all state.
   * 
   * @package @kos/design-system/fabric/ai
   * @adr 2026-04-12-leap-repo-restructure-003
   */
  import { onMount, tick } from 'svelte';
  import { Send, Trash2, FileText, X, MessageSquare } from '@lucide/svelte';

  export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
    citations?: Citation[];
    timestamp?: Date;
  }

  export interface Citation {
    source: string;
    quote?: string;
  }

  export interface ContextCard {
    id: string;
    title: string;
  }

  interface Props {
    // State
    messages: Message[];
    inputValue: string;
    isStreaming: boolean;
    error: string | null;
    
    // Context (optional)
    hasContext?: boolean;
    contextCards?: ContextCard[];
    contextCount?: number;
    
    // Callbacks
    onSend: (message: string) => void;
    onInputChange: (value: string) => void;
    onClearChat: () => void;
    onClearContext?: () => void;
    onCitationClick?: (source: string) => void;
    
    // Voice input (optional)
    voiceButton?: import('svelte').Snippet;
    
    // Customization
    title?: string;
    placeholder?: string;
    emptyStateText?: string;
    emptyStateHint?: string;
  }

  const props: Props = $props();

  let inputElement: HTMLInputElement;
  let messagesContainer: HTMLDivElement;

  function handleSend() {
    const prompt = props.inputValue.trim();
    if (!prompt || props.isStreaming) return;
    
    props.onSend(prompt);
    props.onInputChange('');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleCitationClick(source: string) {
    props.onCitationClick?.(source);
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function markdownToHtml(text: string): string {
    if (!text) return '';

    const escaped = escapeHtml(text);

    return escaped
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/gim, '<ul>$&</ul>')
      .replace(/\n/gim, '<br>');
  }

  $effect(() => {
    if (props.messages.length) {
      tick().then(() => {
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
    }
  });

  onMount(() => {
    inputElement?.focus();
  });
</script>

<div class="chat-panel" data-testid="chat-panel">
  <!-- Header -->
  <div class="chat-header" data-testid="chat-header">
    <h3 class="chat-title" data-testid="chat-title">{props.title || 'AI Assistant'}</h3>
    {#if props.messages.length > 0}
      <button
        class="clear-btn"
        onclick={props.onClearChat}
        title="Start new conversation"
      >
        <Trash2 size={14} />
      </button>
    {/if}
  </div>

  <!-- Context Bar -->
  {#if props.hasContext && props.contextCount && props.contextCount > 0}
    <div class="context-bar">
      <div class="context-info">
        <MessageSquare size={14} />
        <span class="context-text">
          Chatting about: {props.contextCount} card{props.contextCount === 1 ? '' : 's'}
        </span>
      </div>
      <div class="context-actions">
        {#if props.contextCards && props.contextCards.length <= 3}
          <div class="context-titles">
            {#each props.contextCards as card}
              <span class="context-chip" title={card.title}>
                {card.title || 'Untitled'}
              </span>
            {/each}
          </div>
        {/if}
        {#if props.onClearContext}
          <button
            class="clear-context-btn"
            onclick={props.onClearContext}
            title="Clear context"
          >
            <X size={14} />
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Messages -->
  <div class="messages-container" bind:this={messagesContainer}>
    {#if props.messages.length === 0}
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p class="empty-text">{props.emptyStateText || 'Ask about your knowledge base'}</p>
        <p class="empty-hint">{props.emptyStateHint || 'Try: "What are embeddings?" or "Summarize my notes"'}</p>
      </div>
    {:else}
      {#each props.messages as message (message.id)}
        <div 
          class="message"
          class:user={message.role === 'user'}
          class:assistant={message.role === 'assistant'}
        >
          <div class="message-bubble">
            <div class="message-content">
              {@html markdownToHtml(message.content)}
              {#if message.isStreaming}
                <span class="streaming-cursor"></span>
              {/if}
            </div>
            
            {#if message.citations && message.citations.length > 0}
              <div class="citations">
                {#each message.citations as citation}
                  <div class="citation-wrapper">
                    <button
                      class="citation-chip"
                      onclick={() => handleCitationClick(citation.source)}
                      title={citation.source}
                    >
                      <FileText size={12} />
                      <span class="citation-source">{citation.source.split('/').pop() || citation.source}</span>
                    </button>
                    {#if citation.quote}
                      <div class="citation-popover" role="tooltip">
                        <p class="citation-snippet">{citation.quote.length > 150 ? citation.quote.substring(0, 150) + '...' : citation.quote}</p>
                        <span class="citation-popover-source">{citation.source.split('/').pop()}</span>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    {/if}

    {#if props.error}
      <div class="error-message">
        {props.error}
      </div>
    {/if}
  </div>

  <!-- Input -->
  <div class="input-container">
    <div class="input-wrapper">
      <input
        bind:this={inputElement}
        value={props.inputValue}
        oninput={(e) => props.onInputChange(e.currentTarget.value)}
        onkeydown={handleKeydown}
        placeholder={props.isStreaming ? 'Receiving response...' : (props.placeholder || 'Type your message...')}
        disabled={props.isStreaming}
        class="chat-input"
      />
      {#if props.voiceButton}
        {@render props.voiceButton()}
      {/if}
      <button 
        class="send-btn"
        onclick={handleSend}
        disabled={!props.inputValue.trim() || props.isStreaming}
        title="Send message"
      >
        <Send size={16} />
      </button>
    </div>
  </div>
</div>

<style>
  .chat-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-panel, #1a1a1a);
    color: var(--text-primary, #e0e0e0);
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
    background: var(--bg-panel, #1a1a1a);
  }

  .chat-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary, #e0e0e0);
  }

  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm, 4px);
    color: var(--text-tertiary, #6b6b6b);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .clear-btn:hover {
    background: var(--border-subtle, #2a2a2a);
    color: var(--color-error, #ef4444);
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    opacity: 0.6;
  }

  .empty-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 14px;
    color: var(--text-secondary, #a0a0a0);
    margin: 0 0 4px 0;
  }

  .empty-hint {
    font-size: 12px;
    color: var(--text-tertiary, #6b6b6b);
    margin: 0;
  }

  .message {
    display: flex;
    max-width: 90%;
  }

  .message.user {
    align-self: flex-end;
  }

  .message.assistant {
    align-self: flex-start;
  }

  .message-bubble {
    padding: 10px 14px;
    border-radius: var(--radius-xl, 12px);
    font-size: 13px;
    line-height: 1.5;
  }

  .message.user .message-bubble {
    background: var(--accent-primary, #b87333);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message.assistant .message-bubble {
    background: var(--bg-panel-elevated, #252525);
    color: var(--text-primary, #e0e0e0);
    border: 1px solid var(--border-subtle, #2a2a2a);
    border-bottom-left-radius: 4px;
  }

  .message-content :global(h1),
  .message-content :global(h2),
  .message-content :global(h3) {
    font-size: 14px;
    margin: 8px 0 4px 0;
  }

  .message-content :global(p) {
    margin: 0 0 4px 0;
  }

  .message-content :global(code) {
    background: rgba(0, 0, 0, 0.2);
    padding: 2px 4px;
    border-radius: var(--radius-sm, 3px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.9em;
  }

  .message-content :global(pre) {
    background: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: var(--radius-md, 6px);
    overflow-x: auto;
    margin: 4px 0;
  }

  .message-content :global(pre code) {
    background: none;
    padding: 0;
  }

  .message-content :global(ul) {
    margin: 4px 0;
    padding-left: 20px;
  }

  .streaming-cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--accent-primary, #b87333);
    margin-left: 2px;
    animation: blink 1s infinite;
    vertical-align: middle;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .citations {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-subtle, #2a2a2a);
  }

  .citation-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--accent-subtle, rgba(184, 115, 51, 0.15));
    border: 1px solid var(--accent-primary, #b87333);
    border-radius: var(--radius-xl, 12px);
    color: var(--accent-primary, #b87333);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s ease;
    max-width: 150px;
  }

  .citation-chip:hover {
    background: var(--accent-primary, #b87333);
    color: white;
  }

  .citation-source {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .citation-wrapper {
    position: relative;
    display: inline-flex;
  }

  .citation-popover {
    display: none;
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    width: 220px;
    padding: 10px 12px;
    background: var(--bg-panel-elevated, #252525);
    border: 1px solid var(--border-subtle, #2a2a2a);
    border-left: 3px solid var(--accent-primary, #b87333);
    border-radius: var(--radius-md, 6px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10;
    pointer-events: none;
  }

  .citation-wrapper:hover .citation-popover {
    display: block;
    animation: popover-fade 0.15s ease-out;
  }

  @keyframes popover-fade {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .citation-snippet {
    margin: 0 0 6px 0;
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-primary, #e0e0e0);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  .citation-popover-source {
    font-size: 10px;
    color: var(--text-tertiary, #6b6b6b);
    font-style: italic;
  }

  .error-message {
    padding: 10px 14px;
    background: var(--color-error-bg, rgba(239, 68, 68, 0.1));
    border: 1px solid var(--color-error, #ef4444);
    border-radius: var(--radius-lg, 8px);
    color: var(--color-error, #ef4444);
    font-size: 13px;
    margin-top: 8px;
  }

  .input-container {
    padding: 12px 16px;
    border-top: 1px solid var(--border-subtle, #2a2a2a);
    background: var(--bg-panel, #1a1a1a);
  }

  .input-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .chat-input {
    flex: 1;
    padding: 10px 14px;
    background: var(--bg-panel-elevated, #252525);
    border: 1px solid var(--border-subtle, #2a2a2a);
    border-radius: var(--radius-xl, 20px);
    color: var(--text-primary, #e0e0e0);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .chat-input:focus {
    border-color: var(--accent-primary, #b87333);
  }

  .chat-input::placeholder {
    color: var(--text-tertiary, #6b6b6b);
  }

  .chat-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: var(--accent-primary, #b87333);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--accent-hover, #c9894f);
    transform: scale(1.05);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Context Bar Styles */
  .context-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--accent-subtle, rgba(184, 115, 51, 0.1));
    border-bottom: 1px solid var(--border-focus, rgba(184, 115, 51, 0.3));
    gap: 8px;
  }

  .context-info {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--accent-primary, #b87333);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .context-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    justify-content: flex-end;
  }

  .context-titles {
    display: flex;
    gap: 4px;
    overflow: hidden;
  }

  .context-chip {
    font-size: 11px;
    padding: 2px 8px;
    background: var(--bg-panel-elevated, #252525);
    border: 1px solid var(--border-subtle, #2a2a2a);
    border-radius: var(--radius-lg, 10px);
    color: var(--text-secondary, #a0a0a0);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
  }

  .clear-context-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm, 4px);
    color: var(--text-tertiary, #6b6b6b);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .clear-context-btn:hover {
    background: var(--border-subtle, #2a2a2a);
    color: var(--color-error, #ef4444);
  }
</style>
