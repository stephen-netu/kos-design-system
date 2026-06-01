import { describe, it, expect, afterEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { history, undo, redo } from '@codemirror/commands';
import { autoFormat } from './autoformat';

function createView(doc: string = ''): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc,
            extensions: [autoFormat(), history()],
        }),
        parent: document.body,
    });
}

function typeAt(view: EditorView, text: string, pos?: number): void {
    const position = pos ?? view.state.doc.length;
    view.dispatch({ changes: { from: position, insert: text } });
}

describe('autoFormat', () => {
    let view: EditorView;

    afterEach(() => {
        if (view) view.destroy();
    });

    describe('ellipsis replacement (...)', () => {
        it('replaces ... with … typed one char at a time', () => {
            view = createView();
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('.');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('..');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('\u2026');
        });

        it('replaces ... appended to existing text', () => {
            view = createView('hello ');
            typeAt(view, '.');
            typeAt(view, '.');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('hello \u2026');
        });

        it('does not replace partial .. (only two dots)', () => {
            view = createView();
            typeAt(view, '.');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('..');
        });

        it('handles multiple ellipses in sequence', () => {
            view = createView();
            typeAt(view, '.');
            typeAt(view, '.');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('\u2026');
            typeAt(view, ' ');
            typeAt(view, '.');
            typeAt(view, '.');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('\u2026 \u2026');
        });

        it('handles ellipsis after other replaced text', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toContain('\u2014');
            typeAt(view, ' ');
            typeAt(view, '.');
            typeAt(view, '.');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toContain('\u2026');
        });
    });

    describe('arrow replacement (-> and <-)', () => {
        it('replaces --> with →', () => {
            view = createView();
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('--');
            typeAt(view, '>');
            expect(view.state.doc.toString()).toBe('\u2192');
        });

        it('replaces <- with ←', () => {
            view = createView();
            typeAt(view, '<');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('\u2190');
        });

        it('handles arrow after text', () => {
            view = createView('go');
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '>');
            expect(view.state.doc.toString()).toBe('go\u2192');
        });

        it('handles left arrow after text', () => {
            view = createView('back');
            typeAt(view, '<');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('back\u2190');
        });
    });

    describe('em dash replacement (---)', () => {
        it('replaces --- with —', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('\u2014');
        });

        it('em dash after text', () => {
            view = createView('word');
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('word\u2014');
        });

        it('double hyphen is not replaced', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('--');
        });

        it('four hyphens produce em dash + hyphen', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('\u2014-');
        });
    });

    describe('smart double quotes', () => {
        it('opens quote at position 0', () => {
            view = createView();
            typeAt(view, '"');
            expect(view.state.doc.toString()).toBe('\u201C');
        });

        it('opens quote after space', () => {
            view = createView('say ');
            typeAt(view, '"');
            expect(view.state.doc.toString()).toBe('say \u201C');
        });

        it('closes quote after word character', () => {
            view = createView('word');
            typeAt(view, '"');
            expect(view.state.doc.toString()).toBe('word\u201D');
        });

        it('closes quote after opening quote', () => {
            view = createView();
            typeAt(view, '"');
            typeAt(view, '"');
            expect(view.state.doc.toString()).toBe('\u201C\u201D');
        });

        it('opens quote after space following closing quote', () => {
            view = createView();
            typeAt(view, '"');
            typeAt(view, '"');
            typeAt(view, ' ');
            typeAt(view, '"');
            expect(view.state.doc.toString()).toBe('\u201C\u201D \u201C');
        });

        it('wraps a word with smart quotes', () => {
            view = createView('say ');
            typeAt(view, '"');
            typeAt(view, 'hi');
            typeAt(view, '"');
            expect(view.state.doc.toString()).toBe('say \u201Chi\u201D');
        });
    });

    describe('smart single quotes and apostrophes', () => {
        it('opens after space', () => {
            view = createView(' ');
            typeAt(view, "'");
            expect(view.state.doc.toString()).toBe(' \u2018');
        });

        it('apostrophe after word character', () => {
            view = createView('don');
            typeAt(view, "'");
            expect(view.state.doc.toString()).toBe('don\u2019');
        });

        it("handles it's correctly", () => {
            view = createView('it');
            typeAt(view, "'");
            expect(view.state.doc.toString()).toBe('it\u2019');
            typeAt(view, 's');
            expect(view.state.doc.toString()).toBe('it\u2019s');
        });

        it('opens at position 0', () => {
            view = createView();
            typeAt(view, "'");
            expect(view.state.doc.toString()).toBe('\u2018');
        });
    });

    describe('no infinite re-filtering', () => {
        it('replacement is stable after ellipsis', () => {
            view = createView();
            typeAt(view, '.');
            typeAt(view, '.');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('\u2026');
            typeAt(view, 'x');
            expect(view.state.doc.toString()).toBe('\u2026x');
        });

        it('replacement is stable after arrow', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '>');
            expect(view.state.doc.toString()).toBe('\u2192');
            typeAt(view, 'x');
            expect(view.state.doc.toString()).toBe('\u2192x');
        });

        it('replacement is stable after em dash', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('\u2014');
            typeAt(view, 'x');
            expect(view.state.doc.toString()).toBe('\u2014x');
        });

        it('smart quote replacement is stable', () => {
            view = createView();
            typeAt(view, '"');
            expect(view.state.doc.toString()).toBe('\u201C');
            typeAt(view, 'a');
            expect(view.state.doc.toString()).toBe('\u201Ca');
        });

        it('apostrophe replacement is stable', () => {
            view = createView('don');
            typeAt(view, "'");
            expect(view.state.doc.toString()).toBe('don\u2019');
            typeAt(view, 't');
            expect(view.state.doc.toString()).toBe('don\u2019t');
        });
    });

    describe('no replacement for non-trigger patterns', () => {
        it('plain text passes through unchanged', () => {
            view = createView();
            typeAt(view, 'hi');
            expect(view.state.doc.toString()).toBe('hi');
        });

        it('single hyphen is unchanged', () => {
            view = createView();
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('-');
        });

        it('single < is unchanged', () => {
            view = createView();
            typeAt(view, '<');
            expect(view.state.doc.toString()).toBe('<');
        });

        it('double hyphen stays as --', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('--');
        });
    });

    describe('multi-character insertion (paste)', () => {
        it('skips pasted multi-char text', () => {
            view = createView('hello');
            typeAt(view, ' world...end');
            expect(view.state.doc.toString()).toBe('hello world...end');
        });

        it('handles paste followed by single-char trigger', () => {
            view = createView('pre');
            typeAt(view, '--');
            expect(view.state.doc.toString()).toBe('pre--');
            typeAt(view, '>');
            expect(view.state.doc.toString()).toBe('pre\u2192');
        });
    });

    describe('undo/redo', () => {
        it('undo reverts an ellipsis replacement', () => {
            view = createView();
            typeAt(view, '.');
            typeAt(view, '.');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('\u2026');
            undo({ state: view.state, dispatch: view.dispatch });
            expect(view.state.doc.toString()).not.toBe('\u2026');
        });

        it('undo reverts an em dash replacement', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('\u2014');
            undo({ state: view.state, dispatch: view.dispatch });
            expect(view.state.doc.toString()).not.toBe('\u2014');
        });

        it('undo reverts a smart quote replacement', () => {
            view = createView(' ');
            typeAt(view, '"');
            expect(view.state.doc.toString()).toBe(' \u201C');
            undo({ state: view.state, dispatch: view.dispatch });
            expect(view.state.doc.toString()).not.toBe(' \u201C');
        });

        it('redo re-applies after undo', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('\u2014');
            undo({ state: view.state, dispatch: view.dispatch });
            redo({ state: view.state, dispatch: view.dispatch });
            expect(view.state.doc.toString()).toBe('\u2014');
        });
    });

    describe('edge cases', () => {
        it('empty document', () => {
            view = createView('');
            expect(view.state.doc.toString()).toBe('');
        });

        it('single chars that are not triggers', () => {
            view = createView();
            typeAt(view, '-');
            expect(view.state.doc.toString()).toBe('-');
            typeAt(view, '<');
            expect(view.state.doc.toString()).toBe('-<');
        });

        it('replacement after existing text', () => {
            view = createView('abc');
            typeAt(view, '.');
            typeAt(view, '.');
            typeAt(view, '.');
            expect(view.state.doc.toString()).toBe('abc\u2026');
        });

        it('arrow after em dash in one session', () => {
            view = createView();
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '-');
            expect(view.state.doc.toString()).toContain('\u2014');
            typeAt(view, ' ');
            typeAt(view, '-');
            typeAt(view, '-');
            typeAt(view, '>');
            expect(view.state.doc.toString()).toContain('\u2192');
        });
    });
});
