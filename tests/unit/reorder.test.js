import { describe, expect, it } from 'vitest';
import { reorderLinks, shouldSuggestReorder } from '@/utils/reorder';

describe('shouldSuggestReorder', () => {
  const base = { quantity: 0, status: 'CONSUMED', rating: null, isFavorite: false };
  it.each([
    [{ ...base, rating: 5 }, true],
    [{ ...base, rating: 4 }, true],
    [{ ...base, rating: 3 }, false],
    [{ ...base, isFavorite: true }, true],
    [{ ...base, rating: 5, quantity: 1, status: 'IN_CELLAR' }, false],
    [{ ...base, rating: 5, status: 'SOLD' }, false],
    [{ ...base, rating: 5, status: 'GIFTED' }, false],
  ])('%o → %s', (wine, expected) => expect(shouldSuggestReorder(wine)).toBe(expected));
});

describe('reorderLinks', () => {
  it('caută după producător, nume și an', () => {
    const [vivino, shopping] = reorderLinks({ producer: 'Davino', name: 'Flamboyant', vintage: 2017 });
    expect(vivino.url).toBe('https://www.vivino.com/search/wines?q=Davino%20Flamboyant%202017');
    expect(shopping.url).toContain('tbm=shop');
  });
});
