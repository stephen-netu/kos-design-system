/**
 * Component Library
 * 
 * Registry of components available for LLM generation.
 * Provides Zod-like schema definition and system prompt generation.
 */

import type { ComponentSchema, ComponentRegistry, LibraryConfig, PropSchema } from './types';

export class ComponentLibrary {
  private registry: ComponentRegistry = new Map();
  private config: LibraryConfig;

  constructor(config: LibraryConfig) {
    this.config = config;
    for (const component of config.components) {
      this.registry.set(component.name, component);
    }
  }

  getComponent(name: string): ComponentSchema | undefined {
    return this.registry.get(name);
  }

  hasComponent(name: string): boolean {
    return this.registry.has(name);
  }

  listComponents(): string[] {
    return Array.from(this.registry.keys()).sort();
  }

  /**
   * Generate system prompt for LLM
   * Describes available components and OpenUI Lang syntax
   */
  generatePrompt(): string {
    const lines: string[] = [
      `# ${this.config.name}`,
      '',
      this.config.description,
      '',
      '## OpenUI Lang Syntax',
      '',
      'Generate UI using this compact, line-oriented syntax:',
      '',
      '```',
      'identifier = ComponentName([arg1, arg2, ...])',
      '```',
      '',
      'Rules:',
      '1. First assignment MUST be to `root`',
      '2. One statement per line',
      '3. Arguments are positional, matching the component\'s propOrder',
      '4. Component references are bare identifiers (no quotes)',
      '5. Strings are in "double quotes"',
      '6. Numbers are bare (e.g., 42, 3.14)',
      '7. Booleans are `true` or `false`',
      '8. Arrays are [ref1, ref2, ref3]',
      '',
      '## Available Components',
      '',
    ];

    for (const component of this.config.components) {
      lines.push(this.describeComponent(component));
      lines.push('');
    }

    return lines.join('\n');
  }

  private describeComponent(schema: ComponentSchema): string {
    const lines: string[] = [
      `### ${schema.name}`,
      '',
      schema.description,
      '',
    ];

    if (schema.propOrder.length > 0) {
      lines.push('Props (in order):');
      for (const propName of schema.propOrder) {
        const prop = schema.props[propName];
        lines.push(`  ${propName}: ${this.describePropType(prop)}${prop.optional ? ' (optional)' : ''}`);
        if (prop.description) {
          lines.push(`    ${prop.description}`);
        }
      }
      lines.push('');
    }

    if (schema.children) {
      lines.push('Can contain child components.');
      lines.push('');
    }

    lines.push(`Example: ${schema.name}([${schema.propOrder.map(p => this.exampleValue(schema.props[p])).join(', ')}])`);

    return lines.join('\n');
  }

  private describePropType(prop: PropSchema): string {
    switch (prop.type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'array': return `array<${prop.itemType || 'unknown'}>`;
      case 'enum': return `enum(${prop.values?.join('|') || ''})`;
      case 'identifier': return 'component reference';
      case 'union': return `union(${prop.variants?.map(v => v.type).join('|') || ''})`;
      default: return prop.type;
    }
  }

  private exampleValue(prop: PropSchema): string {
    if (prop.default !== undefined) {
      return JSON.stringify(prop.default);
    }

    switch (prop.type) {
      case 'string': return '"example"';
      case 'number': return '42';
      case 'boolean': return 'true';
      case 'array': return '[a, b, c]';
      case 'enum': return `"${prop.values?.[0] || 'value'}"`;
      case 'identifier': return 'childRef';
      case 'union': return this.exampleValue(prop.variants?.[0] || { type: 'string' });
      default: return 'null';
    }
  }

  /**
   * Validate that an OpenUI Lang element matches its schema
   */
  validateElement(name: string, args: unknown[]): string[] {
    const schema = this.registry.get(name);
    if (!schema) {
      return [`Unknown component: ${name}`];
    }

    const errors: string[] = [];
    const requiredProps = schema.propOrder.filter(p => !schema.props[p].optional);

    // Check required args
    if (args.length < requiredProps.length) {
      errors.push(`Missing required arguments for ${name}: expected ${requiredProps.length}, got ${args.length}`);
    }

    // Validate types
    for (let i = 0; i < Math.min(args.length, schema.propOrder.length); i++) {
      const propName = schema.propOrder[i];
      const prop = schema.props[propName];
      const value = args[i];

      if (!this.validateType(value, prop)) {
        errors.push(`Invalid type for ${name}.${propName}: expected ${prop.type}, got ${typeof value}`);
      }
    }

    return errors;
  }

  private validateType(value: unknown, prop: PropSchema): boolean {
    switch (prop.type) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'array': return Array.isArray(value);
      case 'enum': return typeof value === 'string' && (prop.values?.includes(value) ?? false);
      case 'identifier': return typeof value === 'string';
      case 'union': return prop.variants?.some(v => this.validateType(value, v)) ?? true;
      default: return true;
    }
  }
}

/**
 * Helper to create component schema
 */
export function defineComponent(
  name: string,
  description: string,
  props: Record<string, PropSchema>,
  options: { children?: boolean; svelteComponent?: string } = {}
): ComponentSchema {
  // Determine prop order: required first, then optional
  const propOrder = Object.entries(props)
    .sort(([, a], [, b]) => {
      if (a.optional === b.optional) return 0;
      return a.optional ? 1 : -1;
    })
    .map(([name]) => name);

  return {
    name,
    description,
    props,
    propOrder,
    children: options.children,
    svelteComponent: options.svelteComponent,
  };
}
