import { describe, it, expect, afterEach, vi } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { spellcheck, extractWords, type SpellCheckDictionary } from './spellcheck';

function createMockDictionary(knownWords: string[] = []): SpellCheckDictionary {
    const words = new Set(knownWords.map((w) => w.toLowerCase()));
    const personalWords: string[] = [];
    return {
        check: (word: string) => words.has(word.toLowerCase()) || personalWords.includes(word.toLowerCase()),
        suggest: (word: string) => {
            const lower = word.toLowerCase();
            return knownWords
                .filter((w) => w.toLowerCase() !== lower && w.toLowerCase().startsWith(lower.charAt(0)))
                .slice(0, 5);
        },
        addWord: (word: string) => {
            personalWords.push(word.toLowerCase());
        },
    };
}

function createView(doc: string, dictionary: SpellCheckDictionary): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc,
            extensions: [spellcheck(dictionary)],
        }),
        parent: document.body,
    });
}

describe('extractWords', () => {
    it('extracts a single word', () => {
        const result = extractWords('hello');
        expect(result).toEqual([{ word: 'hello', from: 0, to: 5 }]);
    });

    it('extracts multiple words separated by spaces', () => {
        const result = extractWords('hello world');
        expect(result).toEqual([
            { word: 'hello', from: 0, to: 5 },
            { word: 'world', from: 6, to: 11 },
        ]);
    });

    it('skips non-alpha characters', () => {
        const result = extractWords('hello 123 world');
        expect(result).toEqual([
            { word: 'hello', from: 0, to: 5 },
            { word: 'world', from: 10, to: 15 },
        ]);
    });

    it('handles empty string', () => {
        expect(extractWords('')).toEqual([]);
    });

    it('handles string with no alpha characters', () => {
        expect(extractWords('123 456 !@#')).toEqual([]);
    });

    it('includes apostrophes in words', () => {
        const result = extractWords("don't");
        expect(result).toEqual([{ word: "don't", from: 0, to: 5 }]);
    });

    it('respects maxWords limit', () => {
        const text = 'a b c d e f g h i j';
        const result = extractWords(text, 3);
        expect(result.length).toBe(3);
    });

    it('tracks correct from/to positions', () => {
        const result = extractWords('  hello  world  ');
        expect(result).toEqual([
            { word: 'hello', from: 2, to: 7 },
            { word: 'world', from: 9, to: 14 },
        ]);
    });

    it('handles single character words', () => {
        const result = extractWords('a b c');
        expect(result).toEqual([
            { word: 'a', from: 0, to: 1 },
            { word: 'b', from: 2, to: 3 },
            { word: 'c', from: 4, to: 5 },
        ]);
    });

    it('handles mixed case', () => {
        const result = extractWords('Hello WORLD');
        expect(result).toEqual([
            { word: 'Hello', from: 0, to: 5 },
            { word: 'WORLD', from: 6, to: 11 },
        ]);
    });
});

describe('spellcheck', () => {
    let view: EditorView;

    afterEach(() => {
        if (view) view.destroy();
    });

    it('returns an array of extensions', () => {
        const dict = createMockDictionary(['hello']);
        const exts = spellcheck(dict);
        expect(Array.isArray(exts)).toBe(true);
        expect(exts.length).toBeGreaterThan(0);
    });

    it('returns a linter extension', () => {
        const dict = createMockDictionary(['hello']);
        const exts = spellcheck(dict);
        expect(exts.length).toBe(1);
    });

    it('includes click handler when onCorrectionClick is provided', () => {
        const dict = createMockDictionary(['hello']);
        const exts = spellcheck(dict, { onCorrectionClick: vi.fn() });
        expect(exts.length).toBe(2);
    });

    it('works with empty document', () => {
        const dict = createMockDictionary(['hello']);
        view = createView('', dict);
        expect(view.state.doc.toString()).toBe('');
    });

    it('works with known words only', () => {
        const dict = createMockDictionary(['hello', 'world']);
        view = createView('hello world', dict);
        expect(view.state.doc.toString()).toBe('hello world');
    });

    it('works with unknown words', () => {
        const dict = createMockDictionary(['hello']);
        view = createView('hello xyzzy', dict);
        expect(view.state.doc.toString()).toBe('hello xyzzy');
    });

    it('accepts a SpellCheckDictionary interface', () => {
        const dict: SpellCheckDictionary = {
            check: () => true,
            suggest: () => [],
            addWord: () => {},
        };
        const exts = spellcheck(dict);
        expect(exts.length).toBeGreaterThan(0);
    });

    it('accepts async check and suggest', () => {
        const dict: SpellCheckDictionary = {
            check: async (word: string) => word === 'hello',
            suggest: async (word: string) => ['help', 'hell'],
            addWord: () => {},
        };
        const exts = spellcheck(dict);
        expect(exts.length).toBeGreaterThan(0);
    });

    it('dictionary.addWord adds to personal dictionary', () => {
        const dict = createMockDictionary(['hello']);
        dict.addWord('xyzzy');
        expect(dict.check('xyzzy')).toBe(true);
    });

    it('dictionary.suggest returns results', () => {
        const dict = createMockDictionary(['help', 'heap', 'heel']);
        const suggestions = dict.suggest('hel');
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.every((s) => s.startsWith('h'))).toBe(true);
    });

    it('spellcheck with no config defaults to no click handler', () => {
        const dict = createMockDictionary(['test']);
        const exts = spellcheck(dict, {});
        expect(exts.length).toBe(1);
    });

    it('handles text with punctuation', () => {
        const dict = createMockDictionary(['hello']);
        view = createView('hello, world!', dict);
        expect(view.state.doc.toString()).toBe('hello, world!');
    });

    it('handles multiline text', () => {
        const dict = createMockDictionary(['hello', 'world']);
        view = createView('hello\nworld', dict);
        expect(view.state.doc.toString()).toBe('hello\nworld');
    });
});
