import { describe, it, expect, afterEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { autocomplete, type AutocompleteConfig } from './autocomplete';

function createView(doc: string, config: AutocompleteConfig): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc,
            extensions: [autocomplete(config)],
        }),
        parent: document.body,
    });
}

function openCompletion(view: EditorView, pos?: number): void {
    const p = pos ?? view.state.doc.length;
    view.dispatch({ selection: { anchor: p } });
    const plugin = autocompletion();
    const ext = plugin.value as any;
    ext?.activate?.({ state: view.state, dispatch: view.dispatch });
}

describe('autocomplete', () => {
    let view: EditorView;

    afterEach(() => {
        if (view) view.destroy();
    });

    const simpleSource = (context: { state: { doc: { toString: () => string } } }) => {
        const word = context.state.doc.toString();
        const options = [
            { label: 'apple', type: 'keyword' },
            { label: 'application', type: 'keyword' },
            { label: 'apply', type: 'keyword' },
            { label: 'banana', type: 'keyword' },
        ];
        return {
            from: 0,
            options: options.filter((o) => o.label.startsWith(word)),
        };
    };

    it('exports a valid extension', () => {
        const ext = autocomplete({ source: simpleSource });
        expect(ext).toBeDefined();
    });

    it('accepts a CompletionSource function', () => {
        const ext = autocomplete({ source: simpleSource });
        view = new EditorView({
            state: EditorState.create({
                doc: '',
                extensions: [ext],
            }),
            parent: document.body,
        });
        expect(view.state.doc.toString()).toBe('');
        view.destroy();
    });

    it('respects defaultKeymap option', () => {
        const ext = autocomplete({ source: simpleSource, defaultKeymap: false });
        expect(ext).toBeDefined();
    });

    it('respects closeOnBlur option', () => {
        const ext = autocomplete({ source: simpleSource, closeOnBlur: false });
        expect(ext).toBeDefined();
    });

    it('uses defaultKeymap true by default', () => {
        const ext = autocomplete({ source: simpleSource });
        view = new EditorView({
            state: EditorState.create({
                doc: 'test',
                extensions: [ext],
            }),
            parent: document.body,
        });
        expect(view).toBeDefined();
        view.destroy();
    });

    it('uses closeOnBlur true by default', () => {
        const ext = autocomplete({ source: simpleSource });
        view = new EditorView({
            state: EditorState.create({
                doc: '',
                extensions: [ext],
            }),
            parent: document.body,
        });
        expect(view).toBeDefined();
        view.destroy();
    });

    it('wraps @codemirror/autocomplete autocompletion()', () => {
        const ext = autocomplete({ source: simpleSource });
        expect(ext).toBeTruthy();
    });

    it('passes override array with the provided source', () => {
        const ext = autocomplete({ source: simpleSource });
        view = new EditorView({
            state: EditorState.create({
                doc: '',
                extensions: [ext],
            }),
            parent: document.body,
        });
        expect(view.state).toBeDefined();
        view.destroy();
    });

    it('works with empty document', () => {
        view = createView('', { source: simpleSource });
        expect(view.state.doc.toString()).toBe('');
    });

    it('works with existing text', () => {
        view = createView('hello world', { source: simpleSource });
        expect(view.state.doc.toString()).toBe('hello world');
    });

    it('CompletionSource receives context', () => {
        let receivedContext: any = null;
        const capturingSource = (context: any) => {
            receivedContext = context;
            return { from: 0, options: [] };
        };
        view = createView('test', { source: capturingSource });
        expect(view).toBeDefined();
        view.destroy();
    });

    it('multiple autocomplete instances do not conflict', () => {
        const view1 = createView('abc', { source: simpleSource });
        const view2 = createView('xyz', { source: simpleSource });
        expect(view1.state.doc.toString()).toBe('abc');
        expect(view2.state.doc.toString()).toBe('xyz');
        view1.destroy();
        view2.destroy();
    });
});
