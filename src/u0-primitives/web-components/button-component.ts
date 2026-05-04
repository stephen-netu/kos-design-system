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

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this.svelteComponent) {
      this.svelteComponent.$destroy();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue !== newValue && this.svelteComponent) {
      this.svelteComponent.$set(this.getComponentProps());
    }
  }

  getComponentProps(): Record<string, unknown> {
    const props: Record<string, unknown> = {};

    // Boolean attributes
    if (this.hasAttribute('disabled')) {
      props.disabled = true;
    }
    if (this.hasAttribute('loading')) {
      props.loading = true;
    }

    // String attributes
    if (this.hasAttribute('variant')) {
      props.variant = this.getAttribute('variant') ?? 'primary';
    }
    if (this.hasAttribute('size')) {
      props.size = this.getAttribute('size') ?? 'md';
    }

    // Children as slot content (simplified)
    if (this.hasAttribute('children')) {
      props.children = this.getAttribute('children');
    }

    return props;
  }

  render() {
    // Clean up existing component
    if (this.svelteComponent) {
      this.svelteComponent.$destroy();
    }

    // Create new Svelte component instance
    this.svelteComponent = mount(Button, {
      target: this.shadowRoot,
      props: this.getComponentProps()
    });

    // Add basic styling
    if (!this.shadowRoot.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: inline-block;
          font-family: var(--font-sans, 'Outfit', system-ui, sans-serif);
        }
        ::slotted(*) {
          /* Allow slotted content to inherit styles */
        }
      `;
      this.shadowRoot.appendChild(style);
    }
  }

  private svelteComponent: any = null;
}

// Define the custom element
if (!customElements.get('kos-button')) {
  customElements.define('kos-button', KosButton);
}

// Export for use in ES modules
export { KosButton };
export default KosButton;