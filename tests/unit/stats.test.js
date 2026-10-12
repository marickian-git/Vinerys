import { describe, expect, it } from 'vitest';
import { countsBy, monthlySeries, nearMaturityWines, overdueWines } from '@/utils/stats';

const YEAR = 2026;
const wine = (over) => ({ id: Math.random().toString(36), status: 'IN_CELLAR', drinkFrom: null, drinkUntil: null, agingPotential: null, ...over });

describe('overdueWines', () => {
  it('folosește drinkUntil, apoi anul maxim din agingPotential', () => {
    const list = overdueWines([
      wine({ id: 'a', drinkUntil: 2024 }),
      wine({ id: 'b', drinkUntil: 2026 }),
      wine({ id: 'c', agingPotential: 'Se bea între 2019 și 2022' }),
      wine({ id: 'd', drinkUntil: 2020, status: 'CONSUMED' }),
    ], YEAR);
    expect(list.map((w) => w.id)).toEqual(['c', 'a']);
  });
});

describe('nearMaturityWines', () => {
  it('include vinurile în fereastră sau care intră în 3 ani, ordonate după anul în care sunt gata', () => {
    const list = nearMaturityWines([
      wine({ id: 'now', drinkFrom: 2024, drinkUntil: 2030 }),
      wine({ id: 'soon', drinkFrom: 2028, drinkUntil: 2035 }),
      wine({ id: 'later', drinkFrom: 2032, drinkUntil: 2040 }),
      wine({ id: 'past', drinkFrom: 2015, drinkUntil: 2020 }),
      wine({ id: 'text', agingPotential: 'gata din 2027' }),
    ], YEAR);
    expect(list.map((w) => [w.id, w.readyYear])).toEqual([['now', 2024], ['text', 2027], ['soon', 2028]]);
  });

  it('limitează la 5', () => {
    const many = Array.from({ length: 8 }, (_, i) => wine({ drinkFrom: 2020 + i, drinkUntil: 2040 }));
    expect(nearMaturityWines(many, YEAR)).toHaveLength(5);
  });
});

describe('monthlySeries', () => {
  it('12 luni, cu zero unde lipsesc date', () => {
    const now = new Date(2026, 9, 11);
    const series = monthlySeries([
      { month: new Date(Date.UTC(2026, 9, 1)), count: 3 },
      { month: new Date(Date.UTC(2025, 10, 1)), count: 1n },
      { month: new Date(Date.UTC(2024, 0, 1)), count: 9 },
    ], now);
    expect(series).toHaveLength(12);
    expect(series.at(-1).count).toBe(3);
    expect(series[0].count).toBe(1);
    expect(series.reduce((sum, item) => sum + item.count, 0)).toBe(4);
  });
});

describe('countsBy', () => {
  it('transformă groupBy în obiect și ignoră null', () => {
    expect(countsBy([{ type: 'RED', _count: { _all: 2 } }, { type: null, _count: { _all: 1 } }], 'type')).toEqual({ RED: 2 });
  });
});
