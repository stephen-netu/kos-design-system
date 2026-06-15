import { onDestroy, onMount } from 'svelte';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { buildExtensions } from './codemirror-config';
import type { CompletionSource } from './extensions/autocomplete';
import type { SpellCheckCorrection, SpellCheckDictionary } from './extensions/spellcheck';

export interface UseCodeMirrorOptions {
  getContainer: () => HTMLDivElement;
  getInitialContent: () => string;
  completionSource: () => CompletionSource | undefined;
  spellCheckDictionary: () => SpellCheckDictionary | undefined;
  onCorrectionClick: (correction: SpellCheckCorrection, view: EditorView, from: number, to: number) => void;
  onSave: () => void;
  onFind: () => void;
  onFindReplace: () => void;
  onDocChanged: (content: string) => void;
  onEditorReady?: (view: EditorView) => void;
  onEditorDestroy?: () => void;
}

export interface UseCodeMirrorApi {
  getView: () => EditorView | null;
  syncContent: (content: string) => void;
  focus: () => void;
}

export function useCodeMirror(options: UseCodeMirrorOptions): UseCodeMirrorApi {
  let view: EditorView | null = null;

  function destroyView() {
    view?.destroy();
    view = null;
    options.onEditorDestroy?.();
  }

  onMount(() => {
    const extensions = buildExtensions({
      completionSource: options.completionSource(),
      spellCheckDictionary: options.spellCheckDictionary(),
      onCorrectionClick: options.onCorrectionClick,
      onSave: options.onSave,
      onFind: options.onFind,
      onFindReplace: options.onFindReplace,
      onDocChanged: options.onDocChanged
    });

    view = new EditorView({
      state: EditorState.create({ doc: options.getInitialContent(), extensions }),
      parent: options.getContainer()
    });

    options.onEditorReady?.(view);
  });

  onDestroy(destroyView);

  return {
    getView: () => view,
    syncContent(content) {
      if (!view || content === view.state.doc.toString()) return;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } });
    },
    focus() {
      view?.focus();
    }
  };
}
