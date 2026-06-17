import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import FileTree from './FileTree.svelte';
import type { FileEntry } from './FileTree.svelte';

const mockItems: FileEntry[] = [
  {
    id: '1',
    name: 'src',
    type: 'directory',
    path: '/src',
    children: [
      { id: '2', name: 'index.ts', type: 'file', path: '/src/index.ts' },
      {
        id: '3',
        name: 'components',
        type: 'directory',
        path: '/src/components',
        children: [
          { id: '4', name: 'Button.svelte', type: 'file', path: '/src/components/Button.svelte' },
        ],
      },
    ],
  },
  { id: '5', name: 'README.md', type: 'file', path: '/README.md' },
];

describe('FileTree', () => {
  afterEach(() => cleanup());

  it('renders top-level items', () => {
    const { container } = render(FileTree, { props: { items: mockItems, onFileSelect: vi.fn() } });
    expect(container.textContent).toContain('src');
    expect(container.textContent).toContain('README.md');
  });

  it('shows children when directory is expanded via chevron click', async () => {
    const { container } = render(FileTree, { props: { items: mockItems, onFileSelect: vi.fn() } });
    const chevron = container.querySelector('.file-tree__chevron') as HTMLElement;
    expect(chevron).not.toBeNull();
    await fireEvent.click(chevron);
    expect(container.textContent).toContain('index.ts');
    expect(container.textContent).toContain('components');
  });

  it('hides children when directory is collapsed', async () => {
    const { container } = render(FileTree, { props: { items: mockItems, onFileSelect: vi.fn() } });
    const chevron = container.querySelector('.file-tree__chevron') as HTMLElement;
    await fireEvent.click(chevron);
    expect(container.textContent).toContain('index.ts');
    await fireEvent.click(chevron);
    expect(container.textContent).not.toContain('index.ts');
  });

  it('calls onFileSelect when a file row is clicked', async () => {
    const onFileSelect = vi.fn();
    const { container } = render(FileTree, { props: { items: mockItems, onFileSelect } });
    const chevron = container.querySelector('.file-tree__chevron') as HTMLElement;
    await fireEvent.click(chevron);
    const fileRows = container.querySelectorAll('.file-tree__row');
    const fileRow = Array.from(fileRows).find(r => r.textContent?.includes('index.ts')) as HTMLElement;
    expect(fileRow).not.toBeNull();
    await fireEvent.click(fileRow);
    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '2', name: 'index.ts' }));
  });

  it('applies selected class to the clicked file row', async () => {
    const { container } = render(FileTree, { props: { items: mockItems, onFileSelect: vi.fn() } });
    const chevron = container.querySelector('.file-tree__chevron') as HTMLElement;
    await fireEvent.click(chevron);
    const readmeRow = Array.from(container.querySelectorAll('.file-tree__row'))
      .find(r => r.textContent?.includes('README.md')) as HTMLElement;
    await fireEvent.click(readmeRow);
    expect(readmeRow.classList.contains('file-tree__row--selected')).toBe(true);
  });

  it('calls onDirectoryToggle when a directory is expanded', async () => {
    const onDirectoryToggle = vi.fn();
    const { container } = render(FileTree, {
      props: { items: mockItems, onFileSelect: vi.fn(), onDirectoryToggle },
    });
    const chevron = container.querySelector('.file-tree__chevron') as HTMLElement;
    await fireEvent.click(chevron);
    expect(onDirectoryToggle).toHaveBeenCalledTimes(1);
    expect(onDirectoryToggle).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', name: 'src' }),
      true,
    );
  });

  it('applies custom class name', () => {
    const { container } = render(FileTree, {
      props: { items: mockItems, onFileSelect: vi.fn(), class: 'custom-class' },
    });
    const el = container.querySelector('.file-tree');
    expect(el?.classList.contains('custom-class')).toBe(true);
  });

  it('supports externally controlled isExpanded on directory items', () => {
    const itemsWithExpanded: FileEntry[] = [
      {
        id: '1',
        name: 'src',
        type: 'directory',
        path: '/src',
        isExpanded: true,
        children: [
          { id: '2', name: 'index.ts', type: 'file', path: '/src/index.ts' },
        ],
      },
    ];
    const { container } = render(FileTree, { props: { items: itemsWithExpanded, onFileSelect: vi.fn() } });
    expect(container.textContent).toContain('index.ts');
  });

  it('supports externally controlled isSelected on file items', () => {
    const itemsWithSelected: FileEntry[] = [
      { id: '5', name: 'README.md', type: 'file', path: '/README.md', isSelected: true },
    ];
    const { container } = render(FileTree, { props: { items: itemsWithSelected, onFileSelect: vi.fn() } });
    const row = container.querySelector('.file-tree__row--selected') as HTMLElement;
    expect(row).not.toBeNull();
    expect(row.textContent).toContain('README.md');
  });

  it('calls onDirectoryToggle with false when collapsing a directory', async () => {
    const onDirectoryToggle = vi.fn();
    const { container } = render(FileTree, {
      props: { items: mockItems, onFileSelect: vi.fn(), onDirectoryToggle },
    });
    const chevron = container.querySelector('.file-tree__chevron') as HTMLElement;
    await fireEvent.click(chevron);
    await fireEvent.click(chevron);
    expect(onDirectoryToggle).toHaveBeenCalledTimes(2);
    expect(onDirectoryToggle).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: '1', name: 'src' }),
      false,
    );
  });

  it('sets aria-expanded on directory rows', () => {
    const { container } = render(FileTree, { props: { items: mockItems, onFileSelect: vi.fn() } });
    const dirRow = container.querySelector('[aria-expanded]') as HTMLElement;
    expect(dirRow).not.toBeNull();
  });
});
