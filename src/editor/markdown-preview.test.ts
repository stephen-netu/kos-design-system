import { describe, it, expect } from 'vitest';
import { markdownToHtml } from './markdown-preview';

describe('editor/markdownToHtml', () => {
  it('returns an empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
  });

  it('converts h1/h2/h3 headings', () => {
    expect(markdownToHtml('# Title')).toBe('<h1>Title</h1>');
    expect(markdownToHtml('## Title')).toBe('<h2>Title</h2>');
    expect(markdownToHtml('### Title')).toBe('<h3>Title</h3>');
  });

  it('converts bold and italic', () => {
    expect(markdownToHtml('**bold**')).toBe('<strong>bold</strong>');
    expect(markdownToHtml('*italic*')).toBe('<em>italic</em>');
  });

  it('converts inline code', () => {
    expect(markdownToHtml('`code`')).toBe('<code>code</code>');
  });

  it('wraps a run of list items in a <ul>', () => {
    const html = markdownToHtml('- a\n- b');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>a</li>');
    expect(html).toContain('<li>b</li>');
  });

  it('converts newlines to <br>', () => {
    expect(markdownToHtml('line1\nline2')).toBe('line1<br>line2');
  });

  it('leaves plain text untouched', () => {
    expect(markdownToHtml('just text')).toBe('just text');
  });

  it('handles mixed content', () => {
    const html = markdownToHtml('# Heading\nSome **bold** and `code`.');
    expect(html).toContain('<h1>Heading</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<br>');
  });
});
