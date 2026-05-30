import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import ActivityRail from './ActivityRail.svelte';

const baseProps = {
  appItems: [],
  viewItems: [],
  panelItems: [],
  onitemclick: vi.fn(),
};

describe('ActivityRail', () => {
  afterEach(() => cleanup());

  it('renders nav element with activity-rail class', () => {
    const { container } = render(ActivityRail, { props: baseProps });
    expect(container.querySelector('nav.activity-rail')).toBeTruthy();
  });

  it('renders app items and view items as buttons', () => {
    const props = {
      ...baseProps,
      appItems: [
        { id: 'app1', type: 'app', label: 'Ryu', iconName: 'gauge' },
        { id: 'app2', type: 'app', label: 'Agora', iconName: 'message-circle' },
      ],
      viewItems: [
        { id: 'view1', type: 'view', label: 'Inbox', iconName: 'inbox' },
      ],
    };
    const { container } = render(ActivityRail, { props });
    const buttons = container.querySelectorAll('.rail-btn');
    expect(buttons.length).toBe(4); // 2 app + 1 view + 1 help button
  });

  it('applies active class to items with active=true', () => {
    const props = {
      ...baseProps,
      appItems: [
        { id: 'app1', type: 'app', label: 'Ryu', iconName: 'gauge', active: true },
        { id: 'app2', type: 'app', label: 'Agora', iconName: 'message-circle', active: false },
      ],
    };
    const { container } = render(ActivityRail, { props });
    const buttons = container.querySelectorAll('.rail-btn');
    expect(buttons[0].classList.contains('active')).toBe(true);
    expect(buttons[1].classList.contains('active')).toBe(false);
  });

  it('calls onitemclick with the correct item when a button is clicked', async () => {
    const onitemclick = vi.fn();
    const appItem = { id: 'app1', type: 'app', label: 'Ryu', iconName: 'gauge' };
    const props = {
      ...baseProps,
      appItems: [appItem],
      onitemclick,
    };
    const { container } = render(ActivityRail, { props });
    const btn = container.querySelector('.rail-btn') as HTMLElement;
    await fireEvent.click(btn);
    expect(onitemclick).toHaveBeenCalledTimes(1);
    expect(onitemclick).toHaveBeenCalledWith(appItem);
  });

  it('renders panel items in the panel section', () => {
    const props = {
      ...baseProps,
      panelItems: [
        { id: 'p1', type: 'panel', label: 'Help', iconName: 'help-circle' },
      ],
    };
    const { container } = render(ActivityRail, { props });
    const panelSection = container.querySelector('.rail-panels');
    expect(panelSection).toBeTruthy();
    expect(panelSection!.querySelectorAll('.rail-btn').length).toBe(1);
  });

  it('renders the brand glyph', () => {
    const { container } = render(ActivityRail, { props: baseProps });
    expect(container.querySelector('.rail-brand')).toBeTruthy();
  });

  it('calls onopenhelp when the help button is clicked', async () => {
    const onopenhelp = vi.fn();
    const { container } = render(ActivityRail, { props: { ...baseProps, onopenhelp } });
    const helpBtn = container.querySelector('button[title="Keyboard shortcuts (?)"]') as HTMLElement;
    expect(helpBtn).toBeTruthy();
    await fireEvent.click(helpBtn);
    expect(onopenhelp).toHaveBeenCalledTimes(1);
  });
});
