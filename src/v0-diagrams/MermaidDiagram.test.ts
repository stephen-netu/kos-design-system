import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import MermaidDiagram from './MermaidDiagram.svelte';
import type { DiagramSpec } from './types';

afterEach(() => {
  cleanup();
});

describe('v0-diagrams/MermaidDiagram', () => {
  it('exports a valid Svelte component', () => {
    expect(MermaidDiagram).toBeDefined();
    expect(typeof MermaidDiagram).toBe('function');
  });

  it('renders diagram title when provided', () => {
    const spec: DiagramSpec = {
      type: 'mermaid',
      source: 'graph TD; A-->B',
      title: 'Test Diagram',
    };
    const { container } = render(MermaidDiagram, { spec });
    const titleEl = container.querySelector('.v0-diagram-title');
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe('Test Diagram');
  });

  it('does not render title when not provided', () => {
    const spec: DiagramSpec = {
      type: 'mermaid',
      source: 'graph TD; A-->B',
    };
    const { container } = render(MermaidDiagram, { spec });
    expect(container.querySelector('.v0-diagram-title')).toBeNull();
  });

  it('applies v0-diagram CSS class', () => {
    const spec: DiagramSpec = {
      type: 'mermaid',
      source: 'graph TD; A-->B',
    };
    const { container } = render(MermaidDiagram, { spec });
    expect(container.querySelector('.v0-diagram')).not.toBeNull();
    expect(container.querySelector('.v0-diagram--mermaid')).not.toBeNull();
  });
});
