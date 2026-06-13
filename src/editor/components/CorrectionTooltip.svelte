<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		correction: { original: string; suggestions: string[] };
		position: { top: number; left: number };
		onAccept: (suggestion: string) => void;
		onDismiss: () => void;
		onAddToDictionary: () => void;
	}

	const { correction, position, onAccept, onDismiss, onAddToDictionary }: Props = $props();

	let dismissed = $state(false);
	let tooltip = $state<HTMLDivElement | null>(null);
	let listenersAttached = false;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			handleDismiss();
		}
	}

	function handlePointerDown(e: PointerEvent) {
		if (dismissed || !tooltip) return;
		const target = e.target as Node | null;
		if (target && tooltip.contains(target)) return;
		handleDismiss();
	}

	function attachListeners() {
		if (listenersAttached) return;
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('pointerdown', handlePointerDown);
		listenersAttached = true;
	}

	function detachListeners() {
		if (!listenersAttached) return;
		window.removeEventListener('keydown', handleKeydown);
		window.removeEventListener('pointerdown', handlePointerDown);
		listenersAttached = false;
	}

	function handleAccept(suggestion: string) {
		if (dismissed) return;
		onAccept(suggestion);
		handleDismiss();
	}

	function handleAddToDictionary() {
		if (dismissed) return;
		onAddToDictionary();
		handleDismiss();
	}

	function handleDismiss() {
		if (dismissed) return;
		dismissed = true;
		detachListeners();
		onDismiss();
	}

	onMount(() => {
		attachListeners();
		return detachListeners;
	});
</script>

{#if !dismissed}
	<div
		class="correction-tooltip"
		bind:this={tooltip}
		style:top={`${position.top}px`}
		style:left={`${position.left}px`}
		role="tooltip"
	>
		<div class="correction-tooltip__header">
			<span class="correction-tooltip__word">{correction.original}</span>
			<button class="correction-tooltip__close" onclick={handleDismiss} aria-label="Dismiss">
				×
			</button>
		</div>
		{#if correction.suggestions.length > 0}
			<ul class="correction-tooltip__suggestions">
				{#each correction.suggestions as s}
					<li>
						<button class="correction-tooltip__suggestion" onclick={() => handleAccept(s)}>
							{s}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
		<div class="correction-tooltip__actions">
			<button class="correction-tooltip__action" onclick={handleAddToDictionary}>
				Add to Dictionary
			</button>
		</div>
	</div>
{/if}

<style>
	.correction-tooltip {
		position: fixed;
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
