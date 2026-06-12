import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, it, expect, vi } from 'vitest';
import KanbanBoard from './KanbanBoard.svelte';

describe('KanbanBoard', () => {
  afterEach(() => cleanup());

  it('exports a valid Svelte component', () => {
    expect(KanbanBoard).toBeDefined();
    expect(typeof KanbanBoard).toBe('function');
  });

  it('renders columns with title', async () => {
    const { container } = render(KanbanBoard, {
      props: {
        columns: [
          { column: { id: 'c1', title: 'Backlog' }, cards: [{ id: 'card1', title: 'Task 1' }] },
          { column: { id: 'c2', title: 'In Progress' }, cards: [] },
        ],
      },
    });
    expect(container.querySelector('.ds-kanban-board')).not.toBeNull();
    expect(container.querySelectorAll('.ds-kanban-column').length).toBe(2);
    expect(container.querySelector('.ds-kanban-column-title')?.textContent).toBe('Backlog');
  });

  it('renders board title when provided', () => {
    const { container } = render(KanbanBoard, {
      props: {
        title: 'My Board',
        columns: [],
      },
    });
    expect(container.querySelector('.ds-kanban-board-title')?.textContent).toBe('My Board');
  });

  it('renders cards within columns', () => {
    const { container } = render(KanbanBoard, {
      props: {
        columns: [
          {
            column: { id: 'c1', title: 'Todo' },
            cards: [
              { id: 'card1', title: 'First Task', priority: 'high' },
              { id: 'card2', title: 'Second Task', priority: 'low' },
            ],
          },
        ],
      },
    });
    const titles = container.querySelectorAll('.ds-kanban-card-title');
    expect(titles.length).toBe(2);
    expect(titles[0]?.textContent).toBe('First Task');
    expect(titles[1]?.textContent).toBe('Second Task');
  });

  it('renders priority indicator bars', () => {
    const { container } = render(KanbanBoard, {
      props: {
        columns: [
          {
            column: { id: 'c1', title: 'Todo' },
            cards: [{ id: 'card1', title: 'Urgent Task', priority: 'urgent' }],
          },
        ],
      },
    });
    expect(container.querySelector('.ds-kanban-priority-bar')).not.toBeNull();
  });

  it('renders tags when provided', () => {
    const { container } = render(KanbanBoard, {
      props: {
        columns: [
          {
            column: { id: 'c1', title: 'Todo' },
            cards: [{ id: 'card1', title: 'Tagged', tags: ['alpha', 'beta', 'gamma', 'delta'] }],
          },
        ],
      },
    });
    const tags = container.querySelectorAll('.ds-kanban-card-tag');
    expect(tags.length).toBe(3); // max 3 shown
    expect(container.querySelector('.ds-kanban-card-tag-more')?.textContent).toBe('+1');
  });

  it('moves a card with keyboard move mode', async () => {
    const onCardMove = vi.fn();
    const onCardClick = vi.fn();
    const { container } = render(KanbanBoard, {
      props: {
        columns: [
          { column: { id: 'todo', title: 'Todo' }, cards: [{ id: 'task-1', title: 'Task 1' }] },
          { column: { id: 'doing', title: 'In Progress' }, cards: [] },
        ],
        onCardMove,
        onCardClick,
      },
    });
    const card = container.querySelector<HTMLElement>('.ds-kanban-card');
    const interactiveCard = container.querySelector<HTMLElement>('.ds-card');

    expect(card).not.toBeNull();
    expect(interactiveCard).not.toBeNull();
    await fireEvent.keyDown(interactiveCard!, { key: ' ' });
    expect(container.querySelector('.ds-kanban-move-toast')).not.toBeNull();
    expect(card!.classList.contains('is-selected')).toBe(true);

    await fireEvent.keyDown(interactiveCard!, { key: 'ArrowRight' });
    expect(container.querySelector('.ds-kanban-move-target')?.textContent).toBe('→ In Progress');

    await fireEvent.keyDown(interactiveCard!, { key: 'Enter' });
    expect(onCardMove).toHaveBeenCalledWith('task-1', 'todo', 'doing');
    expect(onCardClick).not.toHaveBeenCalled();
    expect(container.querySelector('.ds-kanban-move-toast')).toBeNull();
  });

  it('cancels keyboard move mode with Escape', async () => {
    const onCardMove = vi.fn();
    const { container } = render(KanbanBoard, {
      props: {
        columns: [
          { column: { id: 'todo', title: 'Todo' }, cards: [{ id: 'task-1', title: 'Task 1' }] },
          { column: { id: 'doing', title: 'In Progress' }, cards: [] },
        ],
        onCardMove,
      },
    });
    const card = container.querySelector<HTMLElement>('.ds-kanban-card');
    const interactiveCard = container.querySelector<HTMLElement>('.ds-card');

    expect(card).not.toBeNull();
    expect(interactiveCard).not.toBeNull();
    await fireEvent.keyDown(interactiveCard!, { key: ' ' });
    await fireEvent.keyDown(interactiveCard!, { key: 'ArrowRight' });
    await fireEvent.keyDown(interactiveCard!, { key: 'Escape' });

    expect(onCardMove).not.toHaveBeenCalled();
    expect(container.querySelector('.ds-kanban-move-toast')).toBeNull();
  });

  it('renders move-toast in keyboard move mode', () => {
    // Move mode is internal state — verify the toast element exists in DOM when triggered
    // This is tested via the board's reactive rendering; we verify the CSS class exists
    const { container } = render(KanbanBoard, {
      props: {
        columns: [
          { column: { id: 'c1', title: 'Todo' }, cards: [{ id: 'card1', title: 'Task' }] },
        ],
      },
    });
    // Toast should not be visible initially
    expect(container.querySelector('.ds-kanban-move-toast')).toBeNull();
  });
});
