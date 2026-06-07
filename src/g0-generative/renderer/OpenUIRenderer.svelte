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
    // TODO: Implement component registration from library schemas
    // This requires mapping ComponentLibrary schemas to actual Svelte imports
    // Example: if (library.hasComponent('Card')) registry.set('Card', CardComponent);
    // For now, return empty - consumers must register components manually
    return new Map();
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
    grandchildren: string[];
  } {
    const Component = getComponent(element.component);
    const schema = library.getComponent(element.component);
    
    const componentProps: Record<string, unknown> = {};
    const children: string[] = [];
    const grandchildren: string[] = [];

    if (schema) {
      // Map positional args to named props
      for (let i = 0; i < element.args.length; i++) {
        const propName = schema.propOrder[i];
        if (propName) {
          const value = element.args[i];
          // If this is an identifier array, treat as children
          if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
            children.push(...value);
          } else {
            componentProps[propName] = value;
          }
        }
      }
    } else {
      // No schema - treat all array args as children
      for (const arg of element.args) {
        if (Array.isArray(arg) && arg.every(v => typeof v === 'string')) {
          children.push(...arg);
        }
      }
    }

    // Extract grandchildren from children (nested structure)
    for (const childId of children) {
      const childNode = ast?.nodes.get(childId);
      if (childNode?.type === 'element') {
        for (const arg of childNode.args) {
          if (Array.isArray(arg) && arg.every(v => typeof v === 'string')) {
            grandchildren.push(...arg);
          }
        }
      }
    }

    return { component: Component, props: componentProps, children, grandchildren };
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
          {#each children as childId}
            {@const childNode = ast!.nodes.get(childId)}
            {#if childNode}
              <!-- Recursive child rendering via snippet -->
              {@render renderChild(childId, childNode)}
            {/if}
          {/each}
        </RootComponent>
      {:else}
        <!-- Unregistered component - render children inline -->
        {#each children as childId}
          {@const childNode = ast!.nodes.get(childId)}
          {#if childNode?.type === 'element'}
            {@const { component: ChildComponent, props: childProps } = renderElement(childNode)}
            {#if ChildComponent}
              <ChildComponent {...childProps} />
            {/if}
          {/if}
        {/each}
      {/if}
    {/if}
  {/if}
{#snippet renderChild(childId: string, childNode: OpenUINode)}
  {#if childNode.type === 'placeholder'}
    <div class="openui-skeleton" role="progressbar" aria-busy={isStreaming}>
      <div class="openui-loading">Loading...</div>
    </div>
  {:else if childNode.type === 'element'}
    {@const { component: ChildComponent, props: childProps, grandchildren } = renderElement(childNode)}
    {#if ChildComponent}
      <ChildComponent {...childProps}>
        {#each grandchildren as grandchildId}
          {@const grandchildNode = ast!.nodes.get(grandchildId)}
          {#if grandchildNode}
            {@render renderChild(grandchildId, grandchildNode)}
          {/if}
        {/each}
      </ChildComponent>
    {:else}
      <!-- Unregistered component - render children inline -->
      {#each grandchildren as grandchildId}
        {@const grandchildNode = ast!.nodes.get(grandchildId)}
        {#if grandchildNode?.type === 'element'}
          {@const { component: GC, props: gp } = renderElement(grandchildNode)}
          {#if GC}
            <GC {...gp} />
          {/if}
        {/if}
      {/each}
    {/if}
  {/if}
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
