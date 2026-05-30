<script lang="ts">
  import mermaid from 'mermaid';
  import type { DiagramSpec, RenderOptions } from './types';

  mermaid.initialize({
    securityLevel: 'strict',
    startOnLoad: false,
  });

  let { spec, options = {} }: {
    spec: DiagramSpec;
    options?: RenderOptions;
  } = $props();

  let svgContent = $state('');

  $effect(() => {
    renderDiagram(spec, options);
  });

  async function renderDiagram(s: DiagramSpec, opts: RenderOptions) {
    const id = `mermaid-${crypto.randomUUID()}`;
    const { svg } = await mermaid.render(id, s.source);
    svgContent = svg;
  }
</script>

<div class="v0-diagram v0-diagram--mermaid">
  {#if spec.title}
    <h4 class="v0-diagram-title">{spec.title}</h4>
  {/if}
  {@html svgContent}
</div>

<style>
  .v0-diagram {
    background: var(--v0-diagram-bg);
    border: 1px solid var(--v0-diagram-border);
    border-radius: var(--radius-lg);
    padding: var(--v0-diagram-padding);
    overflow: auto;
  }
  .v0-diagram-title {
    color: var(--v0-diagram-title-color);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    margin-bottom: var(--space-3);
  }
  :global(.v0-diagram--mermaid svg) {
    max-width: 100%;
    height: auto;
  }
</style>
