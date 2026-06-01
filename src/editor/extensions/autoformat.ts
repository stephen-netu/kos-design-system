import { EditorState, type Transaction, type TransactionSpec } from '@codemirror/state';

const REPLACEMENTS: Record<string, string> = {
    '...': '\u2026',
    '-->': '\u2192',
    '<--': '\u2190',
    '---': '\u2014',
    '--': '\u2013',
};

const SMART_DOUBLE_OPEN = '\u201C';
const SMART_DOUBLE_CLOSE = '\u201D';
const SMART_SINGLE_OPEN = '\u2018';
const SMART_SINGLE_CLOSE = '\u2019';

function findReplacements(tr: Transaction): TransactionSpec | null {
    if (!tr.docChanged) return null;

    const changes: { from: number; to: number; insert: string }[] = [];
    const doc = tr.newDoc;

    tr.changes.iterChanges((fromA, toA) => {
        if (toA - fromA !== 1) return;
        const ch = doc.sliceString(fromA, toA);

        for (const [pattern, replacement] of Object.entries(REPLACEMENTS)) {
            const checkFrom = fromA - pattern.length + 1;
            if (checkFrom < 0) continue;
            const preceding = doc.sliceString(checkFrom, fromA);
            if (preceding === pattern.slice(0, -1)) {
                changes.push({ from: checkFrom, to: toA, insert: replacement });
                return;
            }
        }

        if (ch === '"') {
            const prevCh = fromA > 0 ? doc.sliceString(fromA - 1, fromA) : ' ';
            const replacement = /\s/.test(prevCh) ? SMART_DOUBLE_OPEN : SMART_DOUBLE_CLOSE;
            changes.push({ from: fromA, to: toA, insert: replacement });
        } else if (ch === "'") {
            const prevCh = fromA > 0 ? doc.sliceString(fromA - 1, fromA) : ' ';
            const replacement = /\s/.test(prevCh) ? SMART_SINGLE_OPEN : SMART_SINGLE_CLOSE;
            changes.push({ from: fromA, to: toA, insert: replacement });
        }
    });

    if (changes.length === 0) return null;

    return { changes, sequential: true };
}

export function autoFormat() {
    return EditorState.transactionFilter.of((tr: Transaction): TransactionSpec | readonly TransactionSpec[] => {
        const result = findReplacements(tr);
        if (result) return [result];
        return [];
    });
}
