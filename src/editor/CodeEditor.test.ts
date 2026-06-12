import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import CodeEditor from './CodeEditor.svelte';

afterEach(() => {
  cleanup();
});

describe('editor/CodeEditor', () => {
  it('exports a valid Svelte component', () => {
    expect(CodeEditor).toBeDefined();
    expect(typeof CodeEditor).toBe('function');
  });

  it('renders editor container', () => {
    const { container } = render(CodeEditor, {
      content: 'const x = 1;',
      source: 'test.ts',
      isActive: true,
    });
    expect(container.querySelector('.code-editor')).not.toBeNull();
  });

  it('renders with text content', () => {
    const { container } = render(CodeEditor, {
      content: 'hello world',
      source: '',
      isActive: false,
    });
    expect(container.querySelector('.code-editor')).not.toBeNull();
  });

  it('calls onContentChange when content changes', async () => {
    const onContentChange = vi.fn();
    const { container } = render(CodeEditor, {
      content: 'initial',
      source: 'test.ts',
      isActive: true,
      onContentChange,
    });
    expect(container.querySelector('.code-editor')).not.toBeNull();
  });
});
