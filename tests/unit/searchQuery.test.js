import { describe, expect, it } from 'vitest';
import { likePattern, parseSearchQuery } from '@/utils/searchQuery';

describe('parseSearchQuery', () => {
  it('exemplul din issue', () => {
    expect(parseSearchQuery('Roșii gata de băut sub 150 lei')).toEqual({ type: 'RED', readyNow: true, priceMax: 150, text: '' });
  });

  it.each([
    ['albe peste 50', { type: 'WHITE', priceMin: 50, text: '' }],
    ['fetească neagră 2019', { vintage: 2019, text: 'feteasca neagra' }],
    ['spumante favorite', { type: 'SPARKLING', isFavorite: true, text: '' }],
    ['vinuri trecute de vârf', { overdue: true, text: '' }],
    ['rose sub 12,5 €', { type: 'ROSE', priceMax: 12.5, text: '' }],
    ['Davino Flamboyant', { text: 'davino flamboyant' }],
  ])('%s', (input, expected) => {
    expect(parseSearchQuery(input)).toEqual(expected);
  });
});

describe('likePattern', () => {
  it('escapează % și _', () => {
    expect(likePattern('50%_x')).toBe('%50\\%\\_x%');
  });
});
