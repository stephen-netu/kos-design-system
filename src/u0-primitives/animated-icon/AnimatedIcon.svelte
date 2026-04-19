<script lang="ts">
  /**
   * AnimatedIcon - U0 Primitive
   * 
   * SMIL-based animated SVG icons. Zero JS overhead, GPU-accelerated.
   * Aligns with x0-enchanted-blocks "enchanted" philosophy via declarative animation.
   * 
   * @package @kos/design-system/u0-primitives
   * @adr 2026-04-17-smil-animated-icons
   */
  
  type AnimationType = 'pulse' | 'orbit' | 'wave' | 'breathe' | 'spin' | 'steam' | 'energy-arcs';
  type IconName = 'power-node' | 'activity' | 'connection' | 'status-ring' | 'power-plant' | 'orbital-ring' | 'steam-tower' | 'energy-pulse';
  
  interface Props {
    name: IconName;
    size?: number;
    color?: string;
    animation?: AnimationType;
    speed?: number; // 0.5 = half speed, 2 = double speed
  }

  let { 
    name, 
    size = 40, 
    color = 'var(--color-accent)', 
    animation = 'pulse',
    speed = 1
  }: Props = $props();

  function calcDuration(baseMs: number): string {
    return `${baseMs / speed}ms`;
  }
</script>

<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 40 40"
  style="width: {size}px; height: {size}px; color: {color};"
  class="ds-animated-icon"
  aria-hidden="true"
