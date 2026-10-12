import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  autoMapColumns, buildPreview, detectDelimiter, detectSource, duplicateKey, mapRow,
  normalizeRating, parseCsv, parseNumber, parseWineType,
} from '@/utils/csvImport';

const fixture = (name) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');

describe('parseCsv', () => {
  it('ghilimele, virgule și newline-uri în câmpuri, BOM, CRLF', () => {
    const { headers, rows } = parseCsv('﻿a,b\r\n"x, y","linia 1\nlinia 2"\r\n"cu ""ghilimele""",2\r\n');
    expect(headers).toEqual(['a', 'b']);
    expect(rows).toEqual([{ a: 'x, y', b: 'linia 1\nlinia 2' }, { a: 'cu "ghilimele"', b: '2' }]);
  });

  it('detectează ; și tab', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t');
    expect(parseCsv('Nume;Tip\nX;Roșu').rows).toEqual([{ Nume: 'X', Tip: 'Roșu' }]);
  });
});

describe('conversii', () => {
  it.each([
    ['Red Wine', 'RED'], ['White Wine', 'WHITE'], ['Rosé', 'ROSE'], ['Sparkling', 'SPARKLING'],
    ['Dessert Wine', 'DESSERT'], ['Port', 'FORTIFIED'], ['Roșu', 'RED'], ['Mystery', null],
  ])('tip %s → %s', (input, expected) => expect(parseWineType(input)).toBe(expected));

  it('numere în format RO și US', () => {
    expect(parseNumber('189,00')).toBe(189);
    expect(parseNumber('1.234,50 lei')).toBe(1234.5);
    expect(parseNumber('$1,234.50')).toBe(1234.5);
    expect(parseNumber('')).toBeNull();
  });

  it('rating pe scara 1–5 sau 50–100', () => {
    expect(normalizeRating('4.5')).toBe(5);
    expect(normalizeRating('3.4')).toBe(3);
    expect(normalizeRating('92')).toBe(4);
    expect(normalizeRating('')).toBeNull();
  });
});

describe('Vivino', () => {
  const { headers, rows } = parseCsv(fixture('vivino.csv'));

  it('detectează formatul și mapează coloanele', () => {
    expect(detectSource(headers)).toBe('vivino');
    const mapping = autoMapColumns(headers, 'vivino');
    expect(mapping).toMatchObject({ name: 'Wine name', producer: 'Winery', type: 'Wine type', quantity: 'User cellar count', rating: 'Your rating' });
  });

  it('preview: rânduri noi, eroare, duplicat în fișier și față de colecție', () => {
    const mapping = autoMapColumns(headers, 'vivino');
    const existing = [duplicateKey({ name: 'Sole Chardonnay', producer: 'Cramele Recas', vintage: 2022 })];
    const preview = buildPreview(rows, mapping, existing);
    expect(preview.map((row) => row.status)).toEqual(['ok', 'ok', 'duplicate', 'error', 'duplicate']);
    expect(preview[0].wine).toMatchObject({
      name: 'Flamboyant', producer: 'Davino', vintage: 2017, type: 'RED', quantity: 2,
      purchasePrice: 189, rating: 5, tastingNotes: 'Intens, cu note de prune "uscate"', country: 'Romania',
    });
    expect(preview[1].wine.quantity).toBe(1);
    expect(preview[3].error).toMatch(/numele|Tip/);
  });

  it('fără nume, folosește producător + an', () => {
    expect(mapRow({ W: 'Davino', V: '2020', T: 'Red' }, { producer: 'W', vintage: 'V', type: 'T' }).wine.name).toBe('Davino 2020');
  });
});
