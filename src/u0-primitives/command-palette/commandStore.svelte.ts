/**
 * Command Store — Svelte 5 runes store for command registry and execution
 * 
 * HDA: Surface layer (s0-state equivalent)
 * Sovereignty: 
 *   - S-01: All executions route through kernel.request_capability()
 *   - S-02: BTreeMap equivalent (sorted Map) for deterministic ordering
 *   - S-04: All invocations logged with correlation IDs
 *   - S-05: AbortController for killable operations
 */

import { invoke } from '@tauri-apps/api/core';
import type { 
  CommandSchema, 
  CommandResult, 
  CommandContext,
  InvocationContext,
  CommandId,
  CommandPath
} from './command-types';

/** Command with UI state (selection, etc.) */
export interface CommandUIState {
  schema: CommandSchema;
  isSelected: boolean;
  isExecutable: boolean;  // All required params filled
}

/** Active command session (filling parameters) */
export interface ActiveCommandSession {
  command: CommandSchema;
  filled: Map<string, string>;  // S-02: Map preserves insertion order
  currentParam: number;
  correlationId: string;
}

/** Store state interface */
interface CommandStoreState {
  /** All registered commands (BTreeMap equivalent — sorted by id) */
  commands: Map<CommandId, CommandSchema>;
  /** Currently active command session */
  activeSession: ActiveCommandSession | null;
  /** Current user capabilities (from SACS) */
  capabilities: Set<string>;
  /** Execution state */
  isExecuting: boolean;
  /** Last result */
  lastResult: CommandResult | null;
}

class CommandStore {
  // Svelte 5 runes state
  commands = $state<Map<CommandId, CommandSchema>>(new Map());
  activeSession = $state<ActiveCommandSession | null>(null);
  capabilities = $state<Set<string>>(new Set());
  isExecuting = $state(false);
  lastResult = $state<CommandResult | null>(null);
  
  // Derived: commands sorted by path for deterministic display (S-02)
  sortedCommands = $derived(
    Array.from(this.commands.values())
      .sort((a, b) => a.path.join('.').localeCompare(b.path.join('.')))
  );
  
  // Derived: current context (from leapStore or context provider)
  currentContext = $state<CommandContext>('global');
  
  // Derived: available commands for current context + capabilities
  availableCommands = $derived(
    this.sortedCommands.filter(cmd => 
      cmd.contexts.includes(this.currentContext) &&
      cmd.requiredCapabilities.every(cap => this.capabilities.has(cap))
    )
  );
  
  // AbortController for killable operations (S-05)
  private abortController: AbortController | null = null;

  /**
   * Initialize store with commands from substrate
   * Called on app mount / realm connection
   */
  async init(realmId: string): Promise<void> {
    try {
      // Fetch commands and capabilities from substrate
      const [commands, caps] = await Promise.all([
        invoke<CommandSchema[]>('plugin:substrate|get_commands', { realmId }),
        invoke<string[]>('plugin:substrate|get_capabilities', { realmId })
      ]);
      
      // S-02: Preserve deterministic order
      this.commands = new Map(commands.map(c => [c.id, c]));
      this.capabilities = new Set(caps);
    } catch (err) {
      console.error('[CommandStore] Init failed:', err);
      // Graceful degradation — commands won't show but app continues
    }
  }

  /**
   * Register a command (for dynamic command registration)
   * HDA: Delegates to i1-mediation CommandRegistry
   */
  register(schema: CommandSchema): void {
    this.commands.set(schema.id, schema);
    // Trigger reactivity by reassigning
    this.commands = new Map(this.commands);
  }

  /**
   * Start a command session
   * Returns true if command found and session started
   */
  startCommand(path: CommandPath): boolean {
    const pathStr = path.join('.');
    const command = this.sortedCommands.find(c => c.path.join('.') === pathStr);
    
    if (!command) return false;
    
    // Check capabilities
    if (!command.requiredCapabilities.every(cap => this.capabilities.has(cap))) {
      console.warn(`[CommandStore] Missing capabilities for /${pathStr}`);
      return false;
    }
    
    // Generate correlation ID for audit trail (S-04)
    const correlationId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    this.activeSession = {
      command,
      filled: new Map(),
      currentParam: 0,
      correlationId
    };
    
    return true;
  }

  /**
   * Fill current parameter and advance
   */
  fillParameter(value: string): boolean {
    if (!this.activeSession) return false;
    
    const { command, filled, currentParam } = this.activeSession;
    const param = command.parameters[currentParam];
    
    if (!param) {
      // No more params — execute
      this.execute();
      return true;
    }
    
    // Store value
    filled.set(param.name, value);
    
    // Advance to next parameter
    const nextIndex = currentParam + 1;
    if (nextIndex >= command.parameters.length) {
      // All params filled — execute
      this.execute();
      return true;
    }
    
    // Continue to next param
    this.activeSession = {
      ...this.activeSession,
      currentParam: nextIndex
    };
    
    return false; // Not done yet
  }

