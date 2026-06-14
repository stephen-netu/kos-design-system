import { createRawSnippet, mount, unmount } from 'svelte';
import type { Props as ButtonProps } from '../button/Button.svelte';
import Button from '../button/Button.svelte';

const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const types = ['button', 'submit', 'reset'] as const;

type Variant = (typeof variants)[number];
type Size = (typeof sizes)[number];
type Type = (typeof types)[number];

class KosButton extends HTMLElement {
  static observedAttributes = [
    'disabled',
    'loading',
    'variant',
    'size',
    'type',
    'class',
    'aria-label',
    'aria-expanded',
    'children'
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

  getComponentProps(): ButtonProps {
    const props: ButtonProps = {};
    const variant = this.getAttribute('variant');
    const size = this.getAttribute('size');
    const type = this.getAttribute('type');
    const className = this.getAttribute('class');
    const ariaLabel = this.getAttribute('aria-label');
    const ariaExpanded = this.getAttribute('aria-expanded');
    const children = this.getAttribute('children');

    if (this.hasAttribute('disabled')) {
      props.disabled = true;
    }
    if (this.hasAttribute('loading')) {
      props.loading = true;
    }
    if (variant) {
      props.variant = readOption(variant, variants, 'primary');
    }
    if (size) {
      props.size = readOption(size, sizes, 'md');
    }
    if (type) {
      props.type = readOption(type, types, 'button');
    }
    if (className) {
      props.class = className;
    }
    if (ariaLabel) {
      props['aria-label'] = ariaLabel;
    }
    if (ariaExpanded !== null) {
      props['aria-expanded'] = ariaExpanded !== 'false';
    }
    if (children !== null) {
      props.children = createTextSnippet(children);
    }

    return props;
  }

  render() {
    if (!this.shadowRoot) return;

    this.destroy();
    this.svelteRoot = document.createElement('div');
    this.shadowRoot.appendChild(this.svelteRoot);
    this.svelteComponent = mount(Button, {
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
        display: inline-block;
        font-family: var(--font-sans, 'Outfit', system-ui, sans-serif);
      }
    `;
    this.shadowRoot.appendChild(style);
  }
}

function readOption<T extends readonly string[]>(value: string, options: T, fallback: T[number]): T[number] {
  return options.includes(value as T[number]) ? value as T[number] : fallback;
}

function createTextSnippet(value: string) {
  return createRawSnippet(() => ({
    render: () => `<span>${escapeHtml(value)}</span>`
  }));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!customElements.get('kos-button')) {
  customElements.define('kos-button', KosButton);
}

export { KosButton };
export default KosButton;
