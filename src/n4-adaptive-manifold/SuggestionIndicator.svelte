<script lang="ts">
  // N4 SuggestionIndicator — Shows layout suggestion badge
  // Renders a small floating pill when the orchestrator has a stable suggestion.
  // Provides Accept / Dismiss / Pin actions per ADR.

  import type { LayoutAlgorithm, LayoutSuggestion } from './types.js';

  interface Props {
    suggestion: LayoutSuggestion | null;
    onaccept?: () => void;
    ondismiss?: () => void;
    onpin?: () => void;
  }

  let { suggestion, onaccept, ondismiss, onpin }: Props = $props();

  const LABELS: Record<LayoutAlgorithm, string> = {
    gravitational: 'Garden',
    manifold: 'Manifold',
  };
</script>

{#if suggestion && !suggestion.dismissed}
  <div class="n4-suggestion">
    <span class="n4-suggestion__icon">◈</span>
    <span class="n4-suggestion__label">{LABELS[suggestion.algorithm]}</span>
    <span class="n4-suggestion__reason">{suggestion.reason}</span>
    <button class="n4-suggestion__action n4-suggestion__action--accept" onclick={onaccept} title="Switch layout">
      ✓
    </button>
    <button class="n4-suggestion__action" onclick={ondismiss} title="Dismiss">
      ✕
    </button>
    <button class="n4-suggestion__action" onclick={onpin} title="Pin current layout">
      ⊙
    </button>
  </div>
{/if}

<style>
  .n4-suggestion {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: var(--n4-suggestion-padding, 6px 10px);
    background: var(--n4-suggestion-bg, color-mix(in srgb, var(--color-accent, #b87333) 8%, var(--color-bg-panel, #222)));
    border: 1px solid var(--n4-suggestion-border, rgba(184, 115, 51, 0.25));
    border-radius: var(--n4-suggestion-radius, 6px);
    font-size: var(--n4-suggestion-font-size, 11px);
    font-family: var(--font-sans, system-ui);
    color: var(--n4-suggestion-text, #a09880);
    white-space: nowrap;
  }

  .n4-suggestion__icon {
    color: var(--n4-suggestion-accent, #b87333);
    font-size: 13px;
    line-height: 1;
  }

  .n4-suggestion__label {
    color: var(--n4-suggestion-accent, #b87333);
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .n4-suggestion__reason {
    color: var(--n4-suggestion-text, #a09880);
    opacity: 0.75;
  }

  .n4-suggestion__action {
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-sm, 3px);
    cursor: pointer;
    font-size: 11px;
    padding: 1px 4px;
    color: var(--n4-suggestion-text, #a09880);
    transition: color 120ms, border-color 120ms;
  }

  .n4-suggestion__action:hover {
    color: var(--n4-suggestion-accent, #b87333);
    border-color: var(--n4-suggestion-border, rgba(184, 115, 51, 0.25));
  }

  .n4-suggestion__action--accept {
    color: var(--n4-suggestion-accent, #b87333);
  }
</style>
