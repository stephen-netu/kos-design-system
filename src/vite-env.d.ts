/// <reference types="vite/client" />

// Allow dynamic CSS imports (used by SovereignMap for Leaflet styles).
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
