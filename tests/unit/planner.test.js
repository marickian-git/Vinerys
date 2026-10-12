import { describe, expect, it } from 'vitest';
import { buildPlan, drinkWindow, spreadBottles } from '@/utils/planner';

describe('drinkWindow', () => {
  it('drinkFrom/Until, fallback pe agingPotential, capete lipsă', () => {
    expect(drinkWindow({ drinkFrom: 2024, drinkUntil: 2030 })).toEqual({ from: 2024, until: 2030 });
    expect(drinkWindow({ agingPotential: 'Se bea între 2026 și 2032' })).toEqual({ from: 2026, until: 2032 });
    expect(drinkWindow({ drinkUntil: 2028 })).toEqual({ from: 2028, until: 2028 });
    expect(drinkWindow({ agingPotential: '5-10 ani' })).toBeNull();
  });
});

describe('spreadBottles', () => {
  it('răspândește uniform sau ciclic', () => {
    expect(spreadBottles(2, 2026, 2031)).toEqual([2027, 2030]);
    expect(spreadBottles(1, 2026, 2026)).toEqual([2026]);
    expect(spreadBottles(5, 2026, 2027)).toEqual([2026, 2026, 2026, 2027, 2027]);
    expect(spreadBottles(0, 2026, 2030)).toEqual([]);
  });
});

describe('buildPlan', () => {
  const wines = [
    { id: 'old', name: 'Merlot 2015', quantity: 2, drinkFrom: 2018, drinkUntil: 2024, status: 'IN_CELLAR' },
    { id: 'end', name: 'Sauvignon 2023', quantity: 1, drinkFrom: 2024, drinkUntil: 2026, status: 'IN_CELLAR' },
    { id: 'long', name: 'Barolo 2019', quantity: 3, drinkFrom: 2028, drinkUntil: 2045, status: 'IN_CELLAR' },
    { id: 'none', name: 'Fără date', quantity: 4, status: 'IN_CELLAR' },
    { id: 'gone', name: 'Consumat', quantity: 0, drinkFrom: 2020, drinkUntil: 2030, status: 'CONSUMED' },
  ];
  const plan = buildPlan(wines, { currentYear: 2026, horizon: 10 });

  it('depășitele și cele care se încheie anul ăsta intră în anul curent, primele', () => {
    expect(plan.years[0]).toMatchObject({ year: 2026, bottles: 3 });
    expect(plan.years[0].wines.map((w) => [w.wineId, w.status, w.bottles])).toEqual([['old', 'overdue', 2], ['end', 'ending', 1]]);
    expect(plan.overdue).toBe(2);
  });

  it('vinurile cu fereastră lungă sunt împărțite, iar ce trece de orizont e numărat separat', () => {
    const barolo = plan.years.flatMap((y) => y.wines.filter((w) => w.wineId === 'long').map(() => y.year));
    expect(barolo.every((year) => year >= 2028)).toBe(true);
    expect(barolo.length + (plan.later?.bottles ?? 0)).toBe(3);
    expect(plan.later.from).toBe(2036);
  });

  it('fără fereastră → listă separată; consumatele nu intră', () => {
    expect(plan.unknown).toEqual([expect.objectContaining({ wineId: 'none', bottles: 4 })]);
    expect(plan.years.flatMap((y) => y.wines).some((w) => w.wineId === 'gone')).toBe(false);
  });
});
