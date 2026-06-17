<script lang="ts">
  // wt-913: CodeEditor — CodeMirror 6 + language auto-detection
  // Detects language from cell source extension or content heuristics.
  // Falls back to plain text if no language matches.

  import { onMount, onDestroy } from 'svelte';
  import { EditorView, keymap, type ViewUpdate } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
  import { LanguageDescription } from '@codemirror/language';
  import { languages } from '@codemirror/language-data';
  import type { Extension } from '@codemirror/state';
  import { autoFormat } from './extensions/autoformat';
  import { expansion } from './extensions/expansion';
  import { autocomplete } from './extensions/autocomplete';
  import { spellcheck } from './extensions/spellcheck';
  import CorrectionTooltip from './components/CorrectionTooltip.svelte';
  import { resolveAccentRamp } from '../p0-primitives/canvas-theme.js';
  import type { CompletionSource } from './extensions/autocomplete';
  import type { SpellCheckCorrection, SpellCheckDictionary } from './extensions/spellcheck';

  interface Props {
    content: string;
    source?: string;
    isActive: boolean;
    onContentChange?: (content: string) => void;
    onBlur?: () => void;
    completionSource?: CompletionSource;
    spellCheckDictionary?: SpellCheckDictionary;
  }

  interface ActiveCorrection extends SpellCheckCorrection {
    from: number;
    to: number;
  }

  let { content, source = '', isActive, onContentChange, onBlur, completionSource, spellCheckDictionary }: Props = $props();

  let container: HTMLElement | null = $state(null);
  let view: EditorView | null = null;
  let skipSync = false;
  let detectedLang = $state('text');
  let activeCorrection = $state<ActiveCorrection | null>(null);

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

  async function handleCorrectionClick(
    correction: SpellCheckCorrection,
    _view: EditorView,
    from: number,
    to: number
  ) {
    activeCorrection = { ...correction, from, to };
  }

  function handleAcceptCorrection(suggestion: string) {
    if (!activeCorrection || !view) return;
    view.dispatch({
      changes: { from: activeCorrection.from, to: activeCorrection.to, insert: suggestion },
    });
    activeCorrection = null;
  }

  function handleAddWordToDictionary() {
    if (!activeCorrection) return;
    spellCheckDictionary?.addWord(activeCorrection.original);
    activeCorrection = null;
  }

  function handleDismissCorrection() {
    activeCorrection = null;
  }

  // Loge dark theme — built from runtime CSS tokens so the user's accent
  // and any overriding ThemeProvider are respected. Constructed in onMount
  // where the DOM is available for getComputedStyle.
  function buildLogeTheme(): Extension {
    const acc = resolveAccentRamp(document.documentElement);
    const cs = getComputedStyle(document.documentElement);
    const rv = (p: string, fb: string) => cs.getPropertyValue(p).trim() || fb;
    return EditorView.theme({
      '&': { background: 'transparent', height: '100%', color: rv('--color-text-primary', '#e7e9eb') },
      '.cm-scroller': {
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        lineHeight: '1.6',
        overflow: 'auto',
      },
      '.cm-content': { padding: '6px 8px', caretColor: acc.solid },
      '.cm-cursor': { borderLeftColor: acc.solid },
      '.cm-focused': { outline: 'none' },
      '.cm-selectionBackground, ::selection': { background: acc.alpha(0.2) },
      '.cm-gutters': {
        background: rv('--color-bg-app', '#0a0b0c'),
        borderRight: `1px solid ${rv('--border-default', '#262b30')}`,
        color: rv('--color-text-tertiary', '#646b72'),
        fontSize: '10px',
      },
      '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 4px' },
      '.cm-activeLine': { background: acc.alpha(0.05) },
      '.cm-activeLineGutter': { background: acc.alpha(0.08) },
    }, { dark: true });
  }
  // Placeholder until onMount — replaced before EditorView construction.
  let logeTheme: Extension = [];

  onMount(async () => {
    if (!container) return;

    // Build theme now that DOM is available — accent reads --accent-primary.
    logeTheme = buildLogeTheme();

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
          autoFormat(),
          expansion(),
          ...(completionSource ? [autocomplete({ source: completionSource })] : []),
          ...(spellCheckDictionary ? spellcheck(spellCheckDictionary, { onCorrectionClick: handleCorrectionClick }) : []),
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged) {
              skipSync = true;
              activeCorrection = null;
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

{#if activeCorrection}
  <CorrectionTooltip
    correction={{ original: activeCorrection.original, suggestions: activeCorrection.suggestions }}
    position={activeCorrection.position}
    onAccept={handleAcceptCorrection}
    onDismiss={handleDismissCorrection}
    onAddToDictionary={handleAddWordToDictionary}
  />
{/if}

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
