import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import Tabs from './Tabs.svelte';

const sampleTabs = [
  { id: 'tab1', label: 'First' },
  { id: 'tab2', label: 'Second' },
  { id: 'tab3', label: 'Third' },
];

describe('Tabs', () => {
  afterEach(() => cleanup());

  it('renders all tabs', () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs } });
    const tabElements = container.querySelectorAll('[role="tab"]');
    expect(tabElements.length).toBe(3);
  });

  it('sets first tab as active by default', () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs } });
    const firstTab = container.querySelector('#tab-tab1');
    expect(firstTab).not.toBeNull();
    expect(firstTab!.getAttribute('aria-selected')).toBe('true');
  });

  it('renders tab labels', () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs } });
    expect(container.querySelector('#tab-tab1 .ds-tab-label')).not.toBeNull();
  });

  it('switches active tab on click', async () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs, activeId: 'tab1' } });
    const secondTab = container.querySelector('#tab-tab2')!;
    await fireEvent.click(secondTab);
    expect(secondTab.getAttribute('aria-selected')).toBe('true');
  });

  it('applies is-active class to active tab', () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs, activeId: 'tab2' } });
    const activeTab = container.querySelector('#tab-tab2');
    expect(activeTab!.classList.contains('is-active')).toBe(true);
  });

  it('applies is-disabled class to disabled tabs', () => {
    const tabsWithDisabled = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', disabled: true },
    ];
    const { container } = render(Tabs, { props: { tabs: tabsWithDisabled } });
    expect(container.querySelector('#tab-b.is-disabled')).not.toBeNull();
  });

  it('applies full-width class when fullWidth is true', () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs, fullWidth: true } });
    expect(container.querySelector('.full-width')).not.toBeNull();
  });

  it('calls onchange callback when tab is clicked', async () => {
    let changedId = '';
    const { container } = render(Tabs, {
      props: { tabs: sampleTabs, activeId: 'tab1', onchange: (id: string) => { changedId = id; } },
    });
    const thirdTab = container.querySelector('#tab-tab3')!;
    await fireEvent.click(thirdTab);
    expect(changedId).toBe('tab3');
  });

  it('renders with role="tablist"', () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs } });
    expect(container.querySelector('[role="tablist"]')).not.toBeNull();
  });

  it('sets correct aria-controls on tabs', () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs } });
    const firstTab = container.querySelector('#tab-tab1');
    expect(firstTab!.getAttribute('aria-controls')).toBe('panel-tab1');
  });

  it('handles keyboard ArrowRight navigation', async () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs, activeId: 'tab1' } });
    const firstTab = container.querySelector('#tab-tab1')!;
    await fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
    const secondTab = container.querySelector('#tab-tab2');
    expect(secondTab!.getAttribute('aria-selected')).toBe('true');
  });

  it('handles keyboard ArrowLeft navigation', async () => {
    const { container } = render(Tabs, { props: { tabs: sampleTabs, activeId: 'tab2' } });
    const secondTab = container.querySelector('#tab-tab2')!;
    await fireEvent.keyDown(secondTab, { key: 'ArrowLeft' });
    const firstTab = container.querySelector('#tab-tab1');
    expect(firstTab!.getAttribute('aria-selected')).toBe('true');
  });
});
