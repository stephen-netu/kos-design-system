import { mount, unmount } from 'svelte';
import type { Props as InputProps } from '../input/Input.svelte';
import Input from '../input/Input.svelte';

const types = ['text', 'search', 'password', 'email', 'url'] as const;

type Type = (typeof types)[number];

class KosInput extends HTMLElement {
  static observedAttributes = [
    'type',
    'value',
    'placeholder',
    'disabled',
    'error',
    'class',
    'id',
    'name'
  ];

  private svelteRoot: HTMLElement | null = null;
  private svelteComponent: Record<string, unknown> | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.destroy();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  getComponentProps(): InputProps {
    const props: InputProps = {};
    const type = this.getAttribute('type');
    const value = this.getAttribute('value');
    const placeholder = this.getAttribute('placeholder');
    const className = this.getAttribute('class');
    const id = this.getAttribute('id');
    const name = this.getAttribute('name');

    if (type) {
      props.type = readOption(type, types, 'text');
    }
    if (value !== null) {
      props.value = value;
    }
    if (placeholder !== null) {
      props.placeholder = placeholder;
    }
    if (this.hasAttribute('disabled')) {
      props.disabled = true;
    }
    if (this.hasAttribute('error')) {
      props.error = true;
    }
    if (className) {
      props.class = className;
    }
    if (id) {
      props.id = id;
    }
    if (name) {
      props.name = name;
    }

    return props;
  }

  render() {
    if (!this.shadowRoot) return;

    this.destroy();
    this.svelteRoot = document.createElement('div');
    this.shadowRoot.appendChild(this.svelteRoot);
    this.svelteComponent = mount(Input, {
      target: this.svelteRoot,
      props: this.getComponentProps()
    }) as Record<string, unknown>;
    this.ensureHostStyle();
  }

  destroy() {
    if (this.svelteComponent) {
      void unmount(this.svelteComponent);
      this.svelteComponent = null;
    }
    if (this.svelteRoot) {
      this.svelteRoot.remove();
      this.svelteRoot = null;
    }
  }

  private ensureHostStyle() {
    if (!this.shadowRoot || this.shadowRoot.querySelector('style')) return;

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        font-family: var(--font-sans, 'Outfit', system-ui, sans-serif);
      }
    `;
    this.shadowRoot.appendChild(style);
  }
}

function readOption<T extends readonly string[]>(value: string, options: T, fallback: T[number]): T[number] {
  return options.includes(value as T[number]) ? value as T[number] : fallback;
}

if (!customElements.get('kos-input')) {
  customElements.define('kos-input', KosInput);
}

export { KosInput };
export default KosInput;
