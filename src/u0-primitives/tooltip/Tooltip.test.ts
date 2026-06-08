import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { Snippet } from 'svelte';
import Tooltip from './Tooltip.svelte';

describe('Tooltip', () => {
  afterEach(() => cleanup());

  it('renders the trigger wrapper', async () => {
    const { container } = render(Tooltip, {
      props: { content: 'tip', trigger: ((() => '') as unknown as Snippet) },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper');
    expect(wrapper).not.toBeNull();
  });

  it('does not show tooltip content initially', () => {
    const { container } = render(Tooltip, {
      props: { content: 'secret tip', trigger: ((() => '') as unknown as Snippet) },
    });
    expect(container.querySelector('.ds-tooltip-content')).toBeNull();
  });

  it('shows tooltip on mouse enter', async () => {
    vi.useFakeTimers();
    const { container } = render(Tooltip, {
      props: { content: 'hovered!', trigger: ((() => '') as unknown as Snippet), delayMs: 0 },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper')!;
    await fireEvent.mouseEnter(wrapper);
    await tick();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(container.querySelector('.ds-tooltip-content')).not.toBeNull();
    vi.useRealTimers();
  });

  it('hides tooltip on mouse leave', async () => {
    vi.useFakeTimers();
    const { container } = render(Tooltip, {
      props: { content: 'hovered!', trigger: ((() => '') as unknown as Snippet), delayMs: 0 },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper')!;
    await fireEvent.mouseEnter(wrapper);
    await tick();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(container.querySelector('.ds-tooltip-content')).not.toBeNull();
    await fireEvent.mouseLeave(wrapper);
    await tick();
    expect(container.querySelector('.ds-tooltip-content')).toBeNull();
    vi.useRealTimers();
  });

  it('applies position class for top (default)', async () => {
    vi.useFakeTimers();
    const { container } = render(Tooltip, {
      props: { content: 'top tip', trigger: ((() => '') as unknown as Snippet), delayMs: 0 },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper')!;
    await fireEvent.mouseEnter(wrapper);
    await tick();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(container.querySelector('.pos-top')).not.toBeNull();
    vi.useRealTimers();
  });

  it('applies position class for bottom', async () => {
    vi.useFakeTimers();
    const { container } = render(Tooltip, {
      props: { content: 'bottom tip', position: 'bottom', trigger: ((() => '') as unknown as Snippet), delayMs: 0 },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper')!;
    await fireEvent.mouseEnter(wrapper);
    await tick();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(container.querySelector('.pos-bottom')).not.toBeNull();
    vi.useRealTimers();
  });

  it('applies position class for left', async () => {
    vi.useFakeTimers();
    const { container } = render(Tooltip, {
      props: { content: 'left tip', position: 'left', trigger: ((() => '') as unknown as Snippet), delayMs: 0 },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper')!;
    await fireEvent.mouseEnter(wrapper);
    await tick();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(container.querySelector('.pos-left')).not.toBeNull();
    vi.useRealTimers();
  });

  it('applies position class for right', async () => {
    vi.useFakeTimers();
    const { container } = render(Tooltip, {
      props: { content: 'right tip', position: 'right', trigger: ((() => '') as unknown as Snippet), delayMs: 0 },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper')!;
    await fireEvent.mouseEnter(wrapper);
    await tick();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(container.querySelector('.pos-right')).not.toBeNull();
    vi.useRealTimers();
  });

  it('renders string content inside tooltip inner', async () => {
    vi.useFakeTimers();
    const { container } = render(Tooltip, {
      props: { content: 'hello world', trigger: ((() => '') as unknown as Snippet), delayMs: 0 },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper')!;
    await fireEvent.mouseEnter(wrapper);
    await tick();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    const inner = container.querySelector('.ds-tooltip-inner');
    expect(inner!.textContent).toBe('hello world');
    vi.useRealTimers();
  });

  it('respects delayMs before showing', async () => {
    vi.useFakeTimers();
    const { container } = render(Tooltip, {
      props: { content: 'delayed', trigger: ((() => '') as unknown as Snippet), delayMs: 500 },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper')!;
    await fireEvent.mouseEnter(wrapper);
    await tick();
    await vi.advanceTimersByTimeAsync(100);
    await tick();
    expect(container.querySelector('.ds-tooltip-content')).toBeNull();
    await vi.advanceTimersByTimeAsync(400);
    await tick();
    expect(container.querySelector('.ds-tooltip-content')).not.toBeNull();
    vi.useRealTimers();
  });

  it('shows tooltip on focus', async () => {
    vi.useFakeTimers();
    const { container } = render(Tooltip, {
      props: { content: 'focused!', trigger: ((() => '') as unknown as Snippet), delayMs: 0 },
    });
    const wrapper = container.querySelector('.ds-tooltip-wrapper')!;
    await fireEvent.focusIn(wrapper);
    await tick();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(container.querySelector('.ds-tooltip-content')).not.toBeNull();
    vi.useRealTimers();
  });

  it('applies custom class to wrapper', () => {
    const { container } = render(Tooltip, {
      props: { content: 'tip', trigger: ((() => '') as unknown as Snippet), class: 'my-tooltip' },
    });
    expect(container.querySelector('.my-tooltip')).not.toBeNull();
  });
});
