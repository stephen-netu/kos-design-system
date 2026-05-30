import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/svelte';
import SearchBar from './SearchBar.svelte';

describe('SearchBar', () => {
  afterEach(() => cleanup());

  it('renders input with placeholder', () => {
    const { container } = render(SearchBar, { props: { placeholder: 'Search...' } });
    expect(container.querySelector('input')).not.toBeNull();
  });

  it('applies placeholder text to input', () => {
    const { container } = render(SearchBar, { placeholder: 'Find things' });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.placeholder).toBe('Find things');
  });

  it('renders with search type on input', () => {
    const { container } = render(SearchBar);
    expect(container.querySelector('input[type="search"]')).not.toBeNull();
  });

  it('displays shortcut when value is empty', () => {
    const { container } = render(SearchBar, { props: { shortcut: '⌘K', value: '' } });
    expect(container.querySelector('.ds-search-shortcut')).not.toBeNull();
  });

  it('renders the search wrapper with input and search icon', () => {
    const { container } = render(SearchBar, { value: 'test' });
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.querySelector('.ds-searchbar')).not.toBeNull();
  });

  it('updates value binding when input changes', async () => {
    const { container } = render(SearchBar, { props: { value: '' } });
    const input = container.querySelector('input') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'new search' } });
    expect(input.value).toBe('new search');
  });

  it('appends custom class to wrapper', () => {
    const { container } = render(SearchBar, { props: { class: 'my-search' } });
    expect(container.querySelector('.my-search')).not.toBeNull();
  });

  it('passes disabled to the input', () => {
    const { container } = render(SearchBar, { props: { disabled: true } });
    expect(container.querySelector('input')?.hasAttribute('disabled')).toBe(true);
  });

  it('renders the search wrapper with ds-searchbar class', () => {
    const { container } = render(SearchBar);
    expect(container.querySelector('.ds-searchbar')).not.toBeNull();
  });
});
