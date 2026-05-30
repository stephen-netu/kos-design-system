// BlockWriter — shared regex markdown renderer
// Unified from DeskViewport.svelte (lines 60-92) and Atelier's MarkdownWithProvenance.svelte (lines 15-85).
// Zero dependencies — pure regex transforms.
//
// DeskViewport adds: ~~del~~, [[wikilink]] support, * and _ emphasis
// Atelier adds: proper <li>/<ul> grouping, <p> wrapping for paragraphs
// Both: headings, blockquotes, hr, inline code/bold/italic

/** Escape all 5 HTML entities. Atelier's version (full) merged with DeskViewport's (3-char). */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Inline markdown — bold, italic, del, code, wikilinks. Input is pre-escaped. */
function renderInline(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*<\n]{1,200})\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_([^_<\n]{1,200})_/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`([^`]{1,200})`/g, '<code class="md-code">$1</code>')
    .replace(/\[\[([^\]|]{1,100})\|([^\]]{1,100})\]\]/g, '<span class="md-wiki">$2</span>')
    .replace(/\[\[([^\]]{1,100})\]\]/g, '<span class="md-wiki">$1</span>');
}

/**
 * Render markdown to HTML string.
 * Handles: headings (h1-h6), unordered lists, ordered lists, blockquotes, hr,
 * inline code/bold/italic/del/wikilinks.
 *
 * Input is treated as untrusted — all HTML entities are escaped before processing.
 * Output is safe for {@html} without additional sanitization.
 */
export function renderMarkdown(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  const processed: string[] = [];

  for (const line of lines) {
    const escaped = escapeHtml(line);

    // Headings
    const hm = escaped.match(/^(#{1,6}) (.+)$/);
    if (hm) {
      processed.push(`<h${hm[1].length} class="md-h md-h${hm[1].length}">${renderInline(hm[2])}</h${hm[1].length}>`);
      continue;
    }

    // Unordered list items
    const ul = escaped.match(/^[-*+] (.+)$/);
    if (ul) {
      processed.push(`<li class="md-li">${renderInline(ul[1])}</li>`);
      continue;
    }

    // Ordered list items
    const ol = escaped.match(/^(\d+)\. (.+)$/);
    if (ol) {
      processed.push(`<li class="md-li">${renderInline(ol[2])}</li>`);
      continue;
    }

    // Blockquotes
    const bq = escaped.match(/^> (.+)$/);
    if (bq) {
      processed.push(`<blockquote class="md-bq">${renderInline(bq[1])}</blockquote>`);
      continue;
    }

    // Horizontal rule
    if (/^[-*]{3,}$/.test(escaped.trim())) {
      processed.push('<hr class="md-hr">');
      continue;
    }

    // Empty line
    if (escaped.trim() === '') {
      processed.push('<div class="md-gap"></div>');
      continue;
    }

    // Default: paragraph
    processed.push(`<p class="md-p">${renderInline(escaped)}</p>`);
  }

  // Group consecutive <li> elements into <ul> (Atelier pattern)
  let result = processed.join('\n');
  result = result.replace(/(<li class="md-li">.*?<\/li>\n?)+/g, (match) => {
    return `<ul class="md-ul">${match}</ul>`;
  });

  return result;
}

/**
 * Render inline-only markdown (no block elements).
 * Useful for single-line content like block titles, annotations, tooltips.
 * Input is treated as untrusted.
 */
export function renderInlineMarkdown(text: string): string {
  return renderInline(escapeHtml(text));
}
