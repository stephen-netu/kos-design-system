import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import StorageMap from './StorageMap.svelte';

const sampleNodes = [
  { path: '/data/kos', bytes: 1024 * 1024 * 500, ownerTier: 'kos' as const, label: 'KOS Core' },
  { path: '/data/ext', bytes: 1024 * 1024 * 200, ownerTier: 'external' as const, label: 'External' },
  { path: '/data/unk', bytes: 1024 * 100, ownerTier: 'unknown' as const, label: 'Unknown' },
];

describe('StorageMap', () => {
  afterEach(() => cleanup());

  it('renders the total bytes label', () => {
    const { container } = render(StorageMap, { props: { nodes: sampleNodes } });
    const total = container.querySelector('.sm-total');
    expect(total).not.toBeNull();
    expect(total?.textContent).toContain('MB');
  });

  it('renders a cell for each node', () => {
    const { container } = render(StorageMap, { props: { nodes: sampleNodes } });
    expect(container.querySelectorAll('.sm-cell').length).toBe(3);
  });

  it('renders tier legend items', () => {
    const { container } = render(StorageMap, { props: { nodes: sampleNodes } });
    const legend = container.querySelector('.sm-legend');
    expect(legend).not.toBeNull();
    expect(legend?.textContent).toContain('KOS');
    expect(legend?.textContent).toContain('External');
    expect(legend?.textContent).toContain('Unknown');
  });

  it('renders empty state when no nodes', () => {
    const { container } = render(StorageMap, { props: { nodes: [] } });
    expect(container.querySelector('.sm-empty')).not.toBeNull();
    expect(container.textContent).toContain('No storage data');
  });

  it('calls onnodeclick when a cell is clicked', async () => {
    const onnodeclick = vi.fn();
    const { container } = render(StorageMap, { props: { nodes: sampleNodes, onnodeclick } });
    const cell = container.querySelector('.sm-cell') as HTMLElement;
    await fireEvent.click(cell);
    expect(onnodeclick).toHaveBeenCalledTimes(1);
    expect(onnodeclick).toHaveBeenCalledWith(sampleNodes[0]);
  });

  it('applies tier-specific CSS classes to cells', () => {
    const { container } = render(StorageMap, { props: { nodes: sampleNodes } });
    expect(container.querySelector('.sm-cell--kos')).not.toBeNull();
    expect(container.querySelector('.sm-cell--external')).not.toBeNull();
    expect(container.querySelector('.sm-cell--unknown')).not.toBeNull();
  });

  it('renders cell labels inside large enough cells', () => {
    const { container } = render(StorageMap, {
      props: { nodes: sampleNodes, width: 800, height: 600 },
    });
    const labels = container.querySelectorAll('.sm-label');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('applies custom width and height to root element', () => {
    const { container } = render(StorageMap, {
      props: { nodes: sampleNodes, width: 1024, height: 768 },
    });
    const root = container.querySelector('.sm-root') as HTMLElement;
    expect(root.style.width).toBe('1024px');
    expect(root.style.height).toBe('768px');
  });
});
