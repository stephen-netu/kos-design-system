/**
 * Command Types — TypeScript mirror of i0-primitives command schema
 * 
 * HDA: Interfaces domain, layer 0 (pure types, no I/O)
 * Sovereignty: S-02 compliant — deterministic ordering, no HashMap equivalents
 */

/** Unique command identifier (e.g., "grove.invite", "agent.mode") */
export type CommandId = string;

/** Command path segments for nested commands (e.g., ["grove", "invite"]) */
export type CommandPath = string[];

/** Contexts where commands can appear */
export type CommandContext = 
  | 'realm'      // Realm-wide chat
  | 'grove'      // Within a grove
  | 'agent'      // Agent chat interface
  | 'global';    // Always available

/** Parameter types for command arguments */
export type ParameterType = 
  | 'string'     // Free text
  | 'number'     // Numeric value
  | 'boolean'    // True/false
  | 'user'       // @user mention
  | 'grove'      // #grove reference
  | 'task'       // $task reference
  | 'file'       // File path
  | 'choice';    // Enum of choices

/** Autocomplete suggestion sources (SACS-backed) */
export type AutocompleteSource = 
  | 'realm-members'
  | 'grove-members'
  | 'user-groves'
  | 'available-tasks'
  | 'recent-files'
  | 'agent-modes'
  | string;      // Custom SACS query

/** Single command parameter definition */
export interface CommandParameter {
  /** Parameter name (kebab-case) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Required vs optional */
  required: boolean;
  /** Value type */
  paramType: ParameterType;
  /** For 'choice' type: available options */
  choices?: string[];
  /** SACS-backed autocomplete source */
  autocompleteSource?: AutocompleteSource;
}

/** Full command schema — defines a slash command */
export interface CommandSchema {
  /** Unique identifier */
  id: CommandId;
  /** Hierarchical path (supports nesting like /grove invite) */
  path: CommandPath;
  /** Human-readable description for UI */
  description: string;
  /** Ordered parameters (S-02: deterministic array, not unordered set) */
  parameters: CommandParameter[];
  /** Required capabilities to execute (S-01 authority check) */
  requiredCapabilities: string[];
  /** Contexts where this command appears */
  contexts: CommandContext[];
}

/** Invocation context — where command was triggered */
export interface InvocationContext {
  realmId: string;
  groveId?: string;
  agentSessionId?: string;
  userId: string;
}

/** Command execution result */
export interface CommandResult {
  success: boolean;
  message?: string;
  /** Sigchain entry reference for audit trail (S-04) */
  sigchainEntry?: string;
  /** Additional data payload */
  data?: Record<string, unknown>;
}

/** Parameter validation error */
export interface ValidationError {
  parameter: string;
  message: string;
}

/** Parse result for command input */
export type ParseResult = 
  | { status: 'success'; command: CommandSchema; parameters: Record<string, string> }
  | { status: 'incomplete'; command: CommandSchema; filled: Record<string, string>; next: CommandParameter }
  | { status: 'error'; errors: ValidationError[] }
  | { status: 'unknown'; input: string };

/** Command registry interface (frontend mirror of i1-mediation) */
export interface ICommandRegistry {
  /** Register a command schema */
  register(schema: CommandSchema): void;
  /** Resolve command by path */
  resolve(path: CommandPath): CommandSchema | undefined;
  /** Get commands available in context with capabilities */
  available(
    context: CommandContext,
    capabilities: string[]
  ): CommandSchema[];
  /** Parse command input string */
  parse(input: string): ParseResult;
}

/** UI state for a command in the palette */
export interface CommandUIState {
  schema: CommandSchema;
  isSelected: boolean;
  isExecutable: boolean;
}

/** Active command session (filling parameters) */
export interface ActiveCommandSession {
  command: CommandSchema;
  filled: Map<string, string>;
  currentParam: number;
  correlationId: string;
}
