<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'accent' | 'muted' | 'white';
    class?: string;
  }

  let {
    size = 'md',
    color = 'accent',
    class: className = ''
  }: Props = $props();
</script>

<div class="ds-spinner-wrapper size-{size} color-{color} {className}" role="status" aria-label="Loading">
  <div class="ds-spinner-ring"></div>
  <div class="ds-spinner-core"></div>
  <!-- Floating magical dust particles -->
  <div class="ds-spinner-particle p1"></div>
  <div class="ds-spinner-particle p2"></div>
  <div class="ds-spinner-particle p3"></div>
</div>

<style>
  .ds-spinner-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* Base Ring */
  .ds-spinner-ring {
    position: absolute;
    inset: 0;
    border-radius: var(--radius-full);
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-right-color: currentColor;
    opacity: 0.8;
    animation: ds-spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  }

  /* Inner Core */
  .ds-spinner-core {
    position: absolute;
    inset: 20%;
    border-radius: var(--radius-full);
    background: currentColor;
    opacity: 0.3;
    filter: blur(4px);
    animation: ds-pulse-core 2s ease-in-out infinite alternate;
  }

  /* Magical Dust Particles */
  .ds-spinner-particle {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: var(--radius-full);
    background: currentColor;
    opacity: 0;
  }

  .p1 { animation: ds-particle-drift-1 2s ease-out infinite; top: 10%; left: 10%; }
  .p2 { animation: ds-particle-drift-2 2.5s ease-out infinite 0.5s; bottom: 10%; right: 10%; }
  .p3 { animation: ds-particle-drift-3 1.8s ease-out infinite 1s; top: 10%; right: 20%; }

  @keyframes ds-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes ds-pulse-core {
    0% { transform: scale(0.8); opacity: 0.2; }
    100% { transform: scale(1.2); opacity: 0.5; }
  }

  @keyframes ds-particle-drift-1 {
    0% { transform: translate(0, 0) scale(0); opacity: 0; }
    50% { transform: translate(-10px, -15px) scale(1); opacity: 0.8; }
    100% { transform: translate(-20px, -30px) scale(0); opacity: 0; }
  }

  @keyframes ds-particle-drift-2 {
    0% { transform: translate(0, 0) scale(0); opacity: 0; }
    50% { transform: translate(15px, 10px) scale(1.2); opacity: 0.6; }
    100% { transform: translate(30px, 20px) scale(0); opacity: 0; }
  }

  @keyframes ds-particle-drift-3 {
    0% { transform: translate(0, 0) scale(0); opacity: 0; }
    50% { transform: translate(10px, -20px) scale(0.8); opacity: 0.9; }
    100% { transform: translate(20px, -40px) scale(0); opacity: 0; }
  }

  /* --- Sizes --- */
  .size-sm { width: 1.25rem; height: 1.25rem; }
  .size-md { width: 2rem; height: 2rem; }
  .size-lg { width: 3rem; height: 3rem; }
  .size-lg .ds-spinner-ring { border-width: 3px; }
  .size-xl { width: 4.5rem; height: 4.5rem; }
  .size-xl .ds-spinner-ring { border-width: 4px; }

  /* --- Colors --- */
  .color-accent { 
    color: var(--color-accent); 
    filter: drop-shadow(0 0 4px var(--color-accent-glow));
  }
  
  .color-muted { 
    color: var(--color-text-muted); 
  }
  
  .color-white { 
    color: #ffffff; 
    filter: drop-shadow(0 0 4px rgba(255,255,255,0.4));
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .ds-spinner-ring {
      animation: ds-spin 2s linear infinite;
    }
    .ds-spinner-core, .ds-spinner-particle {
      display: none;
    }
  }
</style>
