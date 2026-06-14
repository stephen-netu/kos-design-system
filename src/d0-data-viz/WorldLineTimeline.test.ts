import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import WorldLineTimeline from './WorldLineTimeline.svelte';

const sampleData = {
  characters: [
    { id: 'c1', label: 'Alice', color: '#b87333' },
    { id: 'c2', label: 'Bob', color: '#5f9ea0' },
  ],
  events: [
    {
      id: 'e1', label: ['First', 'Contact'], type: 'arrival' as const, eraIndex: 0,
      description: 'Initial encounter', attendance: { c1: 'observed' as const, c2: 'observed' as const },
      placeLabel: 'Lab',
    },
    {
      id: 'e2', label: ['Conflict'], type: 'conflict' as const, eraIndex: 0,
      description: 'Disagreement', attendance: { c1: 'observed' as const, c2: 'psi' as const },
    },
  ],
  eras: [
    { label: 'Alpha', xNorm: [0, 0.5], color: 'rgba(184,115,51,0.05)' },
    { label: 'Beta', xNorm: [0.5, 1], color: 'rgba(95,158,160,0.05)' },
  ],
};

describe('WorldLineTimeline', () => {
  afterEach(() => cleanup());

  it('renders the container div', () => {
    const { container } = render(WorldLineTimeline, {
      props: { data: sampleData, onEventSelect: vi.fn() },
    });
    expect(container.querySelector('.wl-container')).not.toBeNull();
  });

  it('renders an svg element', () => {
    const { container } = render(WorldLineTimeline, {
      props: { data: sampleData, onEventSelect: vi.fn() },
    });
    expect(container.querySelector('.wl-canvas')).not.toBeNull();
  });

  it('renders character row labels', () => {
    const { container } = render(WorldLineTimeline, {
      props: { data: sampleData, onEventSelect: vi.fn() },
    });
    const text = container.textContent || '';
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
  });

  it('renders event nodes for each character-event attendance', () => {
    const { container } = render(WorldLineTimeline, {
      props: { data: sampleData, onEventSelect: vi.fn() },
    });
    const nodes = container.querySelectorAll('.wl-node');
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('renders era bands', () => {
    const { container } = render(WorldLineTimeline, {
      props: { data: sampleData, onEventSelect: vi.fn() },
    });
    const text = container.textContent || '';
    expect(text).toContain('Alpha');
    expect(text).toContain('Beta');
  });

  it('calls onEventSelect when a node is clicked', async () => {
    const onEventSelect = vi.fn();
    const { container } = render(WorldLineTimeline, {
      props: { data: sampleData, onEventSelect },
    });
    const node = container.querySelector('.wl-node') as HTMLElement;
    if (node) {
      await fireEvent.click(node);
      expect(onEventSelect).toHaveBeenCalledTimes(1);
    }
  });

  it('marks selected event with selected class', () => {
    const { container } = render(WorldLineTimeline, {
      props: { data: sampleData, selectedEventId: 'e1', onEventSelect: vi.fn() },
    });
    const selectedNodes = container.querySelectorAll('.wl-node.selected');
    expect(selectedNodes.length).toBeGreaterThan(0);
  });

  it('renders psi nodes with psi class', () => {
    const { container } = render(WorldLineTimeline, {
      props: { data: sampleData, onEventSelect: vi.fn() },
    });
    const psiNodes = container.querySelectorAll('.wl-node.psi');
    expect(psiNodes.length).toBeGreaterThan(0);
  });

  it('renders nothing when characters array is empty', () => {
    const { container } = render(WorldLineTimeline, {
      props: { data: { ...sampleData, characters: [] }, onEventSelect: vi.fn() },
    });
    expect(container.querySelectorAll('.wl-node').length).toBe(0);
  });

  it('renders nothing when events array is empty', () => {
    const { container } = render(WorldLineTimeline, {
      props: { data: { ...sampleData, events: [] }, onEventSelect: vi.fn() },
    });
    expect(container.querySelectorAll('.wl-node').length).toBe(0);
  });
});
