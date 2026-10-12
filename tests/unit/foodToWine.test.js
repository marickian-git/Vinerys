import { describe, expect, it } from 'vitest';
import { foodToWinePrompt, heuristicMatch, normalizeFoodPicks, pairingCandidates, rankPicks, urgencyScore } from '@/utils/foodToWine';

const Y = 2026;
const w = (id, over) => ({ id, name: id, status: 'IN_CELLAR', quantity: 1, foodPairing: [], ...over });

describe('urgencyScore', () => {
  it('ordinea: trecut > ultimul an > spre final > abia intrat > tânăr', () => {
    const overdue = urgencyScore({ drinkFrom: 2015, drinkUntil: 2024 }, Y);
    const ending = urgencyScore({ drinkFrom: 2020, drinkUntil: 2026 }, Y);
    const late = urgencyScore({ drinkFrom: 2018, drinkUntil: 2028 }, Y);
    const early = urgencyScore({ drinkFrom: 2025, drinkUntil: 2035 }, Y);
    const young = urgencyScore({ drinkFrom: 2030, drinkUntil: 2040 }, Y);
    expect([overdue, ending]).toEqual([1, 0.9]);
    expect(late).toBeGreaterThan(early);
    expect(early).toBeGreaterThan(young);
    expect(urgencyScore({}, Y)).toBe(0.4);
  });
});

describe('heuristicMatch', () => {
  it('găsește preparatul în asocierile vinului, tolerant la forme', () => {
    const wine = w('a', { foodPairing: ['Miel la cuptor', 'Brânzeturi maturate'] });
    expect(heuristicMatch('mielul cu rozmarin', wine).match).toBeCloseTo(1 / 2);
    expect(heuristicMatch('Miel la cuptor', wine)).toEqual({ match: 1, reason: 'Se potrivește cu „Miel la cuptor”' });
    expect(heuristicMatch('sushi', wine).match).toBe(0);
  });
});

describe('AI: prompt și validare', () => {
  const candidates = pairingCandidates([w('a'), w('b'), w('gone', { quantity: 0 }), w('sold', { status: 'SOLD' })]);
  it('doar vinurile din pivniță ajung la AI', () => {
    expect(candidates.map((c) => c.id)).toEqual(['a', 'b']);
    expect(foodToWinePrompt('sarmale', candidates)).toContain('"sarmale"');
  });
  it('id-urile inventate sunt eliminate; fără niciun id valid → eroare', () => {
    expect(normalizeFoodPicks({ picks: [{ id: 'a', match: 1.4, reason: 'x' }, { id: 'inventat', match: 1 }, { id: 'a', match: 0.2 }] }, ['a', 'b']))
      .toEqual({ picks: [{ id: 'a', match: 1, reason: 'x' }] });
    expect(() => normalizeFoodPicks({ picks: [{ id: 'z' }] }, ['a'])).toThrow();
  });
});

describe('rankPicks', () => {
  it('la potrivire egală câștigă vinul mai urgent; maxim 3', () => {
    const wines = [w('young', { drinkFrom: 2030, drinkUntil: 2040 }), w('urgent', { drinkFrom: 2015, drinkUntil: 2025 }), w('c'), w('d')];
    const ranked = rankPicks(['young', 'urgent', 'c', 'd'].map((id) => ({ id, match: 0.8 })), wines, { year: Y });
    expect(ranked).toHaveLength(3);
    expect(ranked[0].wine.id).toBe('urgent');
    expect(ranked.map((r) => r.wine.id)).not.toContain('young');
  });
});
