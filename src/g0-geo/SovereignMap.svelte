<script lang="ts">
  // SovereignMap — KOS-themed Leaflet map primitive.
  //
  // Design decisions (ADR: 2026-04-05-mir-civic-commons-adr.md):
  // - Leaflet (BSD-2, 42KB gzipped) with CartoDB dark_all tiles — no API key required.
  // - `visibility: hidden` persistence semantics: map is never destroyed when
  //   backgrounded (consistent with CodeMirror and canvas components in LEAP).
  // - Long-term: regional PMTiles extract for offline sovereign operation.

  import { onMount, onDestroy } from 'svelte';
  import 'leaflet/dist/leaflet.css';

  interface GeoPoint {
    lat: number;
    lon: number;
  }

  interface MapMarker {
    id: string;
    lat: number;
    lon: number;
    label: string;
    selected?: boolean;
  }

  interface Props {
    center: GeoPoint;
    zoom?: number;
    markers?: MapMarker[];
    onMarkerSelect?: (id: string) => void;
  }

  let { center, zoom = 12, markers = [], onMarkerSelect }: Props = $props();

  let mapEl: HTMLDivElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let markerLayer: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let L: any = null;

  onMount(async () => {
    // Dynamic import keeps Leaflet out of the critical bundle path.
    // CSS is statically imported at top of file — resolved from node_modules at build time (ADR: 2026-04-05-sovereign-map-css-delivery-adr.md).
    const leafletModule = await import('leaflet');
    L = leafletModule.default;

    map = L.map(mapEl).setView([center.lat, center.lon], zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
    syncMarkers();
  });

  onDestroy(() => {
    map?.remove();
    map = null;
  });

  // Reactively sync markers when prop changes.
  $effect(() => {
    if (map) syncMarkers();
  });

  // Reactively re-centre when center prop changes.
  $effect(() => {
    map?.setView([center.lat, center.lon], zoom);
  });

  function syncMarkers() {
    if (!markerLayer || !L) return;
    markerLayer.clearLayers();

    for (const m of markers) {
      const icon = L.divIcon({
        className: '',
        html: `<div class="sov-marker${m.selected ? ' sov-marker--selected' : ''}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const leafletMarker = L.marker([m.lat, m.lon], { icon }).addTo(markerLayer);
      leafletMarker.bindTooltip(m.label, { permanent: false, direction: 'top' });

      if (onMarkerSelect) {
        const id = m.id;
        leafletMarker.on('click', () => onMarkerSelect(id));
      }
    }
  }
</script>

<div bind:this={mapEl} class="sovereign-map"></div>

<style>
  .sovereign-map {
    width: 100%;
    height: 100%;
    background: #1a1a1a;
  }

  /* Leaflet override: match KOS dark theme for controls */
  :global(.leaflet-control-zoom a) {
    background: #222;
    border-color: #444;
    color: #e8e0d0;
  }

  :global(.leaflet-control-zoom a:hover) {
    background: #2a2a2a;
  }

  :global(.leaflet-control-attribution) {
    background: rgba(26, 26, 26, 0.8);
    color: #a09880;
    font-size: 10px;
  }

  :global(.sov-marker) {
    background: #b87333;
    border: 2px solid #e8e0d0;
    border-radius: 50%;
    width: 10px;
    height: 10px;
    cursor: pointer;
    transition: transform 0.1s;
  }

  :global(.sov-marker--selected) {
    background: #e8e0d0;
    border-color: #b87333;
    transform: scale(1.4);
  }

  :global(.leaflet-tooltip) {
    background: #222;
    border: 1px solid #444;
    color: #e8e0d0;
    font-family: system-ui, sans-serif;
    font-size: 12px;
    padding: 4px 8px;
  }
</style>
