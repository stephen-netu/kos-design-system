/**
 * Component Library Types
 * 
 * Zod-inspired component schemas for type-safe generative UI.
 */

export type PropType = 'string' | 'number' | 'boolean' | 'array' | 'enum' | 'identifier' | 'union';

export interface PropSchema {
  type: PropType;
  optional?: boolean;
  default?: unknown;
  // For enum type
  values?: string[];
  // For array type
  itemType?: PropType;
  // For union type
  variants?: PropSchema[];
  // Description for prompt generation
  description?: string;
}

export interface ComponentSchema {
  name: string;
  description: string;
  props: Record<string, PropSchema>;
  // Position in arg list (for positional OpenUI Lang args)
  propOrder: string[];
  // Can contain children (other component references)
  children?: boolean;
  // Svelte component to render
  svelteComponent?: string;
}

export type ComponentRegistry = Map<string, ComponentSchema>;

export interface LibraryConfig {
  name: string;
  description: string;
  components: ComponentSchema[];
}
