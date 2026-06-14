import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import BlockContent from './BlockContent.svelte';

const markdown = [
  '# Heading',
  '',
  '> quote',
  '',
  '- alpha',
  '- beta',
  '',
  '---',
  '',
  'Use `code` and [[wiki|label]].'
].join('\n');

describe('BlockContent', () => {
  afterEach(() => cleanup());

  it('renders the contenteditable editor when editing', () => {
    const { container } = render(BlockContent, { isEditing: true, content: '' });
    expect(container.querySelector('.ds-block-editable')).not.toBeNull();
    expect(container.querySelector('.ds-block-editable')?.getAttribute('contenteditable')).toBe('true');
  });

  it('renders markdown as scoped rendered content when not editing', () => {
    const { container } = render(BlockContent, { content: markdown });
    expect(container.querySelector('.ds-block-rendered')).not.toBeNull();
    expect(container.querySelector('.md-h1')?.textContent).toBe('Heading');
    expect(Array.from(container.querySelectorAll('.md-li')).map(node => node.textContent)).toEqual(['alpha', 'beta']);
    expect(container.querySelector('.md-bq')?.textContent).toBe('quote');
    expect(container.querySelector('.md-hr')).not.toBeNull();
    expect(container.querySelector('.md-code')?.textContent).toBe('code');
    expect(container.querySelector('.md-wiki')?.textContent).toBe('label');
  });

  it('emits content changes from the editor', async () => {
    const handleChange = vi.fn();
    const { container } = render(BlockContent, { isEditing: true, onContentChange: handleChange });
    const editor = container.querySelector('.ds-block-editable')!;

    await fireEvent.input(editor, { target: { innerText: 'new content' } });

    expect(handleChange).toHaveBeenCalledWith('new content');
  });

  it('blurs the editor when Escape is pressed', async () => {
    const { container } = render(BlockContent, { isEditing: true });
    const editor = container.querySelector('.ds-block-editable')!;
    editor.focus();

    await fireEvent.keyDown(editor, { key: 'Escape' });

    expect(document.activeElement).not.toBe(editor);
  });
});
