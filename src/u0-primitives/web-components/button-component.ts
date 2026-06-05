/**
 * KosButton Web Component
 *
 * Web Component wrapper for the KosButton Svelte component.
 * Enables usage of KosButton in vanilla JS, React, or other frameworks.
 *
 * @package @kos/design-system/u0-primitives
 */
import { mount } from 'svelte';
import Button from '../button/Button.svelte';

class KosButton extends HTMLElement {
  static observedAttributes = [
    'disabled',
    'loading',
    'variant',
    'size',
    'children'
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

    if (this.hasAttribute('disabled')) {
      props.disabled = true;
    }
    if (this.hasAttribute('loading')) {
      props.loading = true;
    }

    if (this.hasAttribute('variant')) {
      props.variant = this.getAttribute('variant') ?? 'primary';
    }
    if (this.hasAttribute('size')) {
      props.size = this.getAttribute('size') ?? 'md';
    }

    if (this.hasAttribute('children')) {
      props.children = this.getAttribute('children');
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

    mount(Button, {
      target: this.svelteRoot,
      props: this.getComponentProps()
    });

    if (!this.shadowRoot.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: inline-block;
          font-family: var(--font-sans, 'Outfit', system-ui, sans-serif);
        }
        ::slotted(*) {
        }
      `;
      this.shadowRoot.appendChild(style);
    }
  }
}

if (!customElements.get('kos-button')) {
  customElements.define('kos-button', KosButton);
}

export { KosButton };
export default KosButton;
