import { describe, it, expect } from 'vitest';
import {
  nodeHitTest,
  domEventToCanvasCoords,
  parseMentionEdges,
  parseGroupedSequenceEdges,
} from './utils';

describe('n1-flow-canvas/utils', () => {
  describe('nodeHitTest', () => {
    it('returns node id when point is inside a node rect', () => {
      const positions = new Map([
        ['n1', { id: 'n1', x: 10, y: 20, width: 100, height: 50 }],
        ['n2', { id: 'n2', x: 200, y: 200, width: 80, height: 40 }],
      ]);
      expect(nodeHitTest(50, 40, positions)).toBe('n1');
    });

    it('returns null when point is outside all nodes', () => {
      const positions = new Map([
        ['n1', { id: 'n1', x: 10, y: 20, width: 100, height: 50 }],
      ]);
      expect(nodeHitTest(500, 500, positions)).toBeNull();
    });

    it('returns null for empty positions map', () => {
      expect(nodeHitTest(50, 50, new Map())).toBeNull();
    });

    it('returns first matching node for overlapping rects', () => {
      const positions = new Map<string, { id: string; x: number; y: number; width: number; height: number }>();
      positions.set('a', { id: 'a', x: 0, y: 0, width: 100, height: 100 });
      positions.set('b', { id: 'b', x: 50, y: 50, width: 100, height: 100 });
      const result = nodeHitTest(60, 60, positions);
      expect(result).toBe('a');
    });
  });

  describe('domEventToCanvasCoords', () => {
    it('converts DOM event to canvas pixel coordinates', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 50,
            top: 100,
            width: 200,
            height: 400,
          }),
        },
      } as unknown as MouseEvent;

      const coords = domEventToCanvasCoords(mockEvent, 800, 1600);
      expect(coords.x).toBe(200);
      expect(coords.y).toBe(400);
    });

    it('handles identity scale (1:1)', () => {
      const mockEvent = {
        clientX: 150,
        clientY: 250,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 50,
            top: 50,
            width: 800,
            height: 600,
          }),
        },
      } as unknown as MouseEvent;

      const coords = domEventToCanvasCoords(mockEvent, 800, 600);
      expect(coords.x).toBe(100);
      expect(coords.y).toBe(200);
    });
  });

  describe('parseMentionEdges', () => {
    it('parses edges from description mentions', () => {
      const items = [
        { id: 'wt-1', description: 'Depends on wt-2 for setup' },
        { id: 'wt-2', description: 'No deps' },
      ];
      const edges = parseMentionEdges(
        items,
        (t) => t.id,
        (t) => t.description ?? '',
        /wt-(\d+)/g,
        (m) => `wt-${m}`,
      );
      expect(edges.size).toBe(1);
      expect(edges.has('wt-1->wt-2')).toBe(true);
    });

    it('returns empty map for items with no mentions', () => {
      const items = [
        { id: 'wt-1', description: 'No references here' },
        { id: 'wt-2', description: 'Also none' },
      ];
      const edges = parseMentionEdges(
        items,
        (t) => t.id,
        (t) => t.description ?? '',
        /wt-(\d+)/g,
        (m) => `wt-${m}`,
      );
      expect(edges.size).toBe(0);
    });

    it('skips mentions to unknown ids', () => {
      const items = [
        { id: 'wt-1', description: 'Depends on wt-999' },
      ];
      const edges = parseMentionEdges(
        items,
        (t) => t.id,
        (t) => t.description ?? '',
        /wt-(\d+)/g,
        (m) => `wt-${m}`,
      );
      expect(edges.size).toBe(0);
    });
  });

  describe('parseGroupedSequenceEdges', () => {
    it('chains items sharing the same group key', () => {
      const items = [
        { id: 'a', domain: 'x', workspace: 'w1', createdAt: '2024-01-01' },
        { id: 'b', domain: 'x', workspace: 'w1', createdAt: '2024-01-02' },
        { id: 'c', domain: 'x', workspace: 'w1', createdAt: '2024-01-03' },
      ];
      const edges = parseGroupedSequenceEdges(
        items,
        (t) => t.id,
        (t) => `${t.domain}:${t.workspace}`,
        (t) => t.createdAt,
      );
      expect(edges.size).toBe(2);
      expect(edges.has('a->b')).toBe(true);
      expect(edges.has('b->c')).toBe(true);
    });

    it('returns empty map for single-item groups', () => {
      const items = [
        { id: 'a', domain: 'x', workspace: 'w1', createdAt: '2024-01-01' },
        { id: 'b', domain: 'y', workspace: 'w2', createdAt: '2024-01-01' },
      ];
      const edges = parseGroupedSequenceEdges(
        items,
        (t) => t.id,
        (t) => `${t.domain}:${t.workspace}`,
        (t) => t.createdAt,
      );
      expect(edges.size).toBe(0);
    });

    it('handles empty input', () => {
      const edges = parseGroupedSequenceEdges(
        [] as any[],
        (t: any) => t.id,
        (t: any) => t.group,
        (t: any) => t.sort,
      );
      expect(edges.size).toBe(0);
    });
  });
});
