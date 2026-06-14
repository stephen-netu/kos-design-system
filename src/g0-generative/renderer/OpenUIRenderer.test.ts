import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { ComponentLibrary, defineComponent } from '../library/ComponentLibrary';
import OpenUIRenderer from './OpenUIRenderer.svelte';
import type { OpenUIAST } from '../parser/types';

function createAST(rootId: string, nodes: Map<string, any>): OpenUIAST {
    return { root: rootId, nodes, errors: [] };
}

const MockCard = () => {};
MockCard.__svelte_meta = null;

describe('OpenUIRenderer', () => {
    afterEach(() => cleanup());

    const lib = new ComponentLibrary({
        name: 'Test Library',
        description: 'Test',
        components: [
            defineComponent('Card', 'A card', {}, { children: true }),
            defineComponent('Button', 'A button', { label: { type: 'string' } }),
            defineComponent('Text', 'Text', { content: { type: 'string' } }),
        ],
    });

    it('renders empty state when ast is null', () => {
        const { container } = render(OpenUIRenderer, {
            props: { ast: null, library: lib },
        });
        expect(container.querySelector('.openui-empty')).not.toBeNull();
    });

    it('renders skeleton for placeholder root', () => {
        const nodes = new Map([
            ['root', { type: 'placeholder', identifier: 'root', referencedBy: [], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelector('.openui-skeleton')).not.toBeNull();
    });

    it('renders element root with registered component', () => {
        lib.registerComponent('Card', MockCard as any);
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Card', args: [], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelector('.openui-empty')).toBeNull();
        expect(container.querySelector('.openui-skeleton')).toBeNull();
    });

    it('renders unregistered component children inline', () => {
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Unknown', args: [], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelector('.openui-empty')).toBeNull();
    });

    it('passes props to registered components', () => {
        lib.registerComponent('Button', MockCard as any);
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Button', args: ['Click me'], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelector('.openui-empty')).toBeNull();
    });

    it('renders children for registered parent component', () => {
        lib.registerComponent('Card', MockCard as any);
        lib.registerComponent('Text', MockCard as any);
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Card', args: [['child1']], line: 1 }],
            ['child1', { type: 'element', identifier: 'child1', component: 'Text', args: ['Hello'], line: 2 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelector('.openui-empty')).toBeNull();
    });

    it('renders fallback snippet when provided and ast is null', () => {
        const { container } = render(OpenUIRenderer, {
            props: {
                ast: null,
                library: lib,
                fallback: () => ({ render: () => '<div class="custom-fallback">Loading</div>' }),
            } as any,
        });
        expect(container.querySelector('.openui-empty')).not.toBeNull();
    });

    it('handles streaming state', () => {
        const nodes = new Map([
            ['root', { type: 'placeholder', identifier: 'root', referencedBy: [], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib, isStreaming: true },
        });
        const skeleton = container.querySelector('.openui-skeleton');
        expect(skeleton).not.toBeNull();
        expect(skeleton?.getAttribute('aria-busy')).toBe('true');
    });

    it('buildRegistry returns registered components from library', () => {
        lib.registerComponent('Card', MockCard as any);
        lib.registerComponent('Button', MockCard as any);
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Card', args: [], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelector('.openui-empty')).toBeNull();
    });
});
