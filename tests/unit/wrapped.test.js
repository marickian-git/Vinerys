import { describe, expect, it } from 'vitest';
import { buildWrapped, wrappedShareText } from '@/utils/wrapped';

const wine = (id, over = {}) => ({ id, name: `Vin ${id}`, producer: 'Davino', country: 'România', type: 'RED', grapeVarieties: ['Fetească Neagră'], rating: null, isFavorite: false, ...over });

const consumptions = [
  { quantity: 2, at: new Date(2026, 0, 10), wine: wine('a', { rating: 5, purchasePrice: 120 }) },
  { quantity: 1, at: new Date(2026, 5, 2), wine: wine('b', { producer: 'Catena', country: 'Argentina', grapeVarieties: ['Malbec'], purchasePrice: 200 }) },
  { quantity: 1, at: new Date(2026, 5, 20), wine: wine('a', { rating: 5, purchasePrice: 120 }) },
  { quantity: 3, at: new Date(2025, 11, 31), wine: wine('old') },
  { quantity: 1, at: new Date(2026, 6, 1), wine: null },
];

describe('buildWrapped', () => {
  const w = buildWrapped({ year: 2026, consumptions, cellar: [{ quantity: 4, estimatedValue: 50 }, { quantity: 0, estimatedValue: 99 }] });

  it('numără doar anul cerut', () => {
    expect(w.bottles).toBe(4);
    expect(w.wines).toBe(2);
  });

  it('topuri ponderate cu numărul de sticle', () => {
    expect(w.countries).toEqual({ count: 2, top: [{ name: 'România', count: 3 }, { name: 'Argentina', count: 1 }] });
    expect(w.varieties.top[0]).toEqual({ name: 'Fetească Neagră', count: 3 });
    expect(w.topProducer).toEqual({ name: 'Davino', count: 3 });
  });

  it('favorite, cea mai scumpă sticlă, luna cea mai activă, colecția', () => {
    expect(w.favorites.map((f) => f.id)).toEqual(['a']);
    expect(w.mostExpensive).toEqual({ id: 'b', name: 'Vin b', price: 200 });
    expect(w.busiestMonth).toBe(0);
    expect(w.months[5]).toBe(2);
    expect(w.collection).toEqual({ bottles: 4, value: 200 });
  });

  it('an gol', () => {
    const empty = buildWrapped({ year: 2020, consumptions });
    expect(empty).toMatchObject({ bottles: 0, busiestMonth: null, topProducer: null, mostExpensive: null });
  });

  it('text de distribuit', () => {
    expect(wrappedShareText(w)).toBe('🍷 2026 în Vinerys: 4 sticle din 2 țări · soiul anului: Fetească Neagră · producătorul preferat: Davino.');
  });
});
