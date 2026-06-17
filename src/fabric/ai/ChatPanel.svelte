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

  let { messages, inputValue, isStreaming, error, hasContext, contextCards, contextCount, onSend, onInputChange, onClearChat, onClearContext, onCitationClick, voiceButton, title, placeholder, emptyStateText, emptyStateHint }: Props = $props();

  let inputElement: HTMLInputElement;
  let messagesContainer: HTMLDivElement;

  function handleSend() {
    const prompt = inputValue.trim();
    if (!prompt || isStreaming) return;
    
    onSend(prompt);
    onInputChange('');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleCitationClick(source: string) {
    onCitationClick?.(source);
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
    if (messages.length) {
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
    <h3 class="chat-title" data-testid="chat-title">{title || 'AI Assistant'}</h3>
    {#if messages.length > 0}
      <button
        class="clear-btn"
        onclick={onClearChat}
        title="Start new conversation"
      >
        <Trash2 size={14} />
      </button>
    {/if}
  </div>

  <!-- Context Bar -->
  {#if hasContext && contextCount && contextCount > 0}
    <div class="context-bar">
      <div class="context-info">
        <MessageSquare size={14} />
        <span class="context-text">
          Chatting about: {contextCount} card{contextCount === 1 ? '' : 's'}
        </span>
      </div>
      <div class="context-actions">
        {#if contextCards && contextCards.length <= 3}
          <div class="context-titles">
            {#each contextCards as card}
              <span class="context-chip" title={card.title}>
                {card.title || 'Untitled'}
              </span>
            {/each}
          </div>
        {/if}
        {#if onClearContext}
          <button
            class="clear-context-btn"
            onclick={onClearContext}
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
    {#if messages.length === 0}
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p class="empty-text">{emptyStateText || 'Ask about your knowledge base'}</p>
        <p class="empty-hint">{emptyStateHint || 'Try: "What are embeddings?" or "Summarize my notes"'}</p>
      </div>
    {:else}
      {#each messages as message (message.id)}
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

    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}
  </div>

  <!-- Input -->
  <div class="input-container">
    <div class="input-wrapper">
      <input
        bind:this={inputElement}
        value={inputValue}
        oninput={(e) => onInputChange(e.currentTarget.value)}
        onkeydown={handleKeydown}
        placeholder={isStreaming ? 'Receiving response...' : (placeholder || 'Type your message...')}
        disabled={isStreaming}
        class="chat-input"
      />
      {#if voiceButton}
        {@render voiceButton()}
      {/if}
      <button 
        class="send-btn"
        onclick={handleSend}
        disabled={!inputValue.trim() || isStreaming}
        title="Send message"
      >
        <Send size={16} />
      </button>
    </div>
  </div>
</div>

  <!-- svelte-ignore css_unused_selector -->
  <style>
  .chat-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-bg-panel, #1a1a1a);
    color: var(--color-text-primary, #e0e0e0);
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-subtle, #2a2a2a);
    background: var(--color-bg-panel, #1a1a1a);
  }

  .chat-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary, #e0e0e0);
  }

  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    background: transparent;
    border: none;
    border-radius: 0;
    color: var(--color-text-tertiary, #6b6b6b);
    cursor: pointer;
    transition: color var(--transition-fast, 110ms) linear, background var(--transition-fast, 110ms) linear;
  }

  .clear-btn:hover {
    background: var(--border-subtle, #262b30);
    color: var(--color-error, #c14a4a);
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
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
    color: var(--color-text-secondary, #a0a0a0);
    margin: 0 0 4px 0;
  }

  .empty-hint {
    font-size: 12px;
    color: var(--color-text-tertiary, #6b6b6b);
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
    padding: var(--ui-pad-y, 5px) var(--ui-pad-x, 8px);
    font-size: var(--ui-font, 13px);
    line-height: var(--ui-leading, 1.35);
  }

  /* User bubble: accent-subtle bg + live edge. Accent fill (subtle) justified:
     this is a sender-identity readout, same logic as toggle thumb. */
  .message.user .message-bubble {
    background: var(--color-accent-subtle);
    color: var(--color-text-primary);
    box-shadow: inset -2px 0 0 var(--color-accent);
  }

  .message.assistant .message-bubble {
    background: var(--color-bg-panel-elevated, #1c2024);
    color: var(--color-text-primary);
    border: 1px solid var(--border-default, #262b30);
    box-shadow: inset 2px 0 0 var(--border-default);
  }

  .message-content h1,
  .message-content h2,
  .message-content h3 {
    font-size: 14px;
    margin: 8px 0 4px 0;
  }

  .message-content p {
    margin: 0 0 4px 0;
  }

  .message-content code {
    background: rgba(0, 0, 0, 0.2);
    padding: 2px 4px;
    border-radius: 0;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.9em;
  }

  .message-content pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: 0;
    overflow-x: auto;
    margin: 4px 0;
  }

  .message-content pre code {
    background: none;
    padding: 0;
  }

  .message-content ul {
    margin: 4px 0;
    padding-left: 20px;
  }

  .streaming-cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--color-accent);
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
    gap: var(--space-15);
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-subtle, #2a2a2a);
  }

  .citation-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 2px 6px;
    background: var(--color-accent-subtle);
    border: 1px solid var(--color-accent-muted);
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: var(--ui-label, 9px);
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: background var(--transition-fast, 110ms) linear, box-shadow var(--transition-fast, 110ms) linear;
    max-width: 150px;
  }

  .citation-chip:hover {
    background: var(--color-accent-muted);
    box-shadow: inset 2px 0 0 var(--color-accent);
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
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    width: 220px;
    padding: var(--ui-pad-y, 5px) var(--ui-pad-x, 8px);
    background: var(--color-bg-panel-elevated, #1c2024);
    border: 1px solid var(--border-default, #262b30);
    border-left: 2px solid var(--color-accent);
    z-index: 10;
    pointer-events: none;
  }

  .citation-wrapper:hover .citation-popover {
    display: block;
    animation: popover-fade var(--transition-fast, 110ms) linear;
  }

  @keyframes popover-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .citation-snippet {
    margin: 0 0 6px 0;
    font-size: 11px;
    line-height: 1.5;
    color: var(--color-text-primary, #e0e0e0);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  .citation-popover-source {
    font-size: 10px;
    color: var(--color-text-tertiary, #6b6b6b);
    font-style: italic;
  }

  .error-message {
    padding: var(--ui-pad-y, 5px) var(--ui-pad-x, 8px);
    background: var(--color-error-bg, rgba(193, 74, 74, 0.1));
    border: 1px solid var(--color-error, #c14a4a);
    color: var(--color-error, #c14a4a);
    font-size: var(--ui-font, 13px);
    margin-top: 6px;
  }

  .input-container {
    padding: 12px 16px;
    border-top: 1px solid var(--border-subtle, #2a2a2a);
    background: var(--color-bg-panel, #1a1a1a);
  }

  .input-wrapper {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .chat-input {
    flex: 1;
    padding: 10px 14px;
    background: var(--color-bg-panel-elevated, #252525);
    border: 1px solid var(--border-subtle, #2a2a2a);
    border-radius: 0;
    color: var(--color-text-primary, #e0e0e0);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .chat-input:focus {
    border-color: var(--color-accent);
  }

  .chat-input::placeholder {
    color: var(--color-text-tertiary, #6b6b6b);
  }

  .chat-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Send button: accent fill justified — submit = functional state (action, not decoration) */
  .send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ui-control-h, 24px);
    height: var(--ui-control-h, 24px);
    padding: 0;
    background: var(--color-accent);
    border: none;
    color: var(--color-bg-app, #0a0b0c);
    cursor: pointer;
    transition: background var(--transition-fast, 110ms) linear;
    flex-shrink: 0;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--color-accent-hover);
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
    background: var(--color-accent-subtle, var(--color-accent-subtle));
    border-bottom: 1px solid var(--border-focus, var(--color-accent-muted));
    gap: var(--space-2);
  }

  .context-info {
    display: flex;
    align-items: center;
    gap: var(--space-15);
    color: var(--color-accent);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .context-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    min-width: 0;
    justify-content: flex-end;
  }

  .context-titles {
    display: flex;
    gap: var(--space-1);
    overflow: hidden;
  }

  .context-chip {
    font-size: 11px;
    padding: 2px 8px;
    background: var(--color-bg-panel-elevated, #252525);
    border: 1px solid var(--border-subtle, #2a2a2a);
    border-radius: var(--radius-lg, 10px);
    color: var(--color-text-secondary, #a0a0a0);
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
    border-radius: 0;
    color: var(--color-text-tertiary, #6b6b6b);
    cursor: pointer;
    transition: color var(--transition-fast, 110ms) linear, background var(--transition-fast, 110ms) linear;
    flex-shrink: 0;
  }

  .clear-context-btn:hover {
    background: var(--border-subtle, #262b30);
    color: var(--color-error, #c14a4a);
  }
</style>
