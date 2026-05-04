/**
 * Streaming Adapter
 * 
 * Progressive rendering for Svelte 5 runes.
 * Handles incremental parsing and state updates as LLM tokens arrive.
 * 
 * ADR: 2026-05-04-openui-generative-ui-integration
 */

import type { OpenUIAST } from '../parser/types';
import { parsePartial } from '../parser/parseOpenUILang';

/** Maximum content size to prevent memory exhaustion (1MB) */
const MAX_CONTENT_SIZE = 1024 * 1024;

export interface StreamChunk {
  content: string;
  isComplete: boolean;
}

export interface StreamingState {
  ast: OpenUIAST | null;
  partialContent: string;
  isStreaming: boolean;
  hasError: boolean;
  errorMessage: string | null;
  /** True if content was truncated due to size limit */
  wasTruncated: boolean;
}

export class StreamingAdapter {
  private state: StreamingState = {
    ast: null,
    partialContent: '',
    isStreaming: false,
    hasError: false,
    errorMessage: null,
    wasTruncated: false,
  };

  private onUpdate: ((state: StreamingState) => void) | null = null;
  private maxSize: number;

  constructor(onUpdate?: (state: StreamingState) => void, maxSize = MAX_CONTENT_SIZE) {
    this.onUpdate = onUpdate || null;
    this.maxSize = maxSize;
  }

  getState(): StreamingState {
    return { ...this.state };
  }

  startStream(): void {
    this.state = {
      ast: null,
      partialContent: '',
      isStreaming: true,
      hasError: false,
      errorMessage: null,
      wasTruncated: false,
    };
    this.notify();
  }

  appendChunk(chunk: string): void {
    if (!this.state.isStreaming) {
      this.startStream();
    }

    // Check size limit before appending
    const newSize = this.state.partialContent.length + chunk.length;
    if (newSize > this.maxSize) {
      // Truncate chunk to fit
      const allowed = this.maxSize - this.state.partialContent.length;
      if (allowed > 0) {
        this.state.partialContent += chunk.slice(0, allowed);
      }
      this.state.wasTruncated = true;
      this.state.errorMessage = `Content truncated at ${this.maxSize} characters`;
    } else {
      this.state.partialContent += chunk;
    }

    // Attempt incremental parse
    try {
      const result = parsePartial(this.state.partialContent, this.state.ast || undefined);
      
      this.state.ast = result.ast;
      this.state.hasError = !result.success;
      
      // Only flag as error if there are actual errors (not just placeholders)
      if (result.ast.errors.length > 0) {
        const realErrors = result.ast.errors.filter(e => e.severity === 'error');
        if (realErrors.length > 0) {
          this.state.errorMessage = realErrors[0].message;
        }
      }
    } catch (e) {
      // Parse error — don't crash, just record
      this.state.hasError = true;
      this.state.errorMessage = e instanceof Error ? e.message : 'Parse error';
    }

    this.notify();
  }

  endStream(): void {
    this.state.isStreaming = false;
    
    // Final parse of complete content
    if (this.state.partialContent) {
      const result = parsePartial(this.state.partialContent);
      this.state.ast = result.ast;
      this.state.hasError = !result.success;
      if (result.ast.errors.length > 0) {
        const realErrors = result.ast.errors.filter(e => e.severity === 'error');
        if (realErrors.length > 0) {
          this.state.errorMessage = realErrors.map(e => `Line ${e.line}: ${e.message}`).join('\n');
        }
      }
    }

    this.notify();
  }

  reset(): void {
    this.state = {
      ast: null,
      partialContent: '',
      isStreaming: false,
      hasError: false,
      errorMessage: null,
      wasTruncated: false,
    };
    this.notify();
  }

  private notify(): void {
    this.onUpdate?.({ ...this.state });
  }
}

/** StreamingAdapter is the unified API. Factory removed to prevent API divergence. */
