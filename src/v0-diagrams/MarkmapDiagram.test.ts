import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import MarkmapDiagram from './MarkmapDiagram.svelte';
import type { DiagramSpec } from './types';

// jsdom doesn't provide ResizeObserver — markmap-view needs it
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = ResizeObserverMock as any;
  }
});

afterEach(() => {
  cleanup();
});

describe('v0-diagrams/MarkmapDiagram', () => {
  it('exports a valid Svelte component', () => {
    expect(MarkmapDiagram).toBeDefined();
    expect(typeof MarkmapDiagram).toBe('function');
  });

  it('renders diagram container with correct class', () => {
    const spec: DiagramSpec = {
      type: 'markmap',
      source: '# Root\n## Child',
    };
    const { container } = render(MarkmapDiagram, { spec });
    expect(container.querySelector('.v0-diagram')).not.toBeNull();
    expect(container.querySelector('.v0-diagram--markmap')).not.toBeNull();
  });

  it('renders title when provided', () => {
    const spec: DiagramSpec = {
      type: 'markmap',
      source: '# Root',
      title: 'Mind Map',
    };
    const { container } = render(MarkmapDiagram, { spec });
    expect(container.querySelector('.v0-diagram-title')?.textContent).toBe('Mind Map');
  });

  it('renders svg element', () => {
    const spec: DiagramSpec = {
      type: 'markmap',
      source: '# Root',
    };
    const { container } = render(MarkmapDiagram, { spec });
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