>
  {#if name === 'power-node'}
    <!-- Outer ring -->
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>
    
    {#if animation === 'pulse'}
      <!-- Pulsing ring -->
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6">
        <animate attributeName="r" values="12;18;12" dur={calcDuration(2000)} repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0;0.8" dur={calcDuration(2000)} repeatCount="indefinite"/>
      </circle>
    {:else if animation === 'orbit'}
      <!-- Orbiting dot -->
      <circle cx="20" cy="2" r="3" fill="currentColor">
        <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur={calcDuration(3000)} repeatCount="indefinite"/>
      </circle>
    {/if}
    
    <!-- Core -->
    <circle cx="20" cy="20" r="8" fill="currentColor"/>
    <circle cx="17" cy="17" r="3" fill="white" opacity="0.3"/>
    
  {:else if name === 'activity'}
    <!-- Activity bars -->
    <rect x="6" y="20" width="4" height="10" rx="2" fill="currentColor">
      <animate attributeName="height" values="10;20;10" dur={calcDuration(1200)} repeatCount="indefinite"/>
      <animate attributeName="y" values="20;15;20" dur={calcDuration(1200)} repeatCount="indefinite"/>
    </rect>
    <rect x="14" y="15" width="4" height="15" rx="2" fill="currentColor">
      <animate attributeName="height" values="15;25;15" dur={calcDuration(1000)} repeatCount="indefinite" begin="0.2s"/>
      <animate attributeName="y" values="15;10;15" dur={calcDuration(1000)} repeatCount="indefinite" begin="0.2s"/>
    </rect>
    <rect x="22" y="18" width="4" height="12" rx="2" fill="currentColor">
      <animate attributeName="height" values="12;22;12" dur={calcDuration(1400)} repeatCount="indefinite" begin="0.4s"/>
      <animate attributeName="y" values="18;13;18" dur={calcDuration(1400)} repeatCount="indefinite" begin="0.4s"/>
    </rect>
    <rect x="30" y="22" width="4" height="8" rx="2" fill="currentColor">
      <animate attributeName="height" values="8;18;8" dur={calcDuration(1100)} repeatCount="indefinite" begin="0.6s"/>
      <animate attributeName="y" values="22;12;22" dur={calcDuration(1100)} repeatCount="indefinite" begin="0.6s"/>
    </rect>
    
  {:else if name === 'connection'}
    <!-- Connection nodes -->
    <circle cx="8" cy="20" r="4" fill="currentColor"/>
    <circle cx="32" cy="20" r="4" fill="currentColor"/>
    
    <!-- Animated connection line -->
    <line x1="12" y1="20" x2="28" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <animate attributeName="stroke-dasharray" values="0,16;16,0;0,16" dur={calcDuration(1500)} repeatCount="indefinite"/>
    </line>
    
    <!-- Data packet -->
    <circle cx="12" cy="20" r="2" fill="white">
      <animate attributeName="cx" values="12;28;12" dur={calcDuration(1500)} repeatCount="indefinite"/>
    </circle>
    
  {:else if name === 'status-ring'}
    <!-- Status ring with rotating segments -->
    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="3" opacity="0.2"/>
    
    <path d="M20 4 A16 16 0 0 1 36 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
      {#if animation === 'spin'}
        <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur={calcDuration(2000)} repeatCount="indefinite"/>
      {:else if animation === 'breathe'}
        <animate attributeName="opacity" values="1;0.3;1" dur={calcDuration(2000)} repeatCount="indefinite"/>
      {/if}
    </path>
    
    <path d="M4 20 A16 16 0 0 1 20 4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6">
      {#if animation === 'spin'}
        <animateTransform attributeName="transform" type="rotate" from="180 20 20" to="540 20 20" dur={calcDuration(2000)} repeatCount="indefinite"/>
      {/if}
    </path>
    
  {:else if name === 'power-plant'}
    <!-- Power plant silhouette with cooling tower -->
    <defs>
      <linearGradient id="brassGrad-{size}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d4956a"/>
        <stop offset="50%" stop-color="#b87333"/>
        <stop offset="100%" stop-color="#8a5626"/>
      </linearGradient>
    </defs>
    
    <!-- Cooling tower -->
    <path d="M8 35 Q4 25 12 15 L14 5 Q20 2 26 5 L28 15 Q36 25 32 35 Z" 
          fill="url(#brassGrad-{size})" opacity="0.8"/>
    
    <!-- Inner detail -->
    <path d="M12 32 Q8 24 15 15 L17 8 Q20 6 23 8 L25 15 Q32 24 28 32" 
          fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/>
    
    {#if animation === 'steam'}
      <!-- Steam plumes -->
      <g stroke="#d4956a" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6">
        <path d="M14 5 Q10 -5 15 -12">
          <animate attributeName="d" 
                   values="M14 5 Q10 -5 15 -12;M14 5 Q20 -5 10 -12;M14 5 Q10 -5 15 -12" 
                   dur={calcDuration(4000)} repeatCount="indefinite"/>
        </path>
        <path d="M20 2 Q24 -8 18 -15">
          <animate attributeName="d" 
                   values="M20 2 Q24 -8 18 -15;M20 2 Q14 -8 22 -15;M20 2 Q24 -8 18 -15" 
                   dur={calcDuration(3500)} repeatCount="indefinite"/>
        </path>
        <path d="M26 5 Q30 -5 25 -12">
          <animate attributeName="d" 
                   values="M26 5 Q30 -5 25 -12;M26 5 Q18 -5 28 -12;M26 5 Q30 -5 25 -12" 
                   dur={calcDuration(4500)} repeatCount="indefinite"/>
        </path>
      </g>
    {:else if animation === 'pulse'}
      <!-- Pulsing glow ring -->
      <circle cx="20" cy="20" r="25" fill="none" stroke="currentColor" stroke-width="1" opacity="0">
        <animate attributeName="r" values="15;28;15" dur={calcDuration(3000)} repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur={calcDuration(3000)} repeatCount="indefinite"/>
      </circle>
    {/if}
    
    <!-- Base ring -->
    <ellipse cx="20" cy="35" rx="16" ry="3" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
    
  {:else if name === 'orbital-ring'}
    <!-- Orbital ring with rotating elements -->
    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"/>
    
    <!-- Rotating dashed ring -->
    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="1.5" 
            stroke-dasharray="8 4" opacity="0.6">
      <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" 
                        dur={calcDuration(60000)} repeatCount="indefinite"/>
    </circle>
    
    <!-- Orbiting nodes -->
    <g>
      <circle cx="20" cy="4" r="3" fill="currentColor">
        <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" 
                          dur={calcDuration(8000)} repeatCount="indefinite"/>
      </circle>
      <circle cx="20" cy="4" r="3" fill="currentColor" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="180 20 20" to="540 20 20" 
                          dur={calcDuration(8000)} repeatCount="indefinite"/>
      </circle>
    </g>
    
    <!-- Core -->
    <circle cx="20" cy="20" r="6" fill="currentColor"/>
    
    {#if animation === 'pulse'}
      <!-- Pulsing arcs -->
      <path d="M20 4 A16 16 0 0 1 36 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <animate attributeName="opacity" values="0.2;1;0.2" dur={calcDuration(2000)} repeatCount="indefinite"/>
      </path>
      <path d="M20 36 A16 16 0 0 1 4 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <animate attributeName="opacity" values="0.2;1;0.2" dur={calcDuration(2000)} begin="1s" repeatCount="indefinite"/>
      </path>
    {/if}
    
  {:else if name === 'steam-tower'}
    <!-- Minimal steam tower with rising particles -->
    <path d="M12 38 L16 12 L24 12 L28 38 Z" fill="currentColor" opacity="0.3"/>
    <path d="M14 38 L17 14 L23 14 L26 38 Z" fill="url(#brassGrad-{size})" opacity="0.7"/>
    
    {#if animation === 'steam'}
      <!-- Rising particles -->
      <g fill="#d4956a">
        <circle cx="17" cy="10" r="1.5" opacity="0">
          <animate attributeName="cy" values="12;-8" dur={calcDuration(2500)} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0.8;0" dur={calcDuration(2500)} repeatCount="indefinite"/>
        </circle>
        <circle cx="20" cy="8" r="2" opacity="0">
          <animate attributeName="cy" values="10;-12" dur={calcDuration(3000)} begin="0.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0.6;0" dur={calcDuration(3000)} begin="0.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="23" cy="12" r="1.5" opacity="0">
          <animate attributeName="cy" values="12;-8" dur={calcDuration(2800)} begin="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0.7;0" dur={calcDuration(2800)} begin="1s" repeatCount="indefinite"/>
        </circle>
      </g>
    {/if}
    
    <!-- Hexagonal base -->
    <path d="M20 40 L32 33 L32 25 L20 18 L8 25 L8 33 Z" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/>
    
  {:else if name === 'energy-pulse'}
    <!-- Energy pulse with radiating arcs -->
    <circle cx="20" cy="20" r="4" fill="currentColor"/>
    
    {#if animation === 'pulse'}
      <!-- Radiating rings -->
      <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0">
        <animate attributeName="r" values="6;20;6" dur={calcDuration(2500)} repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0;0.8" dur={calcDuration(2500)} repeatCount="indefinite"/>
      </circle>
      <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="1" opacity="0">
        <animate attributeName="r" values="6;20;6" dur={calcDuration(2500)} begin="0.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur={calcDuration(2500)} begin="0.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0">
        <animate attributeName="r" values="6;20;6" dur={calcDuration(2500)} begin="1.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0;0.4" dur={calcDuration(2500)} begin="1.6s" repeatCount="indefinite"/>
      </circle>
    {:else if animation === 'energy-arcs'}
      <!-- Pulsing energy arcs outward -->
      <g stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.8">
        <line x1="20" y1="20" x2="5" y2="20">
          <animate attributeName="opacity" values="0;1;0" dur={calcDuration(1500)} repeatCount="indefinite"/>
          <animate attributeName="x2" values="20;2;20" dur={calcDuration(1500)} repeatCount="indefinite"/>
        </line>
        <line x1="20" y1="20" x2="35" y2="20">
          <animate attributeName="opacity" values="0;1;0" dur={calcDuration(1500)} begin="0.75s" repeatCount="indefinite"/>
          <animate attributeName="x2" values="20;38;20" dur={calcDuration(1500)} begin="0.75s" repeatCount="indefinite"/>
        </line>
        <line x1="20" y1="20" x2="20" y2="5">
          <animate attributeName="opacity" values="0;1;0" dur={calcDuration(1500)} begin="0.375s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="20;2;20" dur={calcDuration(1500)} begin="0.375s" repeatCount="indefinite"/>
        </line>
        <line x1="20" y1="20" x2="20" y2="35">
          <animate attributeName="opacity" values="0;1;0" dur={calcDuration(1500)} begin="1.125s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="20;38;20" dur={calcDuration(1500)} begin="1.125s" repeatCount="indefinite"/>
        </line>
      </g>
    {/if}
  {/if}
</svg>

<style>
  .ds-animated-icon {
    display: inline-block;
    flex-shrink: 0;
  }
</style>
