import { describe, it, expect } from 'vitest';
import {
  createDefaultBsp,
  splitZone,
  flattenBsp,
  findZone,
  serializeBsp,
  deserializeBsp,
} from './zone-tiler-types';
import type { BspNode, ZoneLeaf } from './zone-tiler-types';

const dt = 6;

describe('zone-tiler-types', () => {
  it('createDefaultBsp produces a single leaf node', () => {
    const tree = createDefaultBsp('main', 'Main Zone');
    expect(tree.kind).toBe('leaf');
    expect(tree.id).toBe('main');
    expect(tree.label).toBe('Main Zone');
    expect(tree.privacyState).toBe('ouvert');
  });

  it('splitZone replaces a leaf with a split node', () => {
    const tree = createDefaultBsp('z1', 'Zone 1');
    const newZone: ZoneLeaf = { kind: 'leaf', id: 'z2', label: 'Zone 2', privacyState: 'ouvert' };
    const result = splitZone(tree, 'z1', 'horizontal', newZone, 0.5);

    expect(result.kind).toBe('split');
    if (result.kind === 'split') {
      expect(result.direction).toBe('horizontal');
      expect(result.ratio).toBe(0.5);
      expect(result.first.id).toBe('z1');
      expect(result.second.id).toBe('z2');
    }
  });

  it('flattenBsp returns one zone for a single leaf', () => {
    const tree = createDefaultBsp('leaf1', 'Leaf');
    const result = flattenBsp(tree, 0, 0, 800, 600, dt);

    expect(result.zones.length).toBe(1);
    expect(result.zones[0].id).toBe('leaf1');
    expect(result.zones[0].x).toBe(0);
    expect(result.zones[0].y).toBe(0);
    expect(result.zones[0].width).toBe(800);
    expect(result.zones[0].height).toBe(600);
    expect(result.dividers.length).toBe(0);
  });

  it('flattenBsp produces two zones and one divider for a horizontal split', () => {
    const tree = createDefaultBsp('z1', 'A');
    const newZone: ZoneLeaf = { kind: 'leaf', id: 'z2', label: 'B', privacyState: 'ouvert' };
    const split = splitZone(tree, 'z1', 'horizontal', newZone, 0.5);
    const result = flattenBsp(split, 0, 0, 800, 600, dt);

    expect(result.zones.length).toBe(2);
    expect(result.dividers.length).toBe(1);
    expect(result.dividers[0].direction).toBe('horizontal');
  });

  it('flattenBsp zones do not overlap', () => {
    const tree = createDefaultBsp('z1', 'A');
    const z2: ZoneLeaf = { kind: 'leaf', id: 'z2', label: 'B', privacyState: 'ouvert' };
    const split = splitZone(tree, 'z1', 'vertical', z2, 0.5);
    const result = flattenBsp(split, 0, 0, 800, 600, dt);

    const a = result.zones[0];
    const b = result.zones[1];
    const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
    const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
    expect(overlapX && overlapY).toBe(false);
  });

  it('findZone locates a leaf by id', () => {
    const tree = createDefaultBsp('target', 'Target');
    const found = findZone(tree, 'target');
    expect(found).not.toBeNull();
    expect(found!.id).toBe('target');
  });

  it('findZone returns null for nonexistent id', () => {
    const tree = createDefaultBsp('only', 'Only');
    expect(findZone(tree, 'missing')).toBeNull();
  });

  it('findZone searches nested splits', () => {
    const tree = createDefaultBsp('root', 'Root');
    const child: ZoneLeaf = { kind: 'leaf', id: 'child', label: 'Child', privacyState: 'ouvert' };
    const split = splitZone(tree, 'root', 'horizontal', child);
    const found = findZone(split, 'child');
    expect(found).not.toBeNull();
    expect(found!.id).toBe('child');
  });

  it('serializeBsp and deserializeBsp round-trip', () => {
    const tree = createDefaultBsp('rt', 'RoundTrip');
    const child: ZoneLeaf = { kind: 'leaf', id: 'c', label: 'C', privacyState: 'ouvert' };
    const split = splitZone(tree, 'rt', 'vertical', child, 0.7);

    const json = serializeBsp(split);
    const restored = deserializeBsp(json);

    expect(restored.kind).toBe('split');
    if (restored.kind === 'split') {
      expect(restored.ratio).toBe(0.7);
    }
  });

  it('flattenBsp with nested splits produces correct zone count', () => {
    let tree: BspNode = createDefaultBsp('z1', 'A');
    tree = splitZone(tree, 'z1', 'horizontal', { kind: 'leaf', id: 'z2', label: 'B', privacyState: 'ouvert' });
    const result = flattenBsp(tree, 0, 0, 800, 600, dt);
    expect(result.zones.length).toBe(2);
  });
});
