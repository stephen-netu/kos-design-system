import type { Action } from 'svelte/action';

/**
 * Scroll-reveal action for marketing/docs surfaces — never wire into
 * console/product chrome (see ambient.css usage note). Adds `ds-reveal`
 * on mount and `ds-reveal-in` once the node crosses `threshold`; pass
 * `delayMs` to stagger a group of siblings. Respects
 * prefers-reduced-motion by revealing immediately with no observer.
 */
export interface RevealOptions {
  delayMs?: number;
  threshold?: number;
  once?: boolean;
}

export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options = {}) => {
  const { delayMs = 0, threshold = 0.12, once = true } = options;

  if (delayMs) {
    node.style.setProperty('--ds-reveal-delay', `${delayMs}ms`);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    node.classList.add('ds-reveal-in');
    return {};
  }

  node.classList.add('ds-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          node.classList.add('ds-reveal-in');
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          node.classList.remove('ds-reveal-in');
        }
      }
    },
    { threshold }
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
};
