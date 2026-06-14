import { afterEach, describe, expect, it } from 'vitest';
import { KosButton } from './button-component';
import { KosInput } from './input-component';

describe('u0-primitives/web-components', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('defines and renders the kos-button custom element', () => {
    const element = createButton({
      variant: 'danger',
      size: 'lg',
      type: 'submit',
      class: 'custom-button',
      'aria-label': 'Submit form',
      'aria-expanded': 'true',
      children: 'Save'
    });
    const button = element.shadowRoot?.querySelector('button');

    expect(customElements.get('kos-button')).toBe(KosButton);
    expect(button).not.toBeNull();
    expect(button?.getAttribute('type')).toBe('submit');
    expect(button?.getAttribute('aria-label')).toBe('Submit form');
    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(button?.classList.contains('variant-danger')).toBe(true);
    expect(button?.classList.contains('size-lg')).toBe(true);
    expect(button?.classList.contains('custom-button')).toBe(true);
    expect(button?.textContent?.trim()).toBe('Save');
  });

  it('updates the kos-button when attributes change', () => {
    const element = createButton();
    const button = element.shadowRoot?.querySelector('button');

    expect(button?.hasAttribute('disabled')).toBe(false);

    element.setAttribute('loading', '');
    const updatedButton = element.shadowRoot?.querySelector('button');

    expect(updatedButton?.hasAttribute('disabled')).toBe(true);
    expect(updatedButton?.classList.contains('is-loading')).toBe(true);
  });

  it('falls back to safe button defaults for invalid attributes', () => {
    const element = createButton({
      variant: 'invalid',
      size: 'invalid',
      type: 'invalid'
    });
    const button = element.shadowRoot?.querySelector('button');

    expect(button?.classList.contains('variant-primary')).toBe(true);
    expect(button?.classList.contains('size-md')).toBe(true);
    expect(button?.getAttribute('type')).toBe('button');
  });

  it('defines and renders the kos-input custom element', () => {
    const element = createInput({
      type: 'search',
      value: 'needle',
      placeholder: 'Search',
      disabled: '',
      error: '',
      class: 'custom-input',
      id: 'search-box',
      name: 'q'
    });
    const input = element.shadowRoot?.querySelector('input');

    expect(customElements.get('kos-input')).toBe(KosInput);
    expect(input).not.toBeNull();
    expect(input?.getAttribute('type')).toBe('search');
    expect((input as HTMLInputElement).value).toBe('needle');
    expect(input?.getAttribute('placeholder')).toBe('Search');
    expect(input?.getAttribute('id')).toBe('search-box');
    expect(input?.getAttribute('name')).toBe('q');
    expect(input?.hasAttribute('disabled')).toBe(true);
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(element.shadowRoot?.querySelector('.custom-input')).not.toBeNull();
  });

  it('updates the kos-input when attributes change', () => {
    const element = createInput({ type: 'text' });

    expect(element.shadowRoot?.querySelector('input')?.getAttribute('type')).toBe('text');

    element.setAttribute('type', 'password');
    const input = element.shadowRoot?.querySelector('input');

    expect(input?.getAttribute('type')).toBe('password');
  });

  it('falls back to safe input defaults for invalid attributes', () => {
    const element = createInput({ type: 'tel' });
    const input = element.shadowRoot?.querySelector('input');

    expect(input?.getAttribute('type')).toBe('text');
  });
});

function createButton(attributes: Record<string, string> = {}): KosButton {
  const element = document.createElement('kos-button') as KosButton;
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  document.body.appendChild(element);
  return element;
}

function createInput(attributes: Record<string, string>): KosInput {
  const element = document.createElement('kos-input') as KosInput;
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  document.body.appendChild(element);
  return element;
}
