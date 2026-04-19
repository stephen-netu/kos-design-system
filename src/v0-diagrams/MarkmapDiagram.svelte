<script lang="ts">
  import { Transformer } from 'markmap-lib';
  import { Markmap } from 'markmap-view';
  import type { DiagramSpec, RenderOptions } from './types';

  let { spec, options = {} }: {
    spec: DiagramSpec;
    options?: RenderOptions;
  } = $props();

  let svgEl: SVGSVGElement;
  let markmapInstance: Markmap | null = null;

  $effect(() => {
    if (!svgEl) return;

    const transformer = new Transformer();
    const { root } = transformer.transform(spec.source);

    if (markmapInstance) {
      markmapInstance.destroy();
    }

    markmapInstance = Markmap.create(svgEl, {}, root);
  });
</script>

<div class="v0-diagram v0-diagram--markmap">
  {#if spec.title}
    <h4 class="v0-diagram-title">{spec.title}</h4>
  {/if}
  <svg bind:this={svgEl}
    width={options.width ?? 600}
    height={options.height ?? 400}
  />
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
  :global(.v0-diagram--markmap svg) {
    max-width: 100%;
    height: auto;
  }
</style>
