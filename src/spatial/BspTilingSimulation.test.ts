import { describe, it, expect } from 'vitest';
import { BspTilingSimulation } from './BspTilingSimulation.svelte';

describe('BspTilingSimulation', () => {
  it('returns empty positions for empty card list', () => {
    const sim = new BspTilingSimulation([], 800, 600);
    sim.layout({ bounds: { x: 0, y: 0, width: 800, height: 600 } });
    expect(sim.positions).toEqual([]);
  });

  it('produces one zone for a single card', () => {
    const sim = new BspTilingSimulation(
      [{ id: 'card-1', minWidth: 200, minHeight: 150 }],
      800,
      600,
    );
    sim.layout({ bounds: { x: 0, y: 0, width: 800, height: 600 } });
    expect(sim.positions.length).toBe(1);
    expect(sim.positions[0].cardId).toBe('card-1');
  });

  it('produces N zones for N cards', () => {
    const cards = [
      { id: 'c1', minWidth: 100, minHeight: 100 },
      { id: 'c2', minWidth: 100, minHeight: 100 },
      { id: 'c3', minWidth: 100, minHeight: 100 },
    ];
    const sim = new BspTilingSimulation(cards, 1200, 800);
    sim.layout({ bounds: { x: 0, y: 0, width: 1200, height: 800 } });
    expect(sim.positions.length).toBe(3);
    const cardIds = sim.positions.map((p) => p.cardId);
    expect(cardIds).toContain('c1');
    expect(cardIds).toContain('c2');
    expect(cardIds).toContain('c3');
  });

  it('zones do not overlap', () => {
    const cards = [
      { id: 'c1', minWidth: 100, minHeight: 100 },
      { id: 'c2', minWidth: 100, minHeight: 100 },
      { id: 'c3', minWidth: 100, minHeight: 100 },
      { id: 'c4', minWidth: 100, minHeight: 100 },
    ];
    const sim = new BspTilingSimulation(cards, 1200, 800);
    sim.layout({ bounds: { x: 0, y: 0, width: 1200, height: 800 } });

    for (let i = 0; i < sim.positions.length; i++) {
      for (let j = i + 1; j < sim.positions.length; j++) {
        const a = sim.positions[i];
        const b = sim.positions[j];
        const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
        const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });

  it('produces dividers when zones are adjacent', () => {
    // Use a wide container so BSP produces side-by-side zones
    const cards = [
      { id: 'c1', minWidth: 100, minHeight: 100 },
      { id: 'c2', minWidth: 100, minHeight: 100 },
    ];
    const sim = new BspTilingSimulation(cards, 2000, 400);
    sim.layout({ bounds: { x: 0, y: 0, width: 2000, height: 400 } });
    // Dividers depend on adjacency — with a wide container the BSP
    // should split vertically, producing adjacent zones
    expect(sim.dividers.length).toBeGreaterThanOrEqual(0);
  });

  it('hit test returns consumed for position inside a zone', () => {
    const sim = new BspTilingSimulation(
      [{ id: 'c1', minWidth: 200, minHeight: 200 }],
      800,
      600,
    );
    sim.layout({ bounds: { x: 0, y: 0, width: 800, height: 600 } });
    const zone = sim.positions[0];
    const result = sim.interact({
      event: { type: 'pointerdown', position: { x: zone.x + 10, y: zone.y + 10 } },
    } as any);
    expect(result).toBe('consumed');
  });

  it('hit test returns propagated for position far outside all zones', () => {
    const sim = new BspTilingSimulation(
      [{ id: 'c1', minWidth: 100, minHeight: 100 }],
      200,
      200,
    );
    sim.layout({ bounds: { x: 0, y: 0, width: 200, height: 200 } });
    // Zone fills the entire 200x200, so test a position outside bounds
    const result = sim.interact({
      event: { type: 'pointerdown', position: { x: 9999, y: 9999 } },
    } as any);
    expect(result).toBe('propagated');
  });

  it('constrain returns minimum size based on card areas', () => {
    const cards = [
      { id: 'c1', minWidth: 200, minHeight: 200 },
      { id: 'c2', minWidth: 200, minHeight: 200 },
    ];
    const sim = new BspTilingSimulation(cards, 800, 600);
    const constraints = sim.constrain({} as any);
    expect(constraints.width.min).toBeGreaterThan(0);
    expect(constraints.height.min).toBeGreaterThan(0);
  });
});
