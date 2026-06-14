/**
 * Minimal inline markdown → HTML conversion for the editor's preview pane.
 *
 * Intentionally lightweight (headings, bold/italic, inline code, list items,
 * line breaks) — not a full CommonMark renderer. Extracted from
 * MarkdownEditor.svelte so it can be unit-tested in isolation.
 */
export function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/gim, '<br>');
}
