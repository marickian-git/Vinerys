import { describe, expect, it } from 'vitest';
import { buildWeekendPlan, weekKey, weekendNotification, weekendStart } from '@/utils/weekendPlan';

const w = (id, over) => ({ id, name: id, status: 'IN_CELLAR', quantity: 1, type: 'RED', foodPairing: [], ...over });

describe('weekendStart', () => {
  it('vinerea săptămânii; în weekend, vinerea care tocmai a trecut', () => {
    expect(weekendStart(new Date(2026, 9, 12)).getDate()).toBe(16); // luni → vineri 16
    expect(weekendStart(new Date(2026, 9, 16)).getDate()).toBe(16);
    expect(weekendStart(new Date(2026, 9, 18)).getDate()).toBe(16); // duminică
    expect(weekKey(new Date(2026, 9, 17))).toBe(weekKey(new Date(2026, 9, 14)));
  });
});

describe('buildWeekendPlan', () => {
  const now = new Date(2026, 9, 14);
  const wines = [
    w('urgent', { drinkFrom: 2015, drinkUntil: 2024, foodPairing: ['Miel la cuptor'], servingTemperature: '16–18°C' }),
    w('ending', { drinkFrom: 2020, drinkUntil: 2026 }),
    w('red3', { drinkFrom: 2018, drinkUntil: 2027 }),
    w('white', { type: 'WHITE', drinkFrom: 2024, drinkUntil: 2030 }),
    w('young', { drinkFrom: 2030, drinkUntil: 2040 }),
    w('gone', { quantity: 0, drinkFrom: 2010, drinkUntil: 2012 }),
  ];
  const plan = buildWeekendPlan(wines, { now });

  it('trei seri, urgentele primele, cel mult două vinuri de același tip', () => {
    expect(plan.map((p) => [p.day, p.wine.id])).toEqual([['Vineri', 'urgent'], ['Sâmbătă', 'ending'], ['Duminică', 'white']]);
    expect(plan[0]).toMatchObject({ date: '2026-10-16', food: 'Miel la cuptor', servingTemperature: '16–18°C', urgent: true });
  });

  it('notificarea de vineri', () => {
    expect(weekendNotification(plan, now)).toEqual({ key: 'weekend:2026-10-16', title: 'Weekendul ăsta 🍷', body: 'Deschide urgent, merge cu miel la cuptor. Încă 2 idei în plan.', url: '/planner' });
    expect(weekendNotification([], now)).toBeNull();
  });
});
