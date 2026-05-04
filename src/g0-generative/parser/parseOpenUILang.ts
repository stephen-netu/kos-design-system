/**
 * OpenUI Lang Parser
 * 
 * Streaming-compatible, line-by-line parser.
 * Sovereignty-compliant: uses insertion-ordered Map (deterministic iteration), no SystemTime/rand.
 * 
 * Syntax:
 *   identifier = ComponentName([arg1, arg2, ...])
 *   identifier = [ref1, ref2]  // shorthand for Lists
 * 
 * Forward references allowed — unresolved identifiers become placeholders.
 */

import type { OpenUIAST, OpenUIElement, OpenUIPlaceholder, OpenUINode, ParseError, ParseResult, OpenUIIdentifier } from './types';

class ParserState {
  nodes: Map<OpenUIIdentifier, OpenUINode> = new Map();
  references: Map<OpenUIIdentifier, Set<OpenUIIdentifier>> = new Map(); // id -> refs it contains
  referencedBy: Map<OpenUIIdentifier, Set<OpenUIIdentifier>> = new Map(); // id -> ids that reference it
  errors: ParseError[] = [];
  lineNumber = 0;
  root: OpenUIIdentifier | null = null;

  recordReference(from: OpenUIIdentifier, to: OpenUIIdentifier): void {
    if (!this.references.has(from)) {
      this.references.set(from, new Set());
    }
    this.references.get(from)!.add(to);

    if (!this.referencedBy.has(to)) {
      this.referencedBy.set(to, new Set());
    }
    this.referencedBy.get(to)!.add(from);
  }

  addError(message: string, severity: ParseError['severity'] = 'error'): void {
    this.errors.push({ line: this.lineNumber, message, severity });
  }
}

function tokenize(line: string): string[] | null {
  // Remove comments
  const commentIdx = line.indexOf('//');
  const clean = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  
  if (!clean.trim()) return null;

  const tokens: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let depth = 0;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];

    if (inString) {
      if (char === '\\' && i + 1 < clean.length) {
        current += clean[++i];
      } else if (char === stringChar) {
        inString = false;
        tokens.push(current);
        current = '';
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      continue;
    }

    if (char === '(' || char === '[') {
      depth++;
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      tokens.push(char);
      continue;
    }

    if (char === ')' || char === ']') {
      depth--;
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      tokens.push(char);
      continue;
    }

    if (char === ',' || char === '=') {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      if (char === '=') {
        tokens.push('=');
      }
      continue;
    }

    if (char === ' ' || char === '\t') {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

function parseValue(token: string, state: ParserState, elementId: OpenUIIdentifier): string | number | boolean | OpenUIIdentifier | null {
  // Note: Tokenizer strips quotes, so we don't need to handle them here
  
  // Unquoted string that looks like an identifier reference
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
    state.recordReference(elementId, token);
    return token; // Return as identifier reference
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(token)) {
    return parseFloat(token);
  }

  // Boolean
  if (token === 'true') return true;
  if (token === 'false') return false;

  // Array marker
  if (token === '[' || token === ']') {
    return null; // Handled at higher level
  }

  // String without quotes
  return token;
}

function parseLine(line: string, state: ParserState): void {
  state.lineNumber++;

  const tokens = tokenize(line);
  if (!tokens) return;

  // Must have: identifier = Component(...)
  const eqIdx = tokens.indexOf('=');
  if (eqIdx < 0) {
    state.addError('Expected assignment operator "="');
    return;
  }

  if (eqIdx !== 1) {
    state.addError('Expected identifier before "="');
    return;
  }

  const identifier = tokens[0];
  
  // Validate identifier
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    state.addError(`Invalid identifier: ${identifier}`);
    return;
  }

  // Set root if first assignment
  if (state.root === null) {
    state.root = identifier;
  }

  // Check for duplicate definition
  if (state.nodes.has(identifier)) {
    state.addError(`Duplicate definition: ${identifier}`, 'warning');
  }

  const afterEq = tokens.slice(eqIdx + 1);

  // Check for shorthand array: [ref1, ref2]
  if (afterEq[0] === '[' && afterEq[afterEq.length - 1] === ']') {
    // This is a List shorthand: identifier = [a, b, c]
    // Treat as: identifier = List([a, b, c])
    const refs: OpenUIIdentifier[] = [];
    for (let i = 1; i < afterEq.length - 1; i++) {
      const token = afterEq[i];
      if (token === ',') continue;
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
        refs.push(token);
        state.recordReference(identifier, token);
      }
    }

    const element: OpenUIElement = {
      type: 'element',
      identifier,
      component: 'List',
      args: [refs],
      line: state.lineNumber,
    };
    state.nodes.set(identifier, element);
    return;
  }

  // Component call: ComponentName([args])
  if (afterEq.length < 3) {
    state.addError('Expected ComponentName([args]) after "="');
    return;
  }

  const component = afterEq[0];
  
  if (afterEq[1] !== '(' || afterEq[afterEq.length - 1] !== ')') {
    state.addError('Expected parentheses around component arguments');
    return;
  }

  // Parse arguments
  const args: (string | number | boolean | OpenUIIdentifier | OpenUIIdentifier[])[] = [];
  const innerTokens = afterEq.slice(2, -1);
  
  let i = 0;
  while (i < innerTokens.length) {
    const token = innerTokens[i];

    // Skip commas
    if (token === ',') {
      i++;
      continue;
    }

    // Nested array literal [a, b, c]
    if (token === '[') {
      const arr: OpenUIIdentifier[] = [];
      i++;
      while (i < innerTokens.length && innerTokens[i] !== ']') {
        if (innerTokens[i] === ',') {
          i++;
          continue;
        }
        const val = parseValue(innerTokens[i], state, identifier);
        if (typeof val === 'string') {
          arr.push(val);
        }
        i++;
      }
      args.push(arr);
      i++; // skip ]
      continue;
    }

    const val = parseValue(token, state, identifier);
    if (val !== null) {
      args.push(val);
    }
    i++;
  }

  const element: OpenUIElement = {
    type: 'element',
    identifier,
    component,
    args,
    line: state.lineNumber,
  };
  state.nodes.set(identifier, element);
}

