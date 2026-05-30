// AnimatedIcon - SMIL-based animated SVG icons
// Zero JS overhead, GPU-accelerated declarative animations

export { default as AnimatedIcon } from './AnimatedIcon.svelte';

// Type exports for consumers
export type AnimatedIconName = 
  | 'power-node' 
  | 'activity' 
  | 'connection' 
  | 'status-ring'
  | 'power-plant'
  | 'orbital-ring'
  | 'steam-tower'
  | 'energy-pulse';
  
export type AnimationType = 
  | 'pulse' 
  | 'orbit' 
  | 'wave' 
  | 'breathe' 
  | 'spin'
  | 'steam'
  | 'energy-arcs';

// Animation duration presets (ms)
export const ANIMATION_SPEEDS = {
  slow: 0.5,      // 2x duration
  normal: 1,      // base duration
  fast: 2,        // 0.5x duration
} as const;
