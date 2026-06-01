import { EditorState, type Transaction, type TransactionSpec } from '@codemirror/state';

export interface ExpansionDictionary {
    [abbreviation: string]: string;
}

const BUILT_IN_EXPANSIONS: Record<string, string> = {
    'sig': 'signature',
    'impl': 'implementation',
    'config': 'configuration',
    'docs': 'documentation',
    'async': 'asynchronous',
};

function findExpansion(
    tr: Transaction,
    dictionary: Record<string, string>,
): TransactionSpec | null {
    if (!tr.docChanged) return null;

    const changes: { from: number; to: number; insert: string }[] = [];
    const doc = tr.newDoc;

    tr.changes.iterChanges((fromA, toA) => {
        const inserted = doc.sliceString(fromA, toA);
        if (inserted !== ' ' && inserted !== '\t') return;

        const line = doc.lineAt(fromA);
        let wordStart = fromA;
        while (wordStart > line.from) {
            const ch = doc.sliceString(wordStart - 1, wordStart);
            if (/\s/.test(ch)) break;
            wordStart--;
        }

        const precedingWord = doc.sliceString(wordStart, fromA);
        const expansion = dictionary[precedingWord];
        if (!expansion) return;

        const trailingSpace = inserted === ' ' ? '' : '';
        changes.push({
            from: wordStart,
            to: toA,
            insert: expansion + trailingSpace,
        });
    });

    if (changes.length === 0) return null;

    return { changes, sequential: true };
}

export function expansion(dictionary?: ExpansionDictionary) {
    const table = dictionary
        ? { ...dictionary, ...BUILT_IN_EXPANSIONS }
        : BUILT_IN_EXPANSIONS;

    return EditorState.transactionFilter.of((tr: Transaction) => {
        const result = findExpansion(tr, table);
        return result || tr;
    });
}
