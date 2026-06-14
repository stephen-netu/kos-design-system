<script lang="ts">
  export interface Props {
    content?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    class?: string;
  }

  let { content = '', size = 'md', class: className = '' }: Props = $props();
</script>

<span class="openui-text size-{size} {className}">
  {content}
</span>

<style>
  .openui-text {
    color: var(--color-text-primary, #f5f5f5);
    font-family: var(--font-sans);
    line-height: var(--line-height-normal, 1.5);
  }

  .size-sm {
    font-size: var(--text-xs, 0.75rem);
  }

  .size-md {
    font-size: var(--text-sm, 0.875rem);
  }

  .size-lg {
    font-size: var(--text-base, 1rem);
  }

  .size-xl {
    font-size: var(--text-lg, 1.125rem);
    font-weight: var(--font-weight-semibold, 600);
  }
</style>
