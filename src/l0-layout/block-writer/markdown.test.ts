import { describe, it, expect } from 'vitest';
import { renderMarkdown, renderInlineMarkdown } from './markdown';

describe('block-writer/renderMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('renders headings h1–h6', () => {
    expect(renderMarkdown('# H1')).toContain('<h1 class="md-h md-h1">H1</h1>');
    expect(renderMarkdown('## H2')).toContain('<h2 class="md-h md-h2">H2</h2>');
    expect(renderMarkdown('###### H6')).toContain('<h6 class="md-h md-h6">H6</h6>');
  });

  it('renders blockquotes', () => {
    const html = renderMarkdown('> important quote');
    expect(html).toContain('<blockquote class="md-bq">important quote</blockquote>');
  });

  it('escapes HTML entities inside blockquotes', () => {
    const html = renderMarkdown('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders unordered list items grouped in ul', () => {
    const html = renderMarkdown('- a\n- b\n- c');
    expect(html).toContain('<ul class="md-ul">');
    expect(html).toContain('<li class="md-li">a</li>');
    expect(html).toContain('<li class="md-li">b</li>');
    expect(html).toContain('<li class="md-li">c</li>');
  });

  it('renders ordered list items grouped in ul', () => {
    const html = renderMarkdown('1. first\n2. second');
    expect(html).toContain('<ul class="md-ul">');
    expect(html).toContain('<li class="md-li">first</li>');
    expect(html).toContain('<li class="md-li">second</li>');
  });

  it('renders horizontal rules', () => {
    expect(renderMarkdown('---')).toContain('<hr class="md-hr">');
    expect(renderMarkdown('***')).toContain('<hr class="md-hr">');
  });

  it('renders paragraphs for plain text', () => {
    const html = renderMarkdown('just some text');
    expect(html).toContain('<p class="md-p">just some text</p>');
  });

  it('renders inline code', () => {
    const html = renderMarkdown('Use `console.log` for debugging');
    expect(html).toContain('<code class="md-code">console.log</code>');
  });

  it('renders wikilinks', () => {
    const html = renderMarkdown('See [[Target Page]]');
    expect(html).toContain('<span class="md-wiki">Target Page</span>');
  });

  it('renders labeled wikilinks', () => {
    const html = renderMarkdown('See [[Target Page|display text]]');
    expect(html).toContain('<span class="md-wiki">display text</span>');
  });

  it('renders bold and italic', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
  });

  it('renders strikethrough', () => {
    expect(renderMarkdown('~~deleted~~')).toContain('<del>deleted</del>');
  });

  it('renders empty lines as gap divs', () => {
    expect(renderMarkdown('')).toBe('');
    const html = renderMarkdown('before\n\nafter');
    expect(html).toContain('<div class="md-gap"></div>');
  });
});

describe('block-writer/renderInlineMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(renderInlineMarkdown('')).toBe('');
  });

  it('renders inline markdown without block elements', () => {
    const html = renderInlineMarkdown('**bold** and `code`');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code class="md-code">code</code>');
  });

  it('escapes HTML entities', () => {
    const html = renderInlineMarkdown('<em>tag</em>');
    expect(html).not.toContain('<em>tag</em>');
    expect(html).toContain('&lt;em&gt;tag&lt;/em&gt;');
  });
});
