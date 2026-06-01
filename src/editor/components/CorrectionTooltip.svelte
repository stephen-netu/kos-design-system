<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { Completion } from '../extensions/autocomplete';

    interface Suggestion {
        word: string;
        from: number;
        to: number;
    }

    interface Props {
        view: { coordsAtPos: (pos: number) => { top: number; left: number; bottom: number } | null; state: { doc: { sliceString: (from: number, to: number) => string }; selection: { main: { from: number; to: number } } } };
        suggestion: Suggestion;
        onAccept: (suggestion: string) => void;
        onDismiss: () => void;
        onAddToDictionary: () => void;
    }

    const { view, suggestion, onAccept, onDismiss, onAddToDictionary }: Props = $props();

    let position = $state<{ top: number; left: number } | null>(null);
    let dismissed = $state(false);

    let word = $derived(view.state.doc.sliceString(suggestion.from, suggestion.to));
    let suggestions = $derived(['Loading...']); // IMPLEMENTATION_REQUIRED(kos:default-324): wire up spellcheck dictionary suggestions

    onMount(() => {
        const coords = view.coordsAtPos(suggestion.from);
        if (coords) {
            position = { top: coords.bottom + 4, left: coords.left };
        }
    });

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            e.preventDefault();
            handleDismiss();
        }
    }

    function handleDismiss() {
        dismissed = true;
        onDismiss();
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        if (!dismissed) handleDismiss();
    });
</script>

{#if position && !dismissed}
    <div
        class="correction-tooltip"
        style="position: fixed; top: {position.top}px; left: {position.left}px;"
        role="tooltip"
        tabindex="0"
    >
        <div class="correction-tooltip__header">
            <span class="correction-tooltip__word">{word}</span>
            <button class="correction-tooltip__close" onclick={handleDismiss} aria-label="Dismiss">
                ✕
            </button>
        </div>
        <ul class="correction-tooltip__suggestions">
            {#each suggestions as s}
                <li>
                    <button class="correction-tooltip__suggestion" onclick={() => onAccept(s)}>
                        {s}
                    </button>
                </li>
            {/each}
        </ul>
        <div class="correction-tooltip__actions">
            <button class="correction-tooltip__action" onclick={onAddToDictionary}>
                Add to Dictionary
            </button>
        </div>
    </div>
{/if}

<style>
    .correction-tooltip {
        background: var(--color-bg-panel, #1a1a1a);
        border: 1px solid var(--border-default, #2a2a2a);
        border-radius: var(--radius-md, 6px);
        box-shadow: var(--shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.4));
        min-width: 180px;
        max-width: 280px;
        z-index: 1000;
        font-family: var(--font-sans, system-ui);
        font-size: var(--text-sm, 13px);
    }

    .correction-tooltip__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--border-subtle, #2a2a2a);
    }

    .correction-tooltip__word {
        font-weight: 600;
        color: var(--color-text-primary, #f5f2eb);
    }

    .correction-tooltip__close {
        background: none;
        border: none;
        color: var(--color-text-tertiary, #6b6b6b);
        cursor: pointer;
        padding: 2px 6px;
        font-size: 12px;
        line-height: 1;
    }

    .correction-tooltip__close:hover {
        color: var(--color-text-primary, #f5f2eb);
    }

    .correction-tooltip__suggestions {
        list-style: none;
        margin: 0;
        padding: 4px 0;
        max-height: 200px;
        overflow-y: auto;
    }

    .correction-tooltip__suggestion {
        display: block;
        width: 100%;
        text-align: left;
        padding: 6px 12px;
        background: none;
        border: none;
        color: var(--color-text-primary, #f5f2eb);
        cursor: pointer;
        font-size: 13px;
    }

    .correction-tooltip__suggestion:hover {
        background: var(--color-accent, #b87333);
        color: #fff;
    }

    .correction-tooltip__actions {
        border-top: 1px solid var(--border-subtle, #2a2a2a);
        padding: 6px 12px;
    }

    .correction-tooltip__action {
        background: none;
        border: none;
        color: var(--color-accent, #b87333);
        cursor: pointer;
        font-size: 12px;
        padding: 0;
    }

    .correction-tooltip__action:hover {
        text-decoration: underline;
    }
</style>
