<script lang="ts">
  // Ambient Primitives Demo — visual check for the marketing/docs-surface
  // primitives added alongside src/p0-primitives/tokens/ambient.css:
  // gradient text, ambient glow, LiveDot, ThemeSwatchGroup, WindowFrame,
  // StackedCard, scroll-reveal, and ParticleAssembleMark. None of these
  // are wired into console/product chrome — this page is the opt-in demo.

  import '../p0-primitives/tokens/ambient.css';
  import LiveDot from '../u0-primitives/live-dot/LiveDot.svelte';
  import ThemeSwatchGroup from '../u0-primitives/theme-swatch-group/ThemeSwatchGroup.svelte';
  import WindowFrame from '../u0-primitives/window-frame/WindowFrame.svelte';
  import StackedCard from '../l0-layout/card/StackedCard.svelte';
  import ParticleAssembleMark from '../spatial/ParticleAssembleMark.svelte';
  import { reveal } from '../p0-primitives/utils/reveal';

  // Example seed list — a taste call for whoever wires this into a real
  // page; swap freely. Each swatch sets --accent-primary directly, no
  // parallel palette authoring.
  const swatches = [
    { hex: '#b87333', label: 'Brass (default)' },
    { hex: '#4fa8a2', label: 'Teal' },
    { hex: '#d4a04c', label: 'Amber' },
    { hex: '#8b7fb0', label: 'Violet' },
    { hex: '#c14a4a', label: 'Crimson' }
  ];

  let accent = $state('#b87333');

  $effect(() => {
    document.documentElement.style.setProperty('--accent-primary', accent);
  });

  // A simple generic mark (diamond over a triangle) — deliberately not
  // Mesa's actual logomark. ParticleAssembleMark accepts any polygon set.
  const shapes = [
    { points: [[100, 10], [190, 100], [100, 190], [10, 100]] as [number, number][], tone: 'primary' as const },
    { points: [[100, 70], [140, 130], [60, 130]] as [number, number][], tone: 'secondary' as const }
  ];
</script>

<div class="demo bg-ambient-glow">
  <section use:reveal>
    <h2 class="text-gradient-accent">Ambient primitives</h2>
    <p>Opt-in marketing/docs-surface additions — import <code>ambient.css</code> explicitly.</p>
  </section>

  <section use:reveal={{ delayMs: 80 }}>
    <h3>ThemeSwatchGroup</h3>
    <ThemeSwatchGroup {swatches} bind:value={accent} />
  </section>

  <section use:reveal={{ delayMs: 120 }}>
    <h3>LiveDot</h3>
    <div class="row">
      <LiveDot variant="cleared" aria-label="Cleared" />
      <LiveDot variant="pending" aria-label="Pending" />
      <LiveDot variant="blocked" aria-label="Blocked" />
      <LiveDot variant="degraded" aria-label="Degraded" pulse={false} />
    </div>
  </section>

  <section use:reveal={{ delayMs: 160 }}>
    <h3>WindowFrame</h3>
    <WindowFrame title="PROPERTY SEARCH">
      <p>Slotted content renders here.</p>
    </WindowFrame>
  </section>

  <section use:reveal={{ delayMs: 200 }}>
    <h3>StackedCard</h3>
    <StackedCard>
      <p>Front-sheet content, two decorative sheets behind it.</p>
    </StackedCard>
  </section>

  <section use:reveal={{ delayMs: 240 }}>
    <h3>ParticleAssembleMark</h3>
    <ParticleAssembleMark
      {shapes}
      viewBoxWidth={200}
      viewBoxHeight={200}
      width={160}
      height={160}
      primaryColor={accent}
      secondaryColor="var(--color-text-primary)"
    />
  </section>
</div>

<style>
  .demo {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-8);
  }

  .row {
    display: flex;
    gap: var(--space-4);
    align-items: center;
  }
</style>
