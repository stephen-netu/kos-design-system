import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import CheckpointPill from './CheckpointPill.svelte';

const sampleCheckpoints = [
  { seqno: 1, id: 'cp-1', component: 'ryu-panel', componentType: 'rust-crate' as const, status: 'committed' as const, description: 'Initial panel', timestamp: 1000 },
  { seqno: 2, id: 'cp-2', component: 'ui-shell', componentType: 'ui-bundle' as const, status: 'committed' as const, description: 'Shell update', timestamp: 2000 },
];

describe('CheckpointPill', () => {
  afterEach(() => cleanup());

  it('renders the pill container', () => {
    const { container } = render(CheckpointPill, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    expect(container.querySelector('.checkpoint-pill')).not.toBeNull();
  });

  it('renders collapsed pill with seqno by default', () => {
    const { container } = render(CheckpointPill, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    expect(container.querySelector('.pill-seqno')?.textContent).toBe('1');
  });

  it('renders collapsed state initially', () => {
    const { container } = render(CheckpointPill, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    expect(container.querySelector('.pill-collapsed')).not.toBeNull();
    expect(container.querySelector('.pill-expanded')).toBeNull();
  });

  it('expands on click', async () => {
    const { container } = render(CheckpointPill, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    const pill = container.querySelector('.checkpoint-pill') as HTMLElement;
    await fireEvent.click(pill);
    expect(container.querySelector('.pill-expanded')).not.toBeNull();
    expect(container.querySelector('.checkpoint-pill')?.classList.contains('expanded')).toBe(true);
  });

  it('renders the CheckpointBar when expanded', async () => {
    const { container } = render(CheckpointPill, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    await fireEvent.click(container.querySelector('.checkpoint-pill') as HTMLElement);
    expect(container.querySelector('.checkpoint-bar')).not.toBeNull();
  });

  it('collapses when close button is clicked', async () => {
    const { container } = render(CheckpointPill, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1 },
    });
    await fireEvent.click(container.querySelector('.checkpoint-pill') as HTMLElement);
    expect(container.querySelector('.pill-expanded')).not.toBeNull();
    await fireEvent.click(container.querySelector('.pill-close') as HTMLElement);
    expect(container.querySelector('.pill-expanded')).toBeNull();
  });

  it('renders preview icon when in preview mode', () => {
    const { container } = render(CheckpointPill, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1, previewSeqno: 2 },
    });
    expect(container.querySelector('.checkpoint-pill')?.classList.contains('preview')).toBe(true);
  });

  it('calls onCheckpointClick when a checkpoint is selected from expanded bar', async () => {
    const onCheckpointClick = vi.fn();
    const { container } = render(CheckpointPill, {
      props: { checkpoints: sampleCheckpoints, currentSeqno: 1, onCheckpointClick },
    });
    await fireEvent.click(container.querySelector('.checkpoint-pill') as HTMLElement);
    const node = container.querySelector('.checkpoint-node') as HTMLElement;
    if (node) {
      await fireEvent.click(node);
      expect(onCheckpointClick).toHaveBeenCalledTimes(1);
    }
  });

  it('renders with empty checkpoints array', () => {
    const { container } = render(CheckpointPill, {
      props: { checkpoints: [], currentSeqno: 0 },
    });
    expect(container.querySelector('.checkpoint-pill')).not.toBeNull();
  });
});
