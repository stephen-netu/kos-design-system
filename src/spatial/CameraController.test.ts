import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CameraController } from './CameraController.svelte';

beforeEach(() => {
  vi.useFakeTimers();
  // Mock requestAnimationFrame to actually invoke the callback
  let rafId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = ++rafId;
    callbacks.set(id, cb);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    callbacks.delete(id);
  });
  // Helper to advance rAF by one frame
  (globalThis as any).__flushRaf = () => {
    const cbs = [...callbacks.values()];
    callbacks.clear();
    cbs.forEach((cb) => cb(performance.now()));
  };
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('CameraController', () => {
  it('initializes with default zoom and pan', () => {
    const cam = new CameraController(800, 600);
    expect(cam.zoom).toBe(1.0);
    expect(cam.panX).toBe(0);
    expect(cam.panY).toBe(0);
  });

  it('returns camera state via getCameraState', () => {
    const cam = new CameraController(800, 600);
    const state = cam.getCameraState();
    expect(state.zoom).toBe(1.0);
    expect(state.panX).toBe(0);
    expect(state.panY).toBe(0);
  });

  it('clamps zoom to min/max bounds', () => {
    const cam = new CameraController(800, 600, { minZoom: 0.5, maxZoom: 3.0 });
    cam.layout({ viewportSize: { width: 800, height: 600 } });

    for (let i = 0; i < 100; i++) {
      cam.interact({
        event: {
          type: 'wheel',
          position: { x: 400, y: 300 },
          nativeEvent: { deltaY: -50, preventDefault: () => {} } as any,
        },
      } as any);
    }
    expect(cam.zoom).toBeLessThanOrEqual(3.0);

    for (let i = 0; i < 200; i++) {
      cam.interact({
        event: {
          type: 'wheel',
          position: { x: 400, y: 300 },
          nativeEvent: { deltaY: 50, preventDefault: () => {} } as any,
        },
      } as any);
    }
    expect(cam.zoom).toBeGreaterThanOrEqual(0.5);
  });

  it('pan moves camera position', () => {
    const cam = new CameraController(800, 600);
    cam.layout({ viewportSize: { width: 800, height: 600 } });

    cam.interact({
      event: {
        type: 'pointerdown',
        position: { x: 100, y: 100 },
        nativeEvent: { button: 1, preventDefault: () => {} } as any,
      },
    } as any);

    cam.interact({
      event: {
        type: 'pointermove',
        position: { x: 200, y: 150 },
        nativeEvent: { clientX: 200, clientY: 150 } as any,
      },
    } as any);

    expect(cam.panX).not.toBe(0);
    expect(cam.panY).not.toBe(0);
  });

  it('resetCamera eventually snaps to origin', () => {
    const cam = new CameraController(800, 600);
    cam.layout({ viewportSize: { width: 800, height: 600 } });

    cam.snapTo({ x: 100, y: 100, zoom: 2.0 });
    // Flush all pending rAF callbacks
    for (let i = 0; i < 100; i++) (globalThis as any).__flushRaf();

    cam.resetCamera();
    for (let i = 0; i < 100; i++) (globalThis as any).__flushRaf();

    // resetCamera() calls snapTo({x:0, y:0, zoom:1.0})
    // targetPanX = viewportW/2 - x*zoom = 800/2 - 0 = 400
    // targetPanY = viewportH/2 - y*zoom = 600/2 - 0 = 300
    expect(cam.zoom).toBeCloseTo(1.0, 0);
    expect(cam.panX).toBeCloseTo(400, 0);
    expect(cam.panY).toBeCloseTo(300, 0);
  });

  it('stop cancels active animation', () => {
    const cam = new CameraController(800, 600);
    cam.layout({ viewportSize: { width: 800, height: 600 } });

    cam.snapTo({ x: 50, y: 50, zoom: 2.0 });
    cam.stop();

    const zoomAfterStop = cam.zoom;
    for (let i = 0; i < 100; i++) (globalThis as any).__flushRaf();
    expect(cam.zoom).toBe(zoomAfterStop);
  });

  it('constrain returns fixed dimensions matching constructor size', () => {
    const cam = new CameraController(1024, 768);
    const c = cam.constrain({} as any);
    expect(c.width.min).toBe(1024);
    expect(c.width.preferred).toBe(1024);
    expect(c.height.min).toBe(768);
    expect(c.height.preferred).toBe(768);
  });
});
