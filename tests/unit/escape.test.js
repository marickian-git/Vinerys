import { describe, expect, it } from 'vitest';
import { escapeCsv, escapeHtml } from '@/utils/escape';

describe('escapeHtml', () => {
  it('neutralizează payload-uri XSS', () => {
    const out = escapeHtml('<img src=x onerror="alert(1)">');
    expect(out).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(out).not.toContain('<');
  });

  it('escapează ampersand și apostrof', () => {
    expect(escapeHtml(`Château & Fils's`)).toBe('Château &amp; Fils&#39;s');
  });

  it('întoarce șir gol pentru null/undefined și convertește numere', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(2019)).toBe('2019');
  });
});

describe('escapeCsv', () => {
  it('pune ghilimele la valori cu virgulă, ghilimele sau linie nouă', () => {
    expect(escapeCsv('a,b')).toBe('"a,b"');
    expect(escapeCsv('spune "da"')).toBe('"spune ""da"""');
    expect(escapeCsv('rând\nnou')).toBe('"rând\nnou"');
  });

  it.each(['=SUM(A1)', '+1', '-1+2', '@cmd'])('blochează formula injection: %s', (value) => {
    expect(escapeCsv(value).replace(/^"/, '').startsWith("'")).toBe(true);
  });

  it('lasă valorile simple neschimbate', () => {
    expect(escapeCsv('Fetească Neagră')).toBe('Fetească Neagră');
    expect(escapeCsv(null)).toBe('');
  });
});
