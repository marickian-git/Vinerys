import { describe, expect, it } from 'vitest';
import { formatRoi, portfolio, roi, sparklinePath } from '@/utils/valuation';

describe('roi', () => {
  it('câștig/pierdere relativ la prețul de achiziție', () => {
    expect(roi(100, 150)).toBe(0.5);
    expect(roi(100, 80)).toBe(-0.2);
    expect(roi(0, 80)).toBeNull();
    expect(roi(100, null)).toBeNull();
    expect(formatRoi(0.5)).toBe('+50%');
    expect(formatRoi(-0.2)).toBe('-20%');
  });
});

describe('portfolio', () => {
  const wines = [
    { id: 'a', status: 'IN_CELLAR', quantity: 2, purchasePrice: 50, estimatedValue: 80 },
    { id: 'b', status: 'IN_CELLAR', quantity: 1, purchasePrice: 100, estimatedValue: 90 },
    { id: 'c', status: 'IN_CELLAR', quantity: 3, purchasePrice: null, estimatedValue: 20 },
    { id: 'd', status: 'CONSUMED', quantity: 0, purchasePrice: 10, estimatedValue: 99 },
  ];
  const p = portfolio(wines);
  it('totaluri pe sticle, doar vinurile cu ambele prețuri intră în ROI', () => {
    expect(p).toMatchObject({ bottles: 6, totalValue: 310, cost: 200, comparableValue: 250, gain: 50, roi: 0.25, missing: 1 });
    expect(p.gainers.map((r) => r.id)).toEqual(['a']);
    expect(p.losers.map((r) => r.id)).toEqual(['b']);
  });
});

describe('sparklinePath', () => {
  it('normalizează în cutie; sub 2 puncte nu desenează', () => {
    expect(sparklinePath([{ value: 1, recordedAt: '2026-01-01' }])).toBeNull();
    expect(sparklinePath([{ value: 10, recordedAt: '2026-01-01' }, { value: 20, recordedAt: '2026-07-01' }], 100, 10)).toBe('M0.0,10.0 L100.0,0.0');
  });
});
