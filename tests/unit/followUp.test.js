import { describe, expect, it } from 'vitest';
import { pendingFollowUps } from '@/utils/followUp';

const now = new Date('2026-10-12T10:00:00');
const hoursAgo = (h) => new Date(now - h * 3600_000);

describe('pendingFollowUps', () => {
  it('cere follow-up după 12h, cel mult 7 zile, câte unul per vin (cel mai recent)', () => {
    const list = pendingFollowUps([
      { wineId: 'a', at: hoursAgo(20), wineName: 'A' },
      { wineId: 'a', at: hoursAgo(40), wineName: 'A' },
      { wineId: 'b', at: hoursAgo(2), wineName: 'B' },
      { wineId: 'c', at: hoursAgo(24 * 9), wineName: 'C' },
      { wineId: null, at: hoursAgo(20) },
    ], [], { now });
    expect(list.map((x) => [x.wineId, x.at.toISOString()])).toEqual([['a', hoursAgo(20).toISOString()]]);
  });

  it('o degustare din aceeași zi sau de după închide follow-up-ul', () => {
    const consumption = [{ wineId: 'a', at: hoursAgo(20) }];
    expect(pendingFollowUps(consumption, [{ wineId: 'a', tastedAt: hoursAgo(5) }], { now })).toEqual([]);
    expect(pendingFollowUps(consumption, [{ wineId: 'a', tastedAt: hoursAgo(24 * 5) }], { now })).toHaveLength(1);
    expect(pendingFollowUps(consumption, [{ wineId: 'b', tastedAt: hoursAgo(1) }], { now })).toHaveLength(1);
  });

  it('minAgeHours = 0 arată și consumul de acum', () => {
    expect(pendingFollowUps([{ wineId: 'b', at: hoursAgo(0.1) }], [], { now, minAgeHours: 0 })).toHaveLength(1);
  });
});
