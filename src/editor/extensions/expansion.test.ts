import { describe, it, expect, afterEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { history, undo, redo } from '@codemirror/commands';
import { expansion } from './expansion';

function createView(doc: string = '', extensions: any[] = []): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc,
            extensions: [expansion(), history(), ...extensions],
        }),
        parent: document.body,
    });
}

function typeAt(view: EditorView, text: string, pos?: number): void {
    const position = pos ?? view.state.doc.length;
    view.dispatch({ changes: { from: position, insert: text } });
}

describe('expansion', () => {
    let view: EditorView;

    afterEach(() => {
        if (view) view.destroy();
    });

    describe('built-in expansions', () => {
        it('expands "sig" to "signature" when space is typed', () => {
            view = createView();
            typeAt(view, 'sig');
            expect(view.state.doc.toString()).toBe('sig');
            typeAt(view, ' ');
            expect(view.state.doc.toString()).toBe('signature ');
        });

        it('expands "impl" to "implementation"', () => {
            view = createView();
            typeAt(view, 'impl ');
            expect(view.state.doc.toString()).toBe('implementation ');
        });

        it('expands "config" to "configuration"', () => {
            view = createView();
            typeAt(view, 'config ');
            expect(view.state.doc.toString()).toBe('configuration ');
        });

        it('expands "docs" to "documentation"', () => {
            view = createView();
            typeAt(view, 'docs ');
            expect(view.state.doc.toString()).toBe('documentation ');
        });

        it('expands "async" to "asynchronous"', () => {
            view = createView();
            typeAt(view, 'async ');
            expect(view.state.doc.toString()).toBe('asynchronous ');
        });
    });

    describe('preserves trigger character', () => {
        it('preserves space after expansion', () => {
            view = createView();
            typeAt(view, 'test sig ');
            expect(view.state.doc.toString()).toBe('test signature ');
        });

        it('preserves tab after expansion', () => {
            view = createView();
            typeAt(view, 'sig\t');
            expect(view.state.doc.toString()).toBe('signature\t');
        });
    });

    describe('no expansion for non-matching words', () => {
        it('does not expand unknown words', () => {
            view = createView();
            typeAt(view, 'hello ');
            expect(view.state.doc.toString()).toBe('hello ');
        });

        it('does not expand partial matches', () => {
            view = createView();
            typeAt(view, 'si ');
            expect(view.state.doc.toString()).toBe('si ');
        });

        it('does not expand when no space is typed', () => {
            view = createView();
            typeAt(view, 'sig');
            expect(view.state.doc.toString()).toBe('sig');
        });

        it('does not trigger on non-space characters', () => {
            view = createView();
            typeAt(view, 'sig.');
            expect(view.state.doc.toString()).toBe('sig.');
        });
    });

    describe('context awareness', () => {
        it('expands in middle of text', () => {
            view = createView();
            typeAt(view, 'the config ');
            expect(view.state.doc.toString()).toBe('the configuration ');
        });

        it('expands multiple words in sequence', () => {
            view = createView();
            typeAt(view, 'sig ');
            typeAt(view, 'impl ');
            expect(view.state.doc.toString()).toBe('signature implementation ');
        });

        it('handles expansion at start of line', () => {
            view = createView();
            typeAt(view, 'docs ');
            expect(view.state.doc.toString()).toBe('documentation ');
        });
    });

    describe('custom dictionary', () => {
        it('expands custom dictionary entries', () => {
            const customExp = expansion({ 'bp': 'best practice' });
            view = new EditorView({
                state: EditorState.create({
                    doc: '',
                    extensions: [customExp, history()],
                }),
                parent: document.body,
            });
            typeAt(view, 'bp ');
            expect(view.state.doc.toString()).toBe('best practice ');
            view.destroy();
        });

        it('custom entries override built-in entries', () => {
            const customExp = expansion({ 'sig': 'signal' });
            view = new EditorView({
                state: EditorState.create({
                    doc: '',
                    extensions: [customExp, history()],
                }),
                parent: document.body,
            });
            typeAt(view, 'sig ');
            expect(view.state.doc.toString()).toBe('signal ');
            view.destroy();
        });
    });

    describe('no infinite re-filtering', () => {
        it('expanded text is stable', () => {
            view = createView();
            typeAt(view, 'sig ');
            expect(view.state.doc.toString()).toBe('signature ');
            typeAt(view, 'x');
            expect(view.state.doc.toString()).toBe('signature x');
        });

        it('multiple expansions are stable', () => {
            view = createView();
            typeAt(view, 'sig ');
            expect(view.state.doc.toString()).toBe('signature ');
            typeAt(view, 'impl ');
            expect(view.state.doc.toString()).toBe('signature implementation ');
        });
    });

    describe('multi-character insertion', () => {
        it('skips pasted text (no expansion)', () => {
            view = createView('hello');
            typeAt(view, ' sig ', 5);
            expect(view.state.doc.toString()).toBe('hello sig ');
        });
    });

    describe('edge cases', () => {
        it('empty document with space', () => {
            view = createView();
            typeAt(view, ' ');
            expect(view.state.doc.toString()).toBe(' ');
        });

        it('single character abbreviation with space', () => {
            view = createView();
            typeAt(view, 'x ');
            expect(view.state.doc.toString()).toBe('x ');
        });

        it('word boundary detection', () => {
            view = createView();
            typeAt(view, 'reconfig ');
            expect(view.state.doc.toString()).toBe('reconfig ');
        });
    });
});
