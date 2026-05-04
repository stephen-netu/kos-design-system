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

    // String attributes
    if (this.hasAttribute('type')) {
      props.type = this.getAttribute('type') ?? 'text';
    }
    if (this.hasAttribute('value')) {
      props.value = this.getAttribute('value') ?? '';
    }
    if (this.hasAttribute('placeholder')) {
      props.placeholder = this.getAttribute('placeholder') ?? '';
    }

    // Boolean attributes
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
    // Clean up existing component
    if (this.svelteComponent) {
      this.svelteComponent.$destroy();
    }

    // Create new Svelte component instance
    this.svelteComponent = mount(Input, {
      target: this.shadowRoot,
      props: this.getComponentProps()
    });

    // Add basic styling
    if (!this.shadowRoot.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
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
if (!customElements.get('kos-input')) {
  customElements.define('kos-input', KosInput);
}

// Export for use in ES modules
export { KosInput };
export default KosInput;