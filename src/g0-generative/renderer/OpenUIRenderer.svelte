<script lang="ts">
  /**
   * OpenUI Renderer
   * 
   * Renders OpenUI Lang AST to Svelte components.
   * Progressive rendering with placeholder support.
   * 
   * @package @kos/design-system/g0-generative
   */
  import type { OpenUIAST, OpenUIElement, OpenUIPlaceholder, OpenUINode } from '../parser/types';
  import type { ComponentLibrary } from '../library/ComponentLibrary';
  import type { StreamingState } from '../streaming/StreamingAdapter';

  interface Props {
    ast: OpenUIAST | null;
    library: ComponentLibrary;
    isStreaming?: boolean;
    fallback?: import('svelte').Snippet;
  }

  let { ast, library, isStreaming, fallback }: Props = $props();

  // Registry mapping component names to Svelte components
  const componentRegistry = $derived(buildRegistry(library));

  function buildRegistry(library: ComponentLibrary): Map<string, import('svelte').Component<Record<string, unknown>>> {
    return library.getRegisteredComponents();
  }

  function isResolved(node: OpenUINode): boolean {
    return node.type === 'element';
  }

  function getComponent(name: string): import('svelte').Component<Record<string, unknown>> | null {
    return componentRegistry.get(name) || null;
  }

  function renderElement(element: OpenUIElement): {
    component: import('svelte').Component<Record<string, unknown>> | null;
    props: Record<string, unknown>;
    children: string[];
  } {
    const Component = getComponent(element.component);
    const schema = library.getComponent(element.component);

    const componentProps: Record<string, unknown> = {};
    const children: string[] = [];

    if (schema) {
      for (let i = 0; i < element.args.length; i++) {
        const propName = schema.propOrder[i];
        if (propName) {
          const value = element.args[i];
          if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
            children.push(...value);
          } else {
            componentProps[propName] = value;
          }
        }
      }
    } else {
      for (const arg of element.args) {
        if (Array.isArray(arg) && arg.every(v => typeof v === 'string')) {
          children.push(...arg);
        }
      }
    }

    return { component: Component, props: componentProps, children };
  }
</script>

{#if ast?.root}
  {@const rootNode = ast.nodes.get(ast.root)}
  {#if rootNode}
    {#if rootNode.type === 'placeholder'}
      <!-- Root is still a placeholder - show skeleton -->
      <div class="openui-skeleton" role="progressbar" aria-busy={isStreaming}>
        {#if fallback}
          {@render fallback()}
        {:else}
          <div class="openui-loading">Loading...</div>
        {/if}
      </div>
    {:else if rootNode.type === 'element'}
      {@const { component: RootComponent, props: rootProps, children } = renderElement(rootNode)}
      {#if RootComponent}
        <RootComponent {...rootProps}>
          {@render renderChildren(children)}
        </RootComponent>
      {:else}
        <!-- Unregistered component - render children inline -->
        {@render renderChildren(children)}
      {/if}
    {/if}
  {/if}
{#snippet renderChild(childId: string, childNode: OpenUINode)}
  {#if childNode.type === 'placeholder'}
    <div class="openui-skeleton" role="progressbar" aria-busy={isStreaming}>
      <div class="openui-loading">Loading...</div>
    </div>
  {:else if childNode.type === 'element'}
    {@const { component: ChildComponent, props: childProps, children } = renderElement(childNode)}
    {#if ChildComponent}
      <ChildComponent {...childProps}>
        {@render renderChildren(children)}
      </ChildComponent>
    {:else}
      <!-- Unregistered component - render children inline -->
      {@render renderChildren(children)}
    {/if}
  {/if}
{/snippet}
{#snippet renderChildren(childIds: string[])}
  {#each childIds as childId}
    {@const childNode = ast!.nodes.get(childId)}
    {#if childNode}
      {@render renderChild(childId, childNode)}
    {/if}
  {/each}
{/snippet}

{:else}
  <!-- No AST yet -->
  <div class="openui-empty">
    {#if fallback}
      {@render fallback()}
    {/if}
  </div>
{/if}

<style>
  .openui-skeleton {
    min-height: 100px;
    background: var(--color-bg-secondary, #1a1a1a);
    border-radius: var(--radius-lg, 0.5rem);
    padding: var(--space-4, 1rem);
  }

  .openui-loading {
    color: var(--color-text-muted, #888);
    text-align: center;
  }

  .openui-empty {
    min-height: 50px;
  }
</style>
