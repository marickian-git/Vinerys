import { describe, expect, it } from 'vitest';
import { BADGES, evaluateBadges, nextChallenge } from '@/utils/badges';

describe('evaluateBadges', () => {
  it('niveluri și progres spre următorul prag', () => {
    const byId = Object.fromEntries(evaluateBadges({ countries: 11, varieties: 7, tastings: 0, bottlesConsumed: 100 }).map((b) => [b.id, b]));
    expect(byId.globetrotter).toMatchObject({ level: 3, tierName: 'Aur', next: 20 });
    expect(byId.globetrotter.progress).toBeCloseTo(0.1);
    expect(byId['grape-explorer']).toMatchObject({ level: 1, tierName: 'Bronz', next: 10 });
    expect(byId.taster).toMatchObject({ level: 0, tierName: null, next: 1, progress: 0 });
    expect(byId['open-bottles']).toMatchObject({ level: 4, tierName: 'Platină', next: null, progress: 1 });
  });

  it('fiecare badge are 4 praguri crescătoare', () => {
    for (const badge of BADGES) {
      expect(badge.tiers).toHaveLength(4);
      expect([...badge.tiers].sort((a, b) => a - b)).toEqual(badge.tiers);
    }
  });
});

describe('nextChallenge', () => {
  it('alege badge-ul cel mai aproape de următorul nivel', () => {
    const challenge = nextChallenge(evaluateBadges({ countries: 9, varieties: 1 }));
    expect(challenge.id).toBe('globetrotter');
  });
});
