import { describe, expect, it } from 'vitest';
import {
  chooseEnrichment, consensus, identityResultStatus, normalizeEnrichment, normalizeIdentification, parseJson,
} from '@/utils/aiProviders';

const item = (result, weight = 1) => ({ result, weight });

describe('parseJson', () => {
  it('extrage JSON din răspunsuri cu markdown sau text în jur', () => {
    expect(parseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJson('Iată: {"name":"X"} gata')).toEqual({ name: 'X' });
  });

  it('aruncă eroare când nu există JSON', () => {
    expect(() => parseJson('nimic aici')).toThrow();
  });
});

describe('normalizeIdentification', () => {
  it('validează anul, tipul și culoarea', () => {
    const r = normalizeIdentification({ name: ' Fetească ', vintage: '2019', type: 'RED', color: 'PURPLE', grapeVarieties: ['a', '', 'b'] });
    expect(r.name).toBe('Fetească');
    expect(r.vintage).toBe(2019);
    expect(r.type).toBe('RED');
    expect(r.color).toBeNull();
    expect(r.grapeVarieties).toEqual(['a', 'b']);
  });

  it('respinge ani imposibili', () => {
    expect(normalizeIdentification({ vintage: 1700 }).vintage).toBeNull();
    expect(normalizeIdentification({ vintage: new Date().getFullYear() + 1 }).vintage).toBeNull();
  });

  it('clasifică utilitatea identificării', () => {
    expect(identityResultStatus(normalizeIdentification({}))).toBe('EMPTY');
    expect(identityResultStatus(normalizeIdentification({ name: 'X' }))).toBe('PARTIAL');
    expect(identityResultStatus(normalizeIdentification({ name: 'X', producer: 'Y' }))).toBe('USEFUL');
  });
});

describe('normalizeEnrichment', () => {
  it('fără an de recoltă nu există fereastră de consum', () => {
    const r = normalizeEnrichment({ drinkFrom: 2025, drinkUntil: 2030 }, { vintage: null });
    expect(r.drinkFrom).toBeNull();
    expect(r.drinkUntil).toBeNull();
  });

  it('elimină ferestre inversate și limitează încrederea la [0,1]', () => {
    const r = normalizeEnrichment({ drinkFrom: 2035, drinkUntil: 2030, drinkWindowConfidence: 7 }, { vintage: 2019 });
    expect(r.drinkFrom).toBeNull();
    expect(r.drinkUntil).toBeNull();
    expect(r.drinkWindowConfidence).toBe(1);
  });

  it('acceptă doar valori basis cunoscute', () => {
    expect(normalizeEnrichment({ drinkWindowBasis: 'MAGIC' }, { vintage: 2019 }).drinkWindowBasis).toBe('UNKNOWN');
  });
});

describe('consensus (vot ponderat per câmp)', () => {
  it('câștigă valoarea cu greutatea cea mai mare, ignorând diacriticele și majusculele', () => {
    const { result, fieldConfidence } = consensus(
      [item({ name: 'Fetească Neagră' }, 1), item({ name: 'feteasca neagra' }, 1), item({ name: 'Merlot' }, 1.5)],
      ['name'],
    );
    expect(result.name).toBe('Fetească Neagră');
    expect(fieldConfidence.name).toBeCloseTo(2 / 3.5);
  });

  it('un agent cu greutate mare poate bate majoritatea', () => {
    const { result } = consensus([item({ vintage: 2018 }, 1), item({ vintage: 2018 }, 1), item({ vintage: 2019 }, 3)], ['vintage']);
    expect(result.vintage).toBe(2019);
  });

  it('câmp lipsă la toți → null și încredere 0', () => {
    const { result, fieldConfidence } = consensus([item({ name: 'X' })], ['region']);
    expect(result.region).toBeNull();
    expect(fieldConfidence.region).toBe(0);
  });
});

describe('chooseEnrichment', () => {
  it('preferă sursa cu basis mai specific', () => {
    const chosen = chooseEnrichment([
      { provider: 'a', weight: 2, result: { drinkWindowBasis: 'GENERIC_ESTIMATE', drinkWindowConfidence: 0.9, drinkFrom: 2024, drinkUntil: 2026 } },
      { provider: 'b', weight: 1, result: { drinkWindowBasis: 'EXACT_WINE', drinkWindowConfidence: 0.6, drinkFrom: 2025, drinkUntil: 2035 } },
    ]);
    expect(chosen.enrichmentProvider).toBe('b');
    expect(chosen.drinkUntil).toBe(2035);
  });

  it('încredere 0 pentru fereastra incompletă', () => {
    const chosen = chooseEnrichment([{ provider: 'a', weight: 1, result: { drinkWindowBasis: 'EXACT_WINE', drinkWindowConfidence: 0.8, drinkFrom: 2025 } }]);
    expect(chosen.drinkWindowConfidence).toBe(0);
  });
});
