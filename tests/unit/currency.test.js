import { describe, expect, it, vi } from 'vitest';
import { convert, formatMoney, parseEcbXml, sumInCurrency } from '@/utils/currency';
import { getRates, resetRatesCache } from '@/server/fx';

const rates = { EUR: 1, RON: 5, USD: 1.1 };

describe('convert', () => {
  it('prin EUR, între orice monede cunoscute', () => {
    expect(convert(100, 'EUR', 'RON', rates)).toBe(500);
    expect(convert(500, 'RON', 'EUR', rates)).toBe(100);
    expect(convert(110, 'USD', 'RON', rates)).toBeCloseTo(500);
    expect(convert(10, 'RON', 'RON', null)).toBe(10);
    expect(convert(10, 'GBP', 'EUR', rates)).toBeNull();
    expect(convert(null, 'EUR', 'RON', rates)).toBeNull();
  });
});

describe('formatMoney', () => {
  it('format românesc, simbol după sumă', () => {
    expect(formatMoney(100, 'EUR')).toMatch(/^100\s€$/);
    expect(formatMoney(1234.5, 'RON')).toMatch(/^1\.235\slei$/);
    expect(formatMoney(12.5, 'EUR')).toMatch(/^12,50\s€$/);
    expect(formatMoney(null)).toBe('—');
  });
});

describe('sumInCurrency', () => {
  it('convertește ce se poate și păstrează separat restul', () => {
    const parts = [{ currency: 'EUR', amount: 100 }, { currency: 'RON', amount: 250 }, { currency: 'GBP', amount: 40 }];
    expect(sumInCurrency(parts, 'EUR', rates)).toEqual({ total: 150, unconverted: { GBP: 40 } });
    expect(sumInCurrency([{ currency: 'EUR', amount: 7 }], 'EUR', null)).toEqual({ total: 7, unconverted: {} });
  });
});

describe('cursuri BCE', () => {
  const xml = `<Cube><Cube time='2026-10-09'><Cube currency='USD' rate='1.0812'/><Cube currency='RON' rate='4.9731'/></Cube></Cube>`;

  it('parsează fluxul zilnic', () => {
    expect(parseEcbXml(xml)).toEqual({ EUR: 1, USD: 1.0812, RON: 4.9731 });
    expect(parseEcbXml('<html/>')).toBeNull();
  });

  it('cache 12h; la eroare folosește ultimul curs sau FX_RATES_JSON', async () => {
    resetRatesCache();
    const ok = vi.fn().mockResolvedValue(new Response(xml));
    expect((await getRates({ fetchImpl: ok, now: 0 })).RON).toBe(4.9731);
    await getRates({ fetchImpl: ok, now: 1000 });
    expect(ok).toHaveBeenCalledOnce();
    const down = vi.fn().mockRejectedValue(new Error('offline'));
    expect((await getRates({ fetchImpl: down, now: 13 * 3600_000 })).RON).toBe(4.9731);
    // după eșec, nu reîncearcă imediat
    await getRates({ fetchImpl: down, now: 13 * 3600_000 + 1000 });
    expect(down).toHaveBeenCalledOnce();
    resetRatesCache();
    vi.stubEnv('FX_RATES_JSON', '{"RON":5}');
    expect(await getRates({ fetchImpl: down })).toEqual({ EUR: 1, RON: 5 });
    vi.unstubAllEnvs();
  });
});
