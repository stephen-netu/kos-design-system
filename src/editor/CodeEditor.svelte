<script lang="ts">
  // wt-913: CodeEditor — CodeMirror 6 + language auto-detection
  // Detects language from cell source extension or content heuristics.
  // Falls back to plain text if no language matches.

  import { onMount, onDestroy } from 'svelte';
  import { EditorView, keymap } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
  import { LanguageDescription } from '@codemirror/language';
  import { languages } from '@codemirror/language-data';
  import type { Extension } from '@codemirror/state';

  interface Props {
    content: string;
    /** Source hint — file path or URL, used for language detection */
    source?: string;
    isActive: boolean;
    onContentChange?: (content: string) => void;
    onBlur?: () => void;
  }

  let { content, source = '', isActive, onContentChange, onBlur }: Props = $props();

  let container: HTMLElement | null = $state(null);
  let view: EditorView | null = null;
  let skipSync = false;
  let detectedLang = $state('text');

  // Detect language from source path/extension or content shebang
  async function detectLanguageExtension(): Promise<Extension> {
    // Try filename match
    if (source) {
      const filename = source.split('/').pop() ?? source;
      const match = LanguageDescription.matchFilename(languages, filename);
      if (match) {
        detectedLang = match.name;
        const lang = await match.load();
        return lang;
      }
    }

    // Try shebang heuristic
    const firstLine = content.split('\n')[0] ?? '';
    if (firstLine.startsWith('#!')) {
      const shebangs: Record<string, string> = {
        python: 'Python', node: 'JavaScript', ruby: 'Ruby',
        bash: 'Shell', sh: 'Shell', zsh: 'Shell',
      };
      for (const [key, langName] of Object.entries(shebangs)) {
        if (firstLine.includes(key)) {
          const match = LanguageDescription.matchLanguageName(languages, langName);
          if (match) {
            detectedLang = match.name;
            const lang = await match.load();
            return lang;
          }
        }
      }
    }

    // Try content-based heuristics
    if (/^(fn |pub fn |use |mod |impl |struct |enum |trait )/m.test(content)) {
      const rust = LanguageDescription.matchLanguageName(languages, 'Rust');
      if (rust) { detectedLang = 'Rust'; return await rust.load(); }
    }
    if (/^(import |export |const |let |var |function |class |interface )/m.test(content)) {
      const ts = LanguageDescription.matchLanguageName(languages, 'TypeScript');
      if (ts) { detectedLang = 'TypeScript'; return await ts.load(); }
    }
    if (/^(def |class |import |from |if __name__)/m.test(content)) {
      const py = LanguageDescription.matchLanguageName(languages, 'Python');
      if (py) { detectedLang = 'Python'; return await py.load(); }
    }

    detectedLang = 'text';
    return [];
  }

  // Loge dark theme (matches MarkdownEditor)
  const logeTheme = EditorView.theme({
    '&': { background: 'transparent', height: '100%', color: '#e8e0d0' },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: '11px',
      lineHeight: '1.6',
      overflow: 'auto',
    },
    '.cm-content': { padding: '6px 8px', caretColor: '#b87333' },
    '.cm-cursor': { borderLeftColor: '#b87333' },
    '.cm-focused': { outline: 'none' },
    '.cm-selectionBackground, ::selection': { background: 'rgba(184,115,51,0.2)' },
    '.cm-gutters': {
      background: '#1a1a1a',
      borderRight: '1px solid #2a2a2a',
      color: '#5a5248',
      fontSize: '10px',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 4px' },
    '.cm-activeLine': { background: 'rgba(184,115,51,0.05)' },
    '.cm-activeLineGutter': { background: 'rgba(184,115,51,0.08)' },
  }, { dark: true });

  onMount(async () => {
    if (!container) return;

    const langExtension = await detectLanguageExtension();

    const onEscape = keymap.of([{
      key: 'Escape',
      run: () => { onBlur?.(); return true; },
    }]);

    view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          onEscape,
          langExtension,
          logeTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              skipSync = true;
              onContentChange?.(update.state.doc.toString());
            }
          }),
          EditorView.lineWrapping,
        ],
      }),
      parent: container,
    });

    if (isActive) view.focus();
  });

  $effect(() => {
    if (!view || skipSync) { skipSync = false; return; }
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  });

  $effect(() => {
    if (view && isActive) view.focus();
  });

  onDestroy(() => view?.destroy());
</script>

<div class="code-editor" bind:this={container}>
  {#if detectedLang !== 'text'}
    <div class="code-editor-lang-badge">{detectedLang}</div>
  {/if}
</div>

<style>
  .code-editor {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background: #1a1a1a;
  }

  :global(.code-editor .cm-editor) {
    width: 100%;
    height: 100%;
  }

  .code-editor-lang-badge {
    position: absolute;
    top: 4px;
    right: 6px;
    font-family: var(--font-mono, monospace);
    font-size: 8px;
    color: var(--color-text-muted, #a09880);
    opacity: 0.4;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    pointer-events: none;
    z-index: 1;
  }
</style>
