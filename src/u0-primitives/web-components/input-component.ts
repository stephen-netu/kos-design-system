/**
 * KosInput Web Component
 *
 * Web Component wrapper for the KosInput Svelte component.
 * Enables usage of KosInput in vanilla JS, React, or other frameworks.
 *
 * @package @kos/design-system/u0-primitives
 */
import { mount } from 'svelte';
import Input from '../input/Input.svelte';

class KosInput extends HTMLElement {
  static observedAttributes = [
    'type',
    'value',
    'placeholder',
    'disabled',
    'readonly',
    'required'
  ];

  private svelteRoot: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this.svelteRoot) {
      this.svelteRoot.innerHTML = '';
      this.svelteRoot = null;
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  getComponentProps(): Record<string, unknown> {
    const props: Record<string, unknown> = {};

    if (this.hasAttribute('type')) {
      props.type = this.getAttribute('type') ?? 'text';
    }
    if (this.hasAttribute('value')) {
      props.value = this.getAttribute('value') ?? '';
    }
    if (this.hasAttribute('placeholder')) {
      props.placeholder = this.getAttribute('placeholder') ?? '';
    }

    if (this.hasAttribute('disabled')) {
      props.disabled = true;
    }
    if (this.hasAttribute('readonly')) {
      props.readonly = true;
    }
    if (this.hasAttribute('required')) {
      props.required = true;
    }

    return props;
  }

  render() {
    if (!this.shadowRoot) return;

    if (this.svelteRoot) {
      this.svelteRoot.innerHTML = '';
    }

    this.svelteRoot = document.createElement('div');
    this.shadowRoot.appendChild(this.svelteRoot);

    mount(Input, {
      target: this.svelteRoot,
      props: this.getComponentProps()
    });

    if (!this.shadowRoot.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
          font-family: var(--font-sans, 'Outfit', system-ui, sans-serif);
        }
        ::slotted(*) {
        }
      `;
      this.shadowRoot.appendChild(style);
    }
  }
}

if (!customElements.get('kos-input')) {
  customElements.define('kos-input', KosInput);
}

export { KosInput };
export default KosInput;
