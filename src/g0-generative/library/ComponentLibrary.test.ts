import { describe, it, expect } from 'vitest';
import { ComponentLibrary, defineComponent } from '../library/ComponentLibrary';

const MockButton = {} as import('svelte').Component<Record<string, unknown>>;
const MockText = {} as import('svelte').Component<Record<string, unknown>>;
const MockCard = {} as import('svelte').Component<Record<string, unknown>>;

describe('ComponentLibrary', () => {
  const lib = new ComponentLibrary({
    name: 'Test Library',
    description: 'A test component library',
    components: [
      defineComponent('Card', 'A card container', {
        title: { type: 'string', optional: true },
      }, { children: true }),
      defineComponent('Button', 'A button', {
        label: { type: 'string' },
        variant: { type: 'string', optional: true, default: 'primary' },
      }),
      defineComponent('Text', 'Display text', {
        content: { type: 'string' },
        size: { type: 'string', optional: true },
      }),
    ],
  });

  describe('registerComponent', () => {
    it('registers a Svelte component', () => {
      lib.registerComponent('Card', MockCard);
      expect(lib.getRegisteredComponent('Card')).toBe(MockCard);
    });

    it('registers multiple components', () => {
      const freshLib = new ComponentLibrary({
        name: 'Fresh',
        description: 'Fresh lib',
        components: [
          defineComponent('Card', 'A card', {}, { children: true }),
          defineComponent('Button', 'A button', { label: { type: 'string' } }),
          defineComponent('Text', 'Text', { content: { type: 'string' } }),
        ],
      });
      freshLib.registerComponent('Card', MockCard);
      freshLib.registerComponent('Button', MockButton);
      freshLib.registerComponent('Text', MockText);
      expect(freshLib.getRegisteredComponent('Card')).toBe(MockCard);
      expect(freshLib.getRegisteredComponent('Button')).toBe(MockButton);
      expect(freshLib.getRegisteredComponent('Text')).toBe(MockText);
    });

    it('returns undefined for unregistered component', () => {
      expect(lib.getRegisteredComponent('Unknown')).toBeUndefined();
    });

    it('overwrites previous registration for same name', () => {
      const freshLib = new ComponentLibrary({
        name: 'Fresh',
        description: 'Fresh lib',
        components: [defineComponent('Card', 'A card', {}, { children: true })],
      });
      freshLib.registerComponent('Card', MockCard);
      freshLib.registerComponent('Card', MockButton);
      expect(freshLib.getRegisteredComponent('Card')).toBe(MockButton);
    });
  });

  describe('getRegisteredComponents', () => {
    it('returns empty map when no components registered', () => {
      const emptyLib = new ComponentLibrary({
        name: 'Empty',
        description: 'No components',
        components: [],
      });
      expect(emptyLib.getRegisteredComponents().size).toBe(0);
    });

    it('returns populated map when components are registered', () => {
      const freshLib = new ComponentLibrary({
        name: 'Fresh',
        description: 'Fresh lib',
        components: [
          defineComponent('Card', 'A card', {}, { children: true }),
          defineComponent('Button', 'A button', { label: { type: 'string' } }),
        ],
      });
      freshLib.registerComponent('Card', MockCard);
      freshLib.registerComponent('Button', MockButton);
      const components = freshLib.getRegisteredComponents();
      expect(components.size).toBe(2);
      expect(components.get('Card')).toBe(MockCard);
      expect(components.get('Button')).toBe(MockButton);
    });

    it('returns a copy (not the internal map)', () => {
      lib.registerComponent('Card', MockCard);
      const map1 = lib.getRegisteredComponents();
      const map2 = lib.getRegisteredComponents();
      expect(map1).not.toBe(map2);
      expect(map1.get('Card')).toBe(map2.get('Card'));
    });
  });

  describe('hasComponent', () => {
    it('returns true for defined components', () => {
      expect(lib.hasComponent('Card')).toBe(true);
      expect(lib.hasComponent('Button')).toBe(true);
    });

    it('returns false for unknown components', () => {
      expect(lib.hasComponent('Unknown')).toBe(false);
    });
  });

  describe('getComponent', () => {
    it('returns schema for defined component', () => {
      const schema = lib.getComponent('Card');
      expect(schema).toBeDefined();
      expect(schema?.name).toBe('Card');
    });

    it('returns undefined for unknown component', () => {
      expect(lib.getComponent('Unknown')).toBeUndefined();
    });
  });

  describe('defineComponent', () => {
    it('creates a schema with correct name and description', () => {
      const schema = defineComponent('Foo', 'A foo', {});
      expect(schema.name).toBe('Foo');
      expect(schema.description).toBe('A foo');
    });

    it('orders required props before optional', () => {
      const schema = defineComponent('Bar', 'A bar', {
        requiredProp: { type: 'string' },
        optionalProp: { type: 'string', optional: true },
      });
      expect(schema.propOrder[0]).toBe('requiredProp');
      expect(schema.propOrder[1]).toBe('optionalProp');
    });

    it('sets children flag', () => {
      const schema = defineComponent('Container', 'A container', {}, { children: true });
      expect(schema.children).toBe(true);
    });

    it('sets svelteComponent in schema', () => {
      const schema = defineComponent('Widget', 'A widget', {}, { svelteComponent: 'Widget.svelte' });
      expect(schema.svelteComponent).toBe('Widget.svelte');
    });
  });
});
