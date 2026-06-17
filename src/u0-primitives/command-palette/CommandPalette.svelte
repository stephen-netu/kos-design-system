<!--
  CommandPalette.svelte — Slash command interface for LEAP chat
  
  Pattern: Type '/' to trigger command palette with autocomplete
  Context-aware: Commands filtered by current realm/grove/role
  Capability-gated: Only shows commands user has capabilities for
  
  HDA Layer: u0-primitives (atom component)
  Sovereignty: S-05 killable via onDestroy cleanup
-->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { CommandSchema, CommandParameter, ParameterType } from './command-types';
  
  interface Props {
    /** Available commands (pre-filtered by context + capabilities) */
    commands: CommandSchema[];
    /** Current context for parameter autocomplete */
    context: {
      realmId?: string;
      groveId?: string;
      agentSession?: string;
    };
    /** Execute callback — returns success/error for feedback */
    onExecute: (command: CommandSchema, parameters: Record<string, string>) => Promise<ExecuteResult>;
    /** Called when palette should close */
    onClose: () => void;
    /** Placeholder text when no command active */
    placeholder?: string;
  }
  
  interface ExecuteResult {
    success: boolean;
    message?: string;
  }
  
  const {
    commands,
    context,
    onExecute,
    onClose,
    placeholder = "Type / for commands..."
  }: Props = $props();
  
  // Input state
  let inputValue = $state('');
  let isOpen = $state(false);
  let selectedIndex = $state(0);
  let activeCommand = $state<CommandSchema | null>(null);
  let paramValues = $state<Record<string, string>>({});
  let currentParamIndex = $state(0);
  let isExecuting = $state(false);
  let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Filtered commands when in browse mode (no active command)
  let filteredCommands = $derived(
    isOpen && !activeCommand
      ? filterCommands(commands, inputValue)
      : []
  );
  
  // Current parameter being filled
  let currentParam = $derived(
    activeCommand?.parameters[currentParamIndex] ?? null
  );
  
  // Autocomplete suggestions for current parameter
  let suggestions = $derived(
    currentParam?.autocompleteSource 
      ? fetchSuggestions(currentParam.autocompleteSource, inputValue)
      : []
  );
  
  function filterCommands(cmds: CommandSchema[], query: string): CommandSchema[] {
    if (!query || query === '/') return cmds;
    const search = query.slice(1).toLowerCase(); // Remove leading /
    return cmds.filter(cmd => 
      cmd.path.toString().toLowerCase().includes(search) ||
      cmd.description.toLowerCase().includes(search)
    );
  }
  
  function fetchSuggestions(source: string, query: string): string[] {
    // SACS-backed suggestion provider
    // IMPLEMENTATION_REQUIRED: Integrate with sovereign-sacs MCP
    return [];
  }
  
  function handleKeydown(e: KeyboardEvent) {
    // Open palette on '/' if not already open and not in input
    if (e.key === '/' && !isOpen && !isInputElement(document.activeElement)) {
      e.preventDefault();
      isOpen = true;
      inputValue = '/';
      return;
    }
    
    if (!isOpen) return;
    
    // Escape closes
    if (e.key === 'Escape') {
      if (activeCommand) {
        // Cancel current command, back to browse
        activeCommand = null;
        paramValues = {};
        currentParamIndex = 0;
        inputValue = '/';
      } else {
        onClose();
        isOpen = false;
        inputValue = '';
      }
      e.preventDefault();
      return;
    }
    
    // Enter executes or selects
    if (e.key === 'Enter') {
      if (activeCommand) {
        submitParameter();
      } else if (filteredCommands.length > 0) {
        selectCommand(filteredCommands[selectedIndex]);
      }
      e.preventDefault();
      return;
    }
    
    // Arrow navigation
    if (e.key === 'ArrowDown') {
      if (activeCommand && suggestions.length > 0) {
        // Navigate suggestions
      } else {
        const max = activeCommand ? suggestions.length : filteredCommands.length;
        selectedIndex = (selectedIndex + 1) % max;
      }
      e.preventDefault();
      return;
    }
    
    if (e.key === 'ArrowUp') {
      const max = activeCommand ? suggestions.length : filteredCommands.length;
      selectedIndex = (selectedIndex - 1 + max) % max;
      e.preventDefault();
      return;
    }
    
    // Tab completes or moves to next parameter
    if (e.key === 'Tab') {
      if (activeCommand) {
        if (suggestions.length > 0) {
          // Accept suggestion
          inputValue = suggestions[selectedIndex] ?? inputValue;
        } else {
          // Move to next parameter
          submitParameter();
        }
      }
      e.preventDefault();
      return;
    }
  }
  
  function isInputElement(el: Element | null): boolean {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || 
           (el as HTMLElement).isContentEditable;
  }
  
  function selectCommand(cmd: CommandSchema) {
    activeCommand = cmd;
    inputValue = '';
    selectedIndex = 0;
    paramValues = {};
    currentParamIndex = 0;
  }

  function handleOptionKeydown(e: KeyboardEvent, cmd: CommandSchema) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectCommand(cmd);
    }
  }

  function handleSuggestionKeydown(e: KeyboardEvent, suggestion: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputValue = suggestion;
      submitParameter();
    }
  }
  
  function submitParameter() {
    if (!activeCommand || !currentParam) return;
    
    // Store parameter value
    paramValues[currentParam.name] = inputValue.trim();
    inputValue = '';
    selectedIndex = 0;
    
    // Check if we have all required parameters
    const allRequiredFilled = activeCommand.parameters
      .filter(p => p.required)
      .every(p => paramValues[p.name]);
    
    const noMoreParams = currentParamIndex >= activeCommand.parameters.length - 1;
    
    if (allRequiredFilled && (noMoreParams || inputValue === '')) {
      // Execute command
      executeCommand();
    } else {
      // Move to next parameter
      currentParamIndex++;
    }
  }
  
  async function executeCommand() {
    if (!activeCommand || isExecuting) return;
    
    isExecuting = true;
    feedback = null;
    
    try {
      const result = await onExecute(activeCommand, paramValues);
      
      if (result.success) {
        feedback = { type: 'success', message: result.message ?? 'Done' };
        // Reset after brief delay
        setTimeout(() => {
          isOpen = false;
          activeCommand = null;
          paramValues = {};
          currentParamIndex = 0;
          inputValue = '';
          feedback = null;
        }, 800);
      } else {
        feedback = { type: 'error', message: result.message ?? 'Failed' };
      }
    } catch (err) {
      feedback = { 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Command failed' 
      };
    } finally {
      isExecuting = false;
    }
  }
  
  function getParameterPlaceholder(param: CommandParameter): string {
    if (param.paramType === 'choice' && 'choices' in param) {
      const choices = (param as any).choices as string[];
      return `${param.description} (${choices.join('/')})`;
    }
    return param.description;
  }
  
  // Cleanup on destroy (S-05 killability)
  onDestroy(() => {
    isOpen = false;
    activeCommand = null;
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="command-palette" role="dialog" aria-label="Command palette">
    <!-- Input bar -->
    <div class="input-bar" class:executing={isExecuting}>
      {#if activeCommand}
        <span class="command-prefix">/{activeCommand.path}</span>
        {#if currentParam}
          <span class="param-prompt">{currentParam.name}:</span>
        {/if}
      {:else}
        <span class="slash">/</span>
      {/if}
      
      <input
        type="text"
        bind:value={inputValue}
        placeholder={activeCommand && currentParam 
          ? getParameterPlaceholder(currentParam)
          : placeholder}
        disabled={isExecuting}
        role="combobox"
        aria-autocomplete="list"
        aria-controls="suggestions-list"
        aria-expanded={filteredCommands.length > 0 || suggestions.length > 0}
        aria-activedescendant={!activeCommand && filteredCommands.length > 0
          ? `command-opt-${selectedIndex}`
          : activeCommand && suggestions.length > 0
            ? `suggestion-opt-${selectedIndex}`
            : undefined}
      />
      
      {#if isExecuting}
        <span class="spinner"></span>
      {/if}
    </div>
    
    <!-- Command list (browse mode) -->
    {#if !activeCommand && filteredCommands.length > 0}
      <ul 
        class="command-list" 
        role="listbox" 
        id="suggestions-list"
        aria-label="Available commands"
      >
        {#each filteredCommands as cmd, i (cmd.id)}
          <li 
            id="command-opt-${i}"
            role="option"
            aria-selected={i === selectedIndex}
            tabindex={i === selectedIndex ? 0 : -1}
            class:selected={i === selectedIndex}
            onclick={() => selectCommand(cmd)}
            onkeydown={(e) => handleOptionKeydown(e, cmd)}
          >
            <span class="command-name">/{cmd.path}</span>
            <span class="command-desc">{cmd.description}</span>
            {#if cmd.requiredCapabilities.length > 0}
              <span class="cap-badge" title="Requires: {cmd.requiredCapabilities.join(', ')}">
                🔒
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    
    <!-- Suggestions (parameter autocomplete) -->
    {#if activeCommand && suggestions.length > 0}
      <ul 
        class="suggestion-list" 
        role="listbox"
        id="suggestions-list"
        aria-label="Suggestions for {currentParam?.name}"
      >
        {#each suggestions as sug, i (sug)}
          <li 
            id="suggestion-opt-${i}"
            role="option"
            aria-selected={i === selectedIndex}
            tabindex={i === selectedIndex ? 0 : -1}
            class:selected={i === selectedIndex}
            onclick={() => { inputValue = sug; submitParameter(); }}
            onkeydown={(e) => handleSuggestionKeydown(e, sug)}
          >
            {sug}
          </li>
        {/each}
      </ul>
    {/if}
    
    <!-- Parameter progress -->
    {#if activeCommand}
      <div class="param-progress">
        {#each activeCommand.parameters as param, i}
          <span 
            class="param-chip"
            class:filled={paramValues[param.name]}
            class:current={i === currentParamIndex}
            class:required={param.required}
          >
            {param.name}
            {#if paramValues[param.name]}
              = {paramValues[param.name]}
            {/if}
          </span>
        {/each}
      </div>
    {/if}
    
    <!-- Feedback -->
    {#if feedback}
      <div class="feedback" class:success={feedback.type === 'success'} class:error={feedback.type === 'error'}>
        {feedback.message}
      </div>
    {/if}
    
    <!-- Help text -->
    <div class="help">
      <kbd>↑↓</kbd> navigate
      <kbd>Enter</kbd> select
      <kbd>Tab</kbd> complete
      <kbd>Esc</kbd> close
    </div>
  </div>
{/if}

<style>
  .command-palette {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    margin-bottom: 2px;
    background: var(--color-bg-panel-elevated);
    border: var(--border-width-default) solid var(--border-default);
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
    z-index: 100;
  }

  .input-bar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--ui-pad-y) var(--ui-pad-x);
    border-bottom: 1px solid var(--border-default);
  }
  
  .input-bar.executing {
    opacity: 0.7;
  }
  
  .slash {
    color: var(--color-accent, var(--color-accent));
    font-weight: 600;
    font-size: var(--text-lg);
  }
  
  .command-prefix {
    color: var(--color-accent, var(--color-accent));
    font-weight: 600;
    font-family: var(--font-mono);
  }
  
  .param-prompt {
    color: var(--color-text-secondary, #a09880);
    font-size: var(--text-sm);
  }
  
  input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text-primary, #f2efe9);
    font-size: var(--text-base);
    outline: none;
  }
  
  input::placeholder {
    color: var(--color-text-muted, #5a5245);
  }
  
  .spinner {
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--border-default);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .command-list,
  .suggestion-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 220px;
    overflow-y: auto;
  }

  .command-list li,
  .suggestion-list li {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: var(--ui-row-h);
    padding: 0 var(--ui-pad-x);
    cursor: pointer;
    border-bottom: 1px solid var(--border-default);
    transition: background var(--transition-fast) linear;
  }

  .command-list li:last-child,
  .suggestion-list li:last-child { border-bottom: 0; }

  .command-list li:hover,
  .command-list li.selected,
  .suggestion-list li:hover,
  .suggestion-list li.selected {
    background: var(--color-accent-subtle);
    box-shadow: inset 2px 0 0 var(--color-accent);
  }
  
  .command-name {
    font-family: var(--font-mono);
    color: var(--color-accent, var(--color-accent));
    font-weight: 500;
  }
  
  .command-desc {
    color: var(--color-text-secondary, #a09880);
    font-size: var(--text-sm);
  }
  
  .cap-badge {
    margin-left: auto;
    font-size: var(--text-xs);
    opacity: 0.7;
  }
  
  .param-progress {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border-top: 1px solid var(--border-subtle);
  }
  
  .param-chip {
    font-size: var(--ui-label);
    font-family: var(--font-mono);
    padding: 2px var(--ui-pad-y);
    background: var(--color-bg-panel);
    color: var(--color-text-tertiary);
    border: 1px solid transparent;
  }

  .param-chip.required {
    border-color: var(--color-accent-muted);
  }

  .param-chip.filled {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
  }

  .param-chip.current {
    border-color: var(--color-accent);
  }
  
  .feedback {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    border-top: 1px solid var(--border-subtle);
  }
  
  .feedback.success {
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 10%, transparent);
  }

  .feedback.error {
    color: var(--color-error);
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
  }
  
  .help {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text-muted, #5a5245);
    border-top: 1px solid var(--border-subtle);
  }
  
  kbd {
    background: var(--color-bg-canvas);
    padding: 1px 5px;
    border: 1px solid var(--border-subtle);
    font-family: var(--font-mono);
    font-size: var(--ui-label);
  }
</style>
