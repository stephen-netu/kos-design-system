import { ChangeSet, EditorState, Transaction, type Transaction as TTransaction } from '@codemirror/state';

const REPLACEMENTS: Record<string, string> = {
    '...': '\u2026',
    '-->': '\u2192',
    '->': '\u2192',
    '<-': '\u2190',
    '---': '\u2014',
};

const SMART_DOUBLE_OPEN = '\u201C';
const SMART_DOUBLE_CLOSE = '\u201D';
const SMART_SINGLE_OPEN = '\u2018';
const SMART_SINGLE_CLOSE = '\u2019';

function buildReplacementChanges(tr: TTransaction): { from: number; to: number; insert: string }[] | null {
    if (!tr.docChanged) return null;

    const newDoc = tr.newDoc;
    const changes: { from: number; to: number; insert: string }[] = [];

    tr.changes.iterChanges((_fromA, _toA, fromB, toB, inserted) => {
        const insertedStr = inserted.toString();
        if (insertedStr.length !== 1) return;
        const ch = insertedStr[0];

        for (const [pattern, replacement] of Object.entries(REPLACEMENTS)) {
            if (ch !== pattern[pattern.length - 1]) continue;
            const checkFrom = fromB - pattern.length + 1;
            if (checkFrom < 0) continue;
            const preceding = newDoc.sliceString(checkFrom, fromB);
            if (preceding === pattern.slice(0, -1)) {
                changes.push({ from: checkFrom, to: toB, insert: replacement });
                return;
            }
        }

        if (ch === '"') {
            const prevCh = fromB > 0 ? newDoc.sliceString(fromB - 1, fromB) : ' ';
            changes.push({
                from: fromB,
                to: toB,
                insert: /\s/.test(prevCh) ? SMART_DOUBLE_OPEN : SMART_DOUBLE_CLOSE,
            });
        } else if (ch === "'") {
            const prevCh = fromB > 0 ? newDoc.sliceString(fromB - 1, fromB) : ' ';
            changes.push({
                from: fromB,
                to: toB,
                insert: /\s/.test(prevCh) ? SMART_SINGLE_OPEN : SMART_SINGLE_CLOSE,
            });
        }
    });

    return changes.length > 0 ? changes : null;
}

export function autoFormat() {
    return EditorState.transactionFilter.of((tr: TTransaction) => {
        const replacementChanges = buildReplacementChanges(tr);
        if (!replacementChanges) return tr;

        const replacementCS = ChangeSet.of(replacementChanges, tr.newDoc.length);
        const composed = tr.changes.compose(replacementCS);

        return Transaction.create(
            tr.startState,
            composed,
            tr.selection,
            tr.effects,
            tr.annotations,
            tr.scrollIntoView,
        );
    });
}
