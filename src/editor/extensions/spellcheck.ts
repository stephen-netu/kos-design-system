import { type Diagnostic, linter, type LintSource } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

export interface SpellCheckDictionary {
    check(word: string): boolean | Promise<boolean>;
    suggest(word: string): string[] | Promise<string[]>;
    addWord(word: string): void;
}

export interface SpellCheckCorrection {
    original: string;
    suggestions: string[];
    position: { top: number; left: number };
}

export interface SpellCheckConfig {
    onCorrectionClick?: (
        correction: SpellCheckCorrection,
        view: EditorView,
        from: number,
        to: number
    ) => void | Promise<void>;
}

const MAX_WORDS_PER_LINT = 4096;

export function extractWords(text: string, maxWords = MAX_WORDS_PER_LINT): { word: string; from: number; to: number }[] {
    const words: { word: string; from: number; to: number }[] = [];
    let i = 0;
    while (i < text.length && words.length < maxWords) {
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

function wordAt(view: EditorView, pos: number) {
    return extractWords(view.state.doc.toString()).find(({ from, to }) => pos >= from && pos <= to) ?? null;
}

export function spellcheck(dictionary: SpellCheckDictionary, config: SpellCheckConfig = {}): Extension[] {
    const lintSource: LintSource = async (view): Promise<Diagnostic[]> => {
        const diagnostics: Diagnostic[] = [];
        const words = extractWords(view.state.doc.toString());

        for (const { word, from, to } of words) {
            if (word.length > 1 && !(await dictionary.check(word))) {
                const suggestions = (await dictionary.suggest(word))
                    .slice(0, 8)
                    .sort((a, b) => a.localeCompare(b));
                diagnostics.push({
                    from,
                    to,
                    severity: 'warning',
                    message: `"${word}"`,
                    actions: suggestions.map((suggestion: string) => ({
                        name: suggestion,
                        apply(v, from: number, to: number) {
                            v.dispatch({ changes: { from, to, insert: suggestion } });
                        },
                    })),
                });
            }
        }

        return diagnostics;
    };

    const clickHandler = config.onCorrectionClick
        ? EditorView.domEventHandlers({
            click: (event, view) => {
                const target = event.target as HTMLElement | null;
                if (target?.closest('button, a, input, textarea, select')) return false;

                const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
                if (pos === null) return false;

                const match = wordAt(view, pos);
                if (!match || match.word.length <= 1) return false;

                void (async () => {
                    if (await dictionary.check(match.word)) return;

                    const coords = view.coordsAtPos(match.from);
                    if (!coords) return;

                    const suggestions = (await dictionary.suggest(match.word))
                        .slice(0, 8)
                        .sort((a, b) => a.localeCompare(b));

                    await config.onCorrectionClick?.(
                        {
                            original: match.word,
                            suggestions,
                            position: { top: coords.top, left: coords.left },
                        },
                        view,
                        match.from,
                        match.to
                    );
                })();
                return true;
            },
        })
        : null;

    return [
        linter(lintSource, {
            delay: 300,
        }),
        ...(clickHandler ? [clickHandler] : []),
    ];
}
