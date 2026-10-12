import { describe, expect, it } from 'vitest';
import {
  classifyAroma, cleanText, dedupeLocations, deriveColor, foldKey,
  normalizeAromas, normalizeCountry, normalizeList, normalizeLocation, normalizeWineData,
} from '@/utils/normalize';

describe('cleanText / foldKey', () => {
  it('compactează spațiile, golul devine null, sedila devine virgulă', () => {
    expect(cleanText('  Frigider  ')).toBe('Frigider');
    expect(cleanText('Lada   afară')).toBe('Lada afară');
    expect(cleanText('   ')).toBeNull();
    expect(cleanText('Fetească Neagră Ştefăneşti')).toBe('Fetească Neagră Ștefănești');
  });

  it('foldKey ignoră diacriticele și majusculele', () => {
    expect(foldKey('Bucătărie ')).toBe(foldKey('bucatarie'));
    expect(foldKey('ROMÂNIA')).toBe('romania');
  });
});

describe('normalizeCountry', () => {
  it.each([
    ['Romania', 'România'], ['romania ', 'România'], ['Italy', 'Italia'], ['FRANCE', 'Franța'],
    ['Moldova', 'Republica Moldova'], ['USA', 'Statele Unite'], ['Franta', 'Franța'],
  ])('%s → %s', (input, expected) => expect(normalizeCountry(input)).toBe(expected));

  it('lasă țările necunoscute curățate și cu majusculă', () => {
    expect(normalizeCountry('  narnia ')).toBe('Narnia');
    expect(normalizeCountry('')).toBeNull();
  });
});

describe('locații', () => {
  it('refolosește forma existentă', () => {
    expect(normalizeLocation('frigider ', ['Frigider', 'Lada'])).toBe('Frigider');
    expect(normalizeLocation('bucatarie', ['Bucătărie'])).toBe('Bucătărie');
    expect(normalizeLocation('cămară', [])).toBe('Cămară');
  });

  it('deduplică și preferă forma cu diacritice', () => {
    expect(dedupeLocations(['Frigider', 'Frigider ', 'Bucatarie', 'Bucătărie', null, 'Lada'])).toEqual(['Bucătărie', 'Frigider', 'Lada']);
  });
});

describe('arome', () => {
  it('clasifică pe categorii, inclusiv aliasuri fără diacritice și în engleză', () => {
    expect(classifyAroma('coacaze')).toEqual({ name: 'coacăze negre', category: 'BLACK_FRUIT' });
    expect(classifyAroma('lamaie')).toEqual({ name: 'lămâie', category: 'CITRUS' });
    expect(classifyAroma('Vanilla')).toEqual({ name: 'vanilie', category: 'OAK' });
    expect(classifyAroma('ceva exotic')).toEqual({ name: 'ceva exotic', category: null });
  });

  it('elimină duplicatele după normalizare', () => {
    expect(normalizeAromas(['coacăze', 'coacaze', 'Cassis', 'lamaie', ' '])).toEqual(['coacăze negre', 'lămâie']);
  });

  it('listele păstrează ordinea și scot duplicatele', () => {
    expect(normalizeList(['Merlot', 'merlot ', 'Fetească Neagră', 'Feteasca Neagra'])).toEqual(['Merlot', 'Fetească Neagră']);
  });
});

describe('deriveColor', () => {
  it('din tip', () => {
    expect(deriveColor({ type: 'RED' })).toBe('RED');
    expect(deriveColor({ type: 'ROSE' })).toBe('ROSE');
    expect(deriveColor({ type: 'WHITE' })).toBe('WHITE');
  });

  it('din soiuri pentru spumant / desert / fortifiat', () => {
    expect(deriveColor({ type: 'SPARKLING', grapeVarieties: ['Chardonnay'] })).toBe('WHITE');
    expect(deriveColor({ type: 'SPARKLING', grapeVarieties: ['Lambrusco'] })).toBe('RED');
    expect(deriveColor({ type: 'FORTIFIED', grapeVarieties: ['Touriga Nacional'] })).toBe('RED');
    expect(deriveColor({ type: 'SPARKLING', grapeVarieties: ['Chardonnay', 'Pinot Noir'] })).toBeNull();
    expect(deriveColor({ type: 'DESSERT', grapeVarieties: [] })).toBeNull();
  });
});

describe('normalizeWineData', () => {
  it('aplică toate regulile și nu suprascrie culoarea aleasă', () => {
    const out = normalizeWineData({
      name: '  Cuvée  X ', type: 'ROSE', country: 'romania', cellarLocation: 'frigider ',
      grapeVarieties: ['Merlot', 'merlot'], aromaProfile: ['capsuni'], foodPairing: [], producer: '  ',
    }, { existingLocations: ['Frigider'] });
    expect(out).toMatchObject({
      name: 'Cuvée X', country: 'România', cellarLocation: 'Frigider', grapeVarieties: ['Merlot'],
      aromaProfile: ['căpșuni'], producer: null, color: 'ROSE',
    });
    expect(normalizeWineData({ type: 'RED', color: 'ORANGE' }).color).toBe('ORANGE');
  });
});
