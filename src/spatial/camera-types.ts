// SnapZoomCamera — viewport camera types
// wt-903 implementation is Sonnet; types defined here for interface clarity.
// S-02: No wall-clock for easing — use requestAnimationFrame tick count.

/** Camera state */
export interface CameraState {
  /** Current zoom factor (1.0 = default, higher = zoomed in) */
  zoom: number;
  /** Pan offset X in px */
  panX: number;
  /** Pan offset Y in px */
  panY: number;
}

/** Snap-zoom target: center on a point at a specific zoom level */
export interface SnapZoomTarget {
  /** Target center X (in content coords, before zoom) */
  x: number;
  /** Target center Y (in content coords, before zoom) */
  y: number;
  /** Target zoom level */
  zoom: number;
  /** Easing duration in ms. Default 400. */
  duration?: number;
}

/** Camera configuration */
export interface CameraConfig {
  /** Minimum zoom. Default 0.05. */
  minZoom?: number;
  /** Maximum zoom. Default 4.0. */
  maxZoom?: number;
  /** Zoom speed (scroll wheel multiplier). Default 0.001. */
  zoomSpeed?: number;
  /** Snap-zoom easing duration in ms. Default 400. */
  snapDuration?: number;
}

/** Default camera config */
export const DEFAULT_CAMERA_CONFIG: Required<CameraConfig> = {
  minZoom: 0.05,
  maxZoom: 4.0,
  zoomSpeed: 0.001,
  snapDuration: 400,
};
