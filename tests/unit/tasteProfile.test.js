import { describe, expect, it } from 'vitest';
import { buildTasteProfile, likeSignal, predictPreference, similarWines } from '@/utils/tasteProfile';

const wine = (id, over) => ({ id, type: 'RED', grapeVarieties: [], aromaProfile: [], ...over });
const history = [
  wine('a', { rating: 5, grapeVarieties: ['Fetească Neagră'], country: 'România', region: 'Dealu Mare', aromaProfile: ['prune', 'piper'] }),
  wine('b', { rating: 4, grapeVarieties: ['Fetească Neagră', 'Merlot'], country: 'România', aromaProfile: ['mure'] }),
  wine('c', { rating: 1, type: 'WHITE', grapeVarieties: ['Chardonnay'], country: 'Franța', aromaProfile: ['vanilie', 'unt'] }),
  wine('d', { isFavorite: true, grapeVarieties: ['Syrah'], aromaProfile: ['piper negru'] }),
  wine('e', { bottlesConsumed: 3, grapeVarieties: ['Merlot'] }),
  wine('f', {}),
];

describe('likeSignal', () => {
  it('rating, degustări, favorit, consum repetat', () => {
    expect(likeSignal({ rating: 5 })).toBe(1);
    expect(likeSignal({ rating: 1 })).toBe(-1);
    expect(likeSignal({ rating: 3, tastingRatings: [5] })).toBe(0.5);
    expect(likeSignal({ isFavorite: true })).toBe(0.8);
    expect(likeSignal({ bottlesConsumed: 2 })).toBe(0.3);
    expect(likeSignal({})).toBeNull();
  });
});

describe('buildTasteProfile', () => {
  const profile = buildTasteProfile(history);
  it('preferințele de top și ce să eviți', () => {
    expect(profile.evidence).toBe(5);
    expect(profile.confident).toBe(true);
    expect(profile.top.grape[0].label).toBe('Fetească Neagră');
    expect(profile.top.type[0].key).toBe('RED');
    expect(profile.top.aroma.map((a) => a.key)).toContain('SPICE');
    expect(profile.avoid.map((a) => a.key)).toContain('WHITE');
  });

  it('predicția favorizează vinurile cu trăsăturile plăcute și explică de ce', () => {
    const liked = predictPreference(wine('x', { grapeVarieties: ['Feteasca Neagra'], country: 'Romania' }), profile);
    const disliked = predictPreference(wine('y', { type: 'WHITE', grapeVarieties: ['Chardonnay'], country: 'Franța' }), profile);
    expect(liked.score).toBeGreaterThan(0.7);
    expect(disliked.score).toBeLessThan(0.3);
    expect(liked.reasons[0].kind).toBe('grape');
    expect(predictPreference(wine('z', { type: 'ROSE' }), profile).score).toBe(0.5);
  });
});

describe('similarWines', () => {
  it('găsește vinurile cu trăsături comune', () => {
    const [first] = similarWines(history[0], history);
    expect(first.wine.id).toBe('b');
    expect(similarWines(history[2], history)).toEqual([]);
  });
});
