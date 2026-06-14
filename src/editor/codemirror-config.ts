/**
 * CodeMirror configuration for MarkdownEditor.
 *
 * Holds the editor theme, the minimal base setup, and the extension-assembly
 * factory. Extracted from MarkdownEditor.svelte so the component stays focused
 * on reactive state and lifecycle. All exports here are pure (no Svelte runes).
 */

import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  type ViewUpdate
} from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autoFormat } from './extensions/autoformat';
import { expansion } from './extensions/expansion';
import { autocomplete } from './extensions/autocomplete';
import { spellcheck } from './extensions/spellcheck';
import type { CompletionSource } from './extensions/autocomplete';
import type { SpellCheckCorrection, SpellCheckDictionary } from './extensions/spellcheck';

/** Custom dark theme matching Atelier — uses CSS variables via style injection. */
export const atelierTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--color-bg-canvas)',
      color: 'var(--color-text-primary)',
      fontSize: '14px',
      fontFamily: 'var(--font-mono)'
    },
    '.cm-content': {
      caretColor: 'var(--color-accent)',
      padding: '16px'
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--color-accent)'
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--color-accent-subtle)'
    },
    '.cm-gutters': {
      backgroundColor: 'var(--color-bg-app)',
      borderRight: '1px solid var(--border-subtle)',
      color: 'var(--color-text-tertiary)'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--color-accent-subtle)',
      color: 'var(--color-accent)'
    },
    '.cm-selectionBackground': {
      backgroundColor: 'var(--color-accent-subtle)'
    }
  },
  { dark: true }
);

/** Minimal editor setup (replaces CodeMirror's `basicSetup`). */
export const minimalSetup: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  keymap.of(defaultKeymap),
  keymap.of(historyKeymap),
  drawSelection(),
  dropCursor(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine()
];

export interface EditorExtensionOptions {
  completionSource?: CompletionSource;
  spellCheckDictionary?: SpellCheckDictionary;
  /** Invoked when a spell-check correction marker is clicked. */
  onCorrectionClick: (correction: SpellCheckCorrection, view: EditorView, from: number, to: number) => void;
  /** Ctrl/Cmd-S. */
  onSave: () => void;
  /** Ctrl/Cmd-F. */
  onFind: () => void;
  /** Ctrl/Cmd-Shift-F. */
  onFindReplace: () => void;
  /** Invoked with the new document text whenever the doc changes. */
  onDocChanged: (content: string) => void;
}

/**
 * Assemble the full extension list for the markdown editor view. Keymap and
 * doc-change handling are wired through the supplied callbacks so the component
 * retains ownership of its reactive state.
 */
export function buildExtensions(options: EditorExtensionOptions): Extension[] {
  const {
    completionSource,
    spellCheckDictionary,
    onCorrectionClick,
    onSave,
    onFind,
    onFindReplace,
    onDocChanged
  } = options;

  const saveKeymap = keymap.of([
    { key: 'Ctrl-s', mac: 'Cmd-s', run: () => { onSave(); return true; } },
    { key: 'Ctrl-f', mac: 'Cmd-f', run: () => { onFind(); return true; } },
    { key: 'Ctrl-Shift-f', mac: 'Cmd-Shift-f', run: () => { onFindReplace(); return true; } }
  ]);

  return [
    minimalSetup,
    markdown(),
    atelierTheme,
    saveKeymap,
    autoFormat(),
    expansion(),
    ...(completionSource ? [autocomplete({ source: completionSource })] : []),
    ...(spellCheckDictionary ? spellcheck(spellCheckDictionary, { onCorrectionClick }) : []),
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        onDocChanged(update.state.doc.toString());
      }
    })
  ];
}
