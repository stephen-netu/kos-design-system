/**
 * OpenUI Lang AST Types
 * 
 * Line-oriented DSL: identifier = ComponentName([arg1, arg2, ...])
 * 
 * Example:
 *   root = Stack([header, content])
 *   header = Text("Title", "large")
 *   content = Card([text])
 *   text = Text("Hello world")
 */

export type OpenUIIdentifier = string;

export interface OpenUIElement {
  type: 'element';
  identifier: OpenUIIdentifier;
  component: string;
  args: (string | number | boolean | OpenUIIdentifier | OpenUIIdentifier[])[];
  line: number;
}

export interface OpenUIPlaceholder {
  type: 'placeholder';
  identifier: OpenUIIdentifier;
  referencedBy: OpenUIIdentifier[];
  line: number;
}

export type OpenUINode = OpenUIElement | OpenUIPlaceholder;

export interface OpenUIAST {
  root: OpenUIIdentifier | null;
  nodes: Map<OpenUIIdentifier, OpenUINode>;
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseResult {
  ast: OpenUIAST;
  success: boolean;
}
