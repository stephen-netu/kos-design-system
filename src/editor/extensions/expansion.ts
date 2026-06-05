import { ChangeSet, EditorState, Text, type Transaction as TTransaction, type TransactionSpec } from '@codemirror/state';

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

function buildExpansionChanges(
    tr: TTransaction,
    dictionary: Record<string, string>,
): { from: number; to: number; insert: string }[] | null {
    if (!tr.docChanged) return null;

    const newDoc = tr.newDoc;
    const changes: { from: number; to: number; insert: string }[] = [];

    tr.changes.iterChanges((_fromA: number, _toA: number, fromB: number, toB: number, inserted: Text) => {
        const insertedStr = inserted.toString();
        if (insertedStr !== ' ' && insertedStr !== '\t') return;

        const line = newDoc.lineAt(fromB);
        let wordStart = fromB;
        while (wordStart > line.from) {
            const ch = newDoc.sliceString(wordStart - 1, wordStart);
            if (/\s/.test(ch)) break;
            wordStart--;
        }

        const precedingWord = newDoc.sliceString(wordStart, fromB);
        const expansion = dictionary[precedingWord];
        if (!expansion) return;

        const trailingSpace = insertedStr === ' ' ? ' ' : '\t';
        changes.push({
            from: wordStart,
            to: toB,
            insert: expansion + trailingSpace,
        });
    });

    return changes.length > 0 ? changes : null;
}

export function expansion(dictionary?: ExpansionDictionary) {
    const table = dictionary
        ? { ...dictionary, ...BUILT_IN_EXPANSIONS }
        : BUILT_IN_EXPANSIONS;

    return EditorState.transactionFilter.of((tr: TTransaction) => {
        const expansionChanges = buildExpansionChanges(tr, table);
        if (!expansionChanges) return tr;

        const newDocLen = tr.newDoc.length;
        const expansionCS = ChangeSet.of(expansionChanges, newDocLen);
        const composed = tr.changes.compose(expansionCS);

        const spec: TransactionSpec = {
            changes: composed,
            selection: tr.selection,
            effects: tr.effects,
            scrollIntoView: tr.scrollIntoView,
        };
        return spec;
    });
}