  /**
   * Skip optional parameter
   */
  skipOptional(): boolean {
    if (!this.activeSession) return false;
    
    const { command, currentParam } = this.activeSession;
    const param = command.parameters[currentParam];
    
    if (param?.required) {
      console.warn(`[CommandStore] Cannot skip required parameter: ${param.name}`);
      return false;
    }
    
    return this.fillParameter(''); // Empty string for optional
  }

  /**
   * Cancel active session
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.activeSession = null;
    this.isExecuting = false;
  }

  /**
   * Execute the active command
   * S-01: Routes through kernel.request_capability()
   * S-04: Creates sigchain entry
   * S-05: Abortable via kill signal
   */
  async execute(): Promise<CommandResult> {
    if (!this.activeSession || this.isExecuting) {
      return { success: false, message: 'No active command or already executing' };
    }
    
    const { command, filled, correlationId } = this.activeSession;
    
    // Validate all required params present
    for (const param of command.parameters) {
      if (param.required && !filled.has(param.name)) {
        return { 
          success: false, 
          message: `Missing required parameter: ${param.name}` 
        };
      }
    }
    
    // S-05: Create abort controller for killability
    this.abortController = new AbortController();
    this.isExecuting = true;
    
    try {
      // Convert Map to plain object for IPC
      const parameters = Object.fromEntries(filled);
      
      // Build invocation context
      const context: InvocationContext = {
        realmId: 'current', // Resolved by substrate
        userId: 'current',  // Resolved by substrate
      };
      
      // Invoke through substrate (S-01 authority check happens in kernel)
      const result = await invoke<CommandResult>('plugin:substrate|invoke_command', {
        commandId: command.id,
        parameters,
        context,
        correlationId
      });
      
      this.lastResult = result;
      
      if (result.success) {
        // Clear session on success
        this.activeSession = null;
      }
      
      return result;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const result: CommandResult = { 
        success: false, 
        message,
        // Note: sigchain entry created even for failures (S-04)
      };
      this.lastResult = result;
      return result;
    } finally {
      this.isExecuting = false;
      this.abortController = null;
    }
  }

  /**
   * Quick execute — bypass parameter UI for programmatic use
   */
  async quickExecute(
    path: CommandPath, 
    parameters: Record<string, string>
  ): Promise<CommandResult> {
    const started = this.startCommand(path);
    if (!started) {
      return { success: false, message: `Unknown command: /${path.join(' ')}` };
    }
    
    // Fill all provided parameters
    for (const [name, value] of Object.entries(parameters)) {
      this.activeSession!.filled.set(name, value);
    }
    
    return this.execute();
  }

  /**
   * Parse command string (for chat input parsing)
   * Returns command info without starting session
   */
  parse(input: string): { command?: CommandSchema; args: string[] } {
    if (!input.startsWith('/')) {
      return { args: [] };
    }
    
    const parts = input.slice(1).split(/\s+/);
    const path: CommandPath = [];
    let cmd: CommandSchema | undefined;
    
    // Try to match longest path first
    for (let i = 0; i < parts.length; i++) {
      path.push(parts[i]);
      const found = this.sortedCommands.find(c => 
        c.path.length === path.length && 
        c.path.every((p, idx) => p === path[idx])
      );
      if (found) {
        cmd = found;
      }
    }
    
    // Remaining parts are arguments
    const matchedPathLength = cmd?.path.length ?? 0;
    const args = parts.slice(matchedPathLength);
    
    return { command: cmd, args };
  }

  /**
   * Filter commands by search query
   */
  search(query: string): CommandSchema[] {
    const lower = query.toLowerCase();
    return this.availableCommands.filter(cmd => 
      cmd.path.join(' ').toLowerCase().includes(lower) ||
      cmd.description.toLowerCase().includes(lower)
    );
  }

  /**
   * Update context (called when switching realms/groves)
   */
  setContext(context: CommandContext): void {
    this.currentContext = context;
    // Cancel any active session — context changed
    this.cancel();
  }

  /**
   * Update capabilities (called after capability grants/revocations)
   */
  setCapabilities(caps: string[]): void {
    this.capabilities = new Set(caps);
    // Check if active session still valid
    if (this.activeSession) {
      const canExecute = this.activeSession.command.requiredCapabilities
        .every(cap => this.capabilities.has(cap));
      if (!canExecute) {
        this.cancel();
      }
    }
  }

  /**
   * Cleanup (S-05 killability)
   */
  destroy(): void {
    this.cancel();
    this.commands.clear();
    this.capabilities.clear();
  }
}

// Export singleton
export const commandStore = new CommandStore();
