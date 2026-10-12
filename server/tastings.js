// DATA-003: serviciul de degustări (folosit de server actions și de /api/v1).
import { z } from 'zod';
import prisma from '../utils/db';
import { TastingInputSchema } from '../schemas/tasting';
import { cleanText, normalizeAromas, normalizeList } from '../utils/normalize';

// Ratingul vinului = media degustărilor cu rating (compatibilitate cu listele și statisticile existente)
export async function syncWineRating(tx, wineId) {
  if (!wineId) return;
  const { _avg } = await tx.tasting.aggregate({ where: { wineId, rating: { not: null } }, _avg: { rating: true } });
  if (_avg.rating != null) await tx.wine.update({ where: { id: wineId }, data: { rating: Math.round(_avg.rating) } });
}

export function tastingData(input) {
  const parsed = TastingInputSchema.safeParse(input ?? {});
  if (!parsed.success) return { error: z.flattenError(parsed.error).fieldErrors };
  const data = parsed.data;
  return {
    data: {
      ...data,
      tastedAt: data.tastedAt ?? new Date(),
      people: normalizeList(data.people),
      aromas: normalizeAromas(data.aromas),
      occasion: cleanText(data.occasion),
      location: cleanText(data.location),
      food: cleanText(data.food),
    },
  };
}

export async function listTastings(userId, { wineId, limit = 100 } = {}) {
  return prisma.tasting.findMany({
    where: { userId, ...(wineId && { wineId }) },
    orderBy: { tastedAt: 'desc' },
    take: Math.min(Number(limit) || 100, 500),
    include: { wine: { select: { id: true, name: true, producer: true, vintage: true, type: true, labelImageUrl: true } } },
  });
}

// { tasting } sau { error }
export async function createTastingForUser(userId, input) {
  const parsed = tastingData(input);
  if (parsed.error) return { error: parsed.error };
  const wine = await prisma.wine.findFirst({ where: { id: parsed.data.wineId, userId }, select: { id: true, name: true } });
  if (!wine) return { error: 'Vinul nu a fost găsit' };

  const tasting = await prisma.$transaction(async (tx) => {
    const created = await tx.tasting.create({ data: { ...parsed.data, userId, wineName: wine.name } });
    await syncWineRating(tx, wine.id);
    await tx.wineLog.create({ data: { wineId: wine.id, userId, action: 'TASTED', details: { tastingId: created.id, rating: created.rating } } });
    return created;
  });

  return { success: true, tasting };
}
