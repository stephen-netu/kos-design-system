import { type Diagnostic, linter, type LintSource } from '@codemirror/lint';
import { type EditorView } from '@codemirror/view';

export interface SpellCheckDictionary {
    check(word: string): boolean;
    suggest(word: string): string[];
    addWord(word: string): void;
}

function extractWords(doc: { text: string; lineAt(pos: number): { from: number; to: number; text: string } }): { word: string; from: number; to: number }[] {
    const words: { word: string; from: number; to: number }[] = [];
    const text = doc.text;
    let i = 0;
    while (i < text.length) {
        if (/[a-zA-Z]/.test(text[i])) {
            const start = i;
            while (i < text.length && /[a-zA-Z']/.test(text[i])) {
                i++;
            }
            words.push({ word: text.slice(start, i), from: start, to: i });
        } else {
            i++;
        }
    }
    return words;
}

export function spellcheck(dictionary: SpellCheckDictionary) {
    const lintSource: LintSource = (view: EditorView): Diagnostic[] => {
        const diagnostics: Diagnostic[] = [];
        const words = extractWords(view.state.doc);

        for (const { word, from, to } of words) {
            if (word.length > 1 && !dictionary.check(word)) {
                diagnostics.push({
                    from,
                    to,
                    severity: 'warning',
                    message: `"${word}"`,
                    actions: dictionary.suggest(word).slice(0, 8).map((suggestion) => ({
                        name: suggestion,
                        apply(view: EditorView, from: number, to: number) {
                            view.dispatch({ changes: { from, to, insert: suggestion } });
                        },
                    })),
                });
            }
        }

        return diagnostics;
    };

    return linter(lintSource, {
        delay: 300,
    });
}
