import type { Snippet } from 'svelte';
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { ComponentLibrary, defineComponent } from '../library/ComponentLibrary';
import OpenUIRenderer from './OpenUIRenderer.svelte';
import Card from '../../u0-primitives/card/Card.svelte';
import Button from '../../u0-primitives/button/Button.svelte';
import Text from '../components/Text.svelte';
import type { OpenUIAST, OpenUINode } from '../parser/types';

function createAST(rootId: string, nodes: Map<string, OpenUINode>): OpenUIAST {
    return { root: rootId, nodes, errors: [] };
}

describe('OpenUIRenderer', () => {
    afterEach(() => cleanup());

    const lib = new ComponentLibrary({
        name: 'Test Library',
        description: 'Test',
        components: [
            defineComponent('Card', 'A card', {
                class: { type: 'string', optional: true },
            }, { children: true }),
            defineComponent('Button', 'A button', {
                label: { type: 'string' },
                class: { type: 'string', optional: true },
            }),
            defineComponent('Text', 'Text', {
                content: { type: 'string' },
                size: { type: 'enum', values: ['sm', 'md', 'lg', 'xl'], optional: true },
                class: { type: 'string', optional: true },
            }),
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
        lib.registerComponent('Card', Card);
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Card', args: [], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelector('.ds-card')).not.toBeNull();
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
        lib.registerComponent('Button', Button);
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Button', args: ['Click me'], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        const button = container.querySelector('.ds-button');
        expect(button).not.toBeNull();
        expect(button?.getAttribute('type')).toBe('button');
    });

    it('renders Text from OpenUI DSL', () => {
        lib.registerComponent('Text', Text);
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Text', args: ['Hello OpenUI'], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelector('.openui-text')?.textContent).toBe('Hello OpenUI');
    });

    it('renders nested children through registered components', () => {
        lib.registerComponent('Card', Card);
        lib.registerComponent('Text', Text);
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Card', args: [['child1']], line: 1 }],
            ['child1', { type: 'element', identifier: 'child1', component: 'Text', args: ['Nested text'], line: 2 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelectorAll('.ds-card').length).toBe(1);
        expect(container.querySelector('.openui-text')?.textContent).toBe('Nested text');
    });

    it('renders fallback snippet when provided and ast is null', () => {
        const fallback: Snippet = () => '<div class="custom-fallback">Loading</div>';
        const { container } = render(OpenUIRenderer, {
            props: {
                ast: null,
                library: lib,
                fallback,
            },
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
        lib.registerComponent('Card', Card);
        lib.registerComponent('Button', Button);
        const nodes = new Map([
            ['root', { type: 'element', identifier: 'root', component: 'Button', args: ['Save'], line: 1 }],
        ]);
        const ast = createAST('root', nodes);
        const { container } = render(OpenUIRenderer, {
            props: { ast, library: lib },
        });
        expect(container.querySelector('.ds-button')).not.toBeNull();
    });
});