function resolvePlaceholders(state: ParserState): void {
  // Any identifier referenced but not defined becomes a placeholder
  for (const [ref, referrers] of state.referencedBy) {
    if (!state.nodes.has(ref)) {
      const placeholder: OpenUIPlaceholder = {
        type: 'placeholder',
        identifier: ref,
        referencedBy: Array.from(referrers),
        line: 0,
      };
      state.nodes.set(ref, placeholder);
    }
  }
}

export function parseOpenUILang(input: string): ParseResult {
  const state = new ParserState();
  
  const lines = input.split('\n');
  for (const line of lines) {
    parseLine(line, state);
  }

  resolvePlaceholders(state);

  // Validate root exists
  if (state.root === null) {
    state.addError('No root element defined (first assignment becomes root)');
  }

  // Check for orphaned nodes (nothing references them, not root)
  const referenced = new Set<OpenUIIdentifier>();
  referenced.add(state.root || '');
  for (const refs of state.references.values()) {
    for (const ref of refs) {
      referenced.add(ref);
    }
  }

  for (const [id, node] of state.nodes) {
    if (node.type === 'element' && !referenced.has(id) && id !== state.root) {
      state.addError(`Orphaned element: ${id} (nothing references it)`, 'warning');
    }
  }

  const ast: OpenUIAST = {
    root: state.root,
    nodes: state.nodes,
    errors: state.errors,
  };

  return {
    ast,
    success: state.errors.filter(e => e.severity === 'error').length === 0,
  };
}

export function parsePartial(input: string, existingAST?: OpenUIAST): ParseResult {
  // For streaming: parse new lines, merge with existing AST
  const result = parseOpenUILang(input);
  
  if (!existingAST) {
    return result;
  }

  // Merge: new definitions override old ones
  const mergedNodes = new Map(existingAST.nodes);
  for (const [id, node] of result.ast.nodes) {
    mergedNodes.set(id, node);
  }

  const mergedErrors = [...existingAST.errors];
  for (const err of result.ast.errors) {
    // Deduplicate errors by line+message
    const exists = mergedErrors.some(e => e.line === err.line && e.message === err.message);
    if (!exists) {
      mergedErrors.push(err);
    }
  }

  return {
    ast: {
      root: result.ast.root || existingAST.root,
      nodes: mergedNodes,
      errors: mergedErrors,
    },
    success: result.success,
  };
}
