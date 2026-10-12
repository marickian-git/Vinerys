import { describe, expect, it } from 'vitest';
import { buildDigest } from '@/utils/digest';

const now = new Date(2026, 9, 1);
const w = (id, over) => ({ id, name: `Vin ${id}`, status: 'IN_CELLAR', quantity: 1, ...over });

describe('buildDigest', () => {
  it('un singur vin → mesaj cu numele și link spre el', () => {
    const digest = buildDigest([w('a', { vintage: 2019, drinkFrom: 2020, drinkUntil: 2026 })], now);
    expect(digest).toEqual({ key: 'digest:2026-10', title: 'De băut curând 🍷', body: 'Vin a 2019 iese din fereastră anul acesta.', url: '/wines/a' });
  });

  it('mai multe categorii → rezumat și link spre plan', () => {
    const digest = buildDigest([
      w('a', { drinkFrom: 2015, drinkUntil: 2022 }), w('b', { drinkFrom: 2014, drinkUntil: 2021 }),
      w('c', { drinkFrom: 2026, drinkUntil: 2032 }), w('d', { drinkFrom: 2026, drinkUntil: 2030 }), w('e', { drinkFrom: 2026, drinkUntil: 2030 }),
    ], now);
    expect(digest.body).toBe('2 vinuri au trecut de vârf · 3 vinuri intră în fereastră anul acesta.');
    expect(digest.url).toBe('/planner');
  });

  it('nimic de spus → fără notificare; vinurile consumate nu contează', () => {
    expect(buildDigest([w('a', { drinkFrom: 2020, drinkUntil: 2035 })], now)).toBeNull();
    expect(buildDigest([w('a', { drinkFrom: 2015, drinkUntil: 2020, status: 'CONSUMED', quantity: 0 })], now)).toBeNull();
  });
});
