import { autocompletion, type CompletionSource } from '@codemirror/autocomplete';

export { autocompletion };
export type { CompletionSource };

export interface AutocompleteConfig {
    source: CompletionSource;
    defaultKeymap?: boolean;
    closeOnBlur?: boolean;
}

export function autocomplete(config: AutocompleteConfig) {
    return autocompletion({
        override: [config.source],
        defaultKeymap: config.defaultKeymap ?? true,
        closeOnBlur: config.closeOnBlur ?? true,
    });
}
