export { autocompletion } from '@codemirror/autocomplete';
export type { Completion, CompletionSource, CompletionResult } from '@codemirror/autocomplete';

export interface AutocompleteConfig {
    source: CompletionSource;
    maxVisible?: number;
    minChars?: number;
}

export function autocomplete(config: AutocompleteConfig) {
    return autocompletion({
        override: [config.source],
        maxVisible: config.maxVisible ?? 50,
        defaultKeymap: true,
        closeOnBlur: true,
    });
}
