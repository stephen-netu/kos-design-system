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

    tr.changes.iterChanges((_fromA: number, _toA: number, _fromB: number, toB: number, inserted: Text) => {
        const insertedStr = inserted.toString();
        if (insertedStr.length === 0) return;

        const lastIdx = insertedStr.length - 1;
        const trigger = insertedStr[lastIdx];
        if (trigger !== ' ' && trigger !== '\t') return;

        if (insertedStr.length > 1 && /\s/.test(insertedStr[0])) return;

        const triggerPos = toB - 1;
        const line = newDoc.lineAt(triggerPos);
        let wordStart = triggerPos;
        while (wordStart > line.from) {
            const ch = newDoc.sliceString(wordStart - 1, wordStart);
            if (/\s/.test(ch)) break;
            wordStart--;
        }

        const precedingWord = newDoc.sliceString(wordStart, triggerPos);
        const exp = dictionary[precedingWord];
        if (!exp) return;

        changes.push({
            from: wordStart,
            to: toB,
            insert: exp + trigger,
        });
    });

    return changes.length > 0 ? changes : null;
}

export function expansion(dictionary?: ExpansionDictionary) {
    const table = dictionary
        ? { ...BUILT_IN_EXPANSIONS, ...dictionary }
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
