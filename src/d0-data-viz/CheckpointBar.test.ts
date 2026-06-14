import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import CheckpointBar from './CheckpointBar.svelte';

const sampleCheckpoints = [
  { seqno: 1, id: 'cp-1', component: 'ryu-panel', componentType: 'rust-crate' as const, status: 'committed' as const, description: 'Initial panel', timestamp: 1000 },
  { seqno: 2, id: 'cp-2', component: 'ui-shell', componentType: 'ui-bundle' as const, status: 'committed' as const, description: 'Shell update', timestamp: 2000 },
  { seqno: 3, id: 'cp-3', component: 'config', componentType: 'config' as const, status: 'system' as const, description: 'Config change', timestamp: 3000 },
];

describe('CheckpointBar', () => {
  afterEach(() => cleanup());

  it('renders the checkpoint bar container', () => {
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    expect(container.querySelector('.checkpoint-bar')).not.toBeNull();
  });

  it('renders a node for each checkpoint', () => {
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    expect(container.querySelectorAll('.checkpoint-node').length).toBe(3);
  });

  it('marks the current checkpoint as active', () => {
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 2 },
    });
    const nodes = container.querySelectorAll('.checkpoint-node');
    expect(nodes[1].classList.contains('active')).toBe(true);
    expect(nodes[0].classList.contains('active')).toBe(false);
  });

  it('calls onCheckpointClick when a node is clicked', async () => {
    const onCheckpointClick = vi.fn();
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1, onCheckpointClick },
    });
    const node = container.querySelector('.checkpoint-node') as HTMLElement;
    await fireEvent.click(node);
    expect(onCheckpointClick).toHaveBeenCalledTimes(1);
    expect(onCheckpointClick).toHaveBeenCalledWith(sampleCheckpoints[0]);
  });

  it('calls onCheckpointDoubleClick on double click', async () => {
    const onCheckpointDoubleClick = vi.fn();
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1, onCheckpointDoubleClick },
    });
    const node = container.querySelector('.checkpoint-node') as HTMLElement;
    await fireEvent.dblClick(node);
    expect(onCheckpointDoubleClick).toHaveBeenCalledTimes(1);
  });

  it('renders the current badge with seqno', () => {
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 2 },
    });
    expect(container.querySelector('.current-badge')?.textContent).toContain('2');
  });

  it('renders preview badge when previewSeqno is set', () => {
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1, previewSeqno: 3 },
    });
    expect(container.querySelector('.preview-badge')).not.toBeNull();
    expect(container.textContent).toContain('Previewing checkpoint 3');
  });

  it('marks preview checkpoint with preview class', () => {
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1, previewSeqno: 2 },
    });
    const nodes = container.querySelectorAll('.checkpoint-node');
    expect(nodes[1].classList.contains('preview')).toBe(true);
  });

  it('renders a timeline connecting line', () => {
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    expect(container.querySelector('.timeline-line')).not.toBeNull();
  });

  it('renders node symbols for each checkpoint', () => {
    const { container } = render(CheckpointBar, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    const symbols = container.querySelectorAll('.node-symbol');
    expect(symbols.length).toBe(3);
  });
});
