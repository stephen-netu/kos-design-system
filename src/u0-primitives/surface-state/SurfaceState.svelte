<script lang="ts">
  import type { Snippet } from 'svelte';
  import Spinner from '../spinner/Spinner.svelte';
  import Button from '../button/Button.svelte';

  export type SurfaceStateKind = 'loading' | 'empty' | 'error' | 'degraded';

  export interface Props {
    state: SurfaceStateKind;
    title?: string;
    message?: string;
    actionLabel?: string;
    onRetry?: () => void | Promise<void>;
    class?: string;
    children?: Snippet;
  }

  let {
    state,
    title,
    message,
    actionLabel,
    onRetry,
    class: className = '',
    children,
  }: Props = $props();

  const effectiveTitle = $derived(
    title ??
      (state === 'loading'
        ? 'Loading'
        : state === 'empty'
          ? 'Nothing here yet'
          : state === 'error'
            ? 'Something went wrong'
            : 'Substrate offline')
  );

  const effectiveMessage = $derived(
    message ??
      (state === 'loading'
        ? 'Preparing the surface…'
        : state === 'empty'
          ? 'No content is available for this view.'
          : state === 'error'
            ? 'The operation could not be completed. Please try again.'
            : 'The SOVEREIGN daemon isn’t responding. Your data is safe; reconnect to continue.')
  );

  const effectiveActionLabel = $derived(actionLabel ?? (state === 'degraded' ? 'Retry' : 'Try again'));

  const isBusy = $derived(state === 'loading' || state === 'degraded');
  const showAction = $derived(state === 'error' || state === 'degraded');
</script>

<section
  class="ds-surface-state state-{state} {className}"
  role="status"
  aria-live="polite"
>
  <div class="ds-surface-state__icon" aria-hidden="true">
    {#if isBusy}
      <Spinner size="md" color="accent" />
    {:else if state === 'empty'}
      <span class="ds-surface-state__glyph">∅</span>
    {:else}
      <span class="ds-surface-state__glyph">!</span>
    {/if}
  </div>

  <div class="ds-surface-state__content">
    <h2 class="ds-surface-state__title">{effectiveTitle}</h2>
    {#if effectiveMessage}
      <p class="ds-surface-state__message">{effectiveMessage}</p>
    {/if}
    {#if children}
      <div class="ds-surface-state__children">
        {@render children()}
      </div>
    {/if}
  </div>

  {#if showAction}
    <div class="ds-surface-state__actions">
      <Button variant={state === 'error' ? 'danger' : 'secondary'} size="sm" disabled={!onRetry} onclick={() => void onRetry?.()}>
        {effectiveActionLabel}
      </Button>

    </div>
  {/if}
</section>

<style>
  .ds-surface-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    min-height: 14rem;
    padding: var(--space-6);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    background: var(--color-bg-panel-elevated);
    color: var(--color-text-primary);
    text-align: center;
  }

  .ds-surface-state__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    flex-shrink: 0;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    background: var(--color-bg-app);
  }

  .state-error .ds-surface-state__icon,
  .state-degraded .ds-surface-state__icon {
    border-color: color-mix(in srgb, var(--color-error) 45%, var(--border-default));
  }

  .state-empty .ds-surface-state__icon {
    border-color: var(--border-default);
  }

  .ds-surface-state__glyph {
    font-family: var(--font-mono);
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .state-error .ds-surface-state__glyph,
  .state-degraded .ds-surface-state__glyph {
    color: var(--color-error);
  }

  .state-empty .ds-surface-state__glyph {
    color: var(--color-text-muted);
  }

  .ds-surface-state__content {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: var(--space-1);
  }

  .ds-surface-state__title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--color-text-primary);
  }

  .ds-surface-state__message {
    margin: 0;
    max-width: 34rem;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    line-height: 1.5;
  }

  .ds-surface-state__children {
    margin-top: var(--space-2);
  }

  .ds-surface-state__actions {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 42rem) {
    .ds-surface-state {
      align-items: flex-start;
      flex-direction: column;
      text-align: left;
    }

    .ds-surface-state__actions {
      justify-content: flex-start;
    }
  }
</style>
