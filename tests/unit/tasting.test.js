import { describe, expect, it } from 'vitest';
import { TastingInputSchema } from '@/schemas/tasting';

describe('TastingInputSchema', () => {
  it('acceptă o degustare completă și golește câmpurile goale', () => {
    const parsed = TastingInputSchema.parse({
      wineId: 'w1', rating: '4', occasion: ' Ziua Anei ', people: ['Ana', 'Mihai'], food: '',
      notes: 'Fructe negre, taninuri fine', photoUrls: ['https://x.ro/a.webp'], aromas: ['mure'],
    });
    expect(parsed).toMatchObject({ wineId: 'w1', rating: 4, occasion: 'Ziua Anei', food: null, location: null, people: ['Ana', 'Mihai'] });
  });

  it('rating gol = null; rating în afara scalei e respins', () => {
    expect(TastingInputSchema.parse({ wineId: 'w1', rating: '' }).rating).toBeNull();
    expect(TastingInputSchema.safeParse({ wineId: 'w1', rating: 6 }).success).toBe(false);
    expect(TastingInputSchema.safeParse({ wineId: 'w1', rating: 2.5 }).success).toBe(false);
  });

  it('limitează pozele și data din viitor', () => {
    expect(TastingInputSchema.safeParse({ wineId: 'w1', photoUrls: Array(7).fill('https://x.ro/a.webp') }).success).toBe(false);
    expect(TastingInputSchema.safeParse({ wineId: 'w1', tastedAt: '2099-01-01' }).success).toBe(false);
    expect(TastingInputSchema.safeParse({ rating: 3 }).success).toBe(false);
  });
});
