/**
 * g0-generative — OpenUI Generative UI Layer
 * 
 * Streaming-first DSL parser and renderer for LLM-generated UI.
 * Implements OpenUI Lang specification for progressive UI rendering.
 * 
 * ADR: 2026-05-04-openui-generative-ui-integration
 * 
 * @package @kos/design-system/g0-generative
 */

export { default as OpenUIRenderer } from './renderer/OpenUIRenderer.svelte';
export { parseOpenUILang, type ParseResult } from './parser/parseOpenUILang';
export { ComponentLibrary, defineComponent } from './library/ComponentLibrary';
export { generateSystemPrompt } from './prompt-gen/generateSystemPrompt';
export { StreamingAdapter, type StreamChunk, type StreamingState } from './streaming/StreamingAdapter';

// Types
export type { OpenUIAST, OpenUIElement, OpenUIIdentifier } from './parser/types';
export type { ComponentSchema, ComponentRegistry } from './library/types';
