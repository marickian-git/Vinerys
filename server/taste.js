// AI-011: profilul de gust al unui utilizator, din datele lui (folosit pe Profil, pe pagina vinului și de Sommelier).
import prisma from '../utils/db';
import { buildTasteProfile, predictPreference, similarWines } from '../utils/tasteProfile';

const SELECT = {
  id: true, name: true, producer: true, vintage: true, type: true, grapeVarieties: true, country: true, region: true,
  aromaProfile: true, rating: true, isFavorite: true, status: true, quantity: true,
};

// Vinurile cu tot ce știm despre cât ți-au plăcut (ratinguri din degustări, arome notate, sticle consumate)
export async function winesWithSignals(userId) {
  const [wines, tastings, consumed] = await Promise.all([
    prisma.wine.findMany({ where: { userId }, select: SELECT }),
    prisma.tasting.findMany({ where: { userId, wineId: { not: null } }, select: { wineId: true, rating: true, aromas: true } }),
    prisma.$queryRaw`
      SELECT "wineId", SUM(COALESCE(("details"->>'quantityConsumed')::int, 1))::int AS bottles
      FROM "wine_log" WHERE "userId" = ${userId} AND action = 'CONSUMED' AND "wineId" IS NOT NULL GROUP BY "wineId"`,
  ]);
  const bottles = new Map(consumed.map((row) => [row.wineId, row.bottles]));
  return wines.map((wine) => {
    const own = tastings.filter((t) => t.wineId === wine.id);
    return {
      ...wine,
      tastingRatings: own.map((t) => t.rating).filter((r) => r != null),
      tastingAromas: own.flatMap((t) => t.aromas),
      bottlesConsumed: bottles.get(wine.id) ?? 0,
    };
  });
}

export async function tasteProfileFor(userId, { recommendations = 3 } = {}) {
  const wines = await winesWithSignals(userId);
  const profile = buildTasteProfile(wines);
  const inCellar = wines.filter((w) => w.status === 'IN_CELLAR' && w.quantity > 0);
  const picks = profile.evidence
    ? inCellar
        .map((wine) => ({ wine, ...predictPreference(wine, profile) }))
        .filter((item) => item.score > 0.55)
        .sort((a, b) => b.score - a.score)
        .slice(0, recommendations)
    : [];
  return { profile, picks };
}

export async function similarInCellar(userId, wineId, limit = 3) {
  const wines = await prisma.wine.findMany({ where: { userId, OR: [{ id: wineId }, { status: 'IN_CELLAR', quantity: { gt: 0 } }] }, select: SELECT });
  const target = wines.find((w) => w.id === wineId);
  return target ? similarWines(target, wines.filter((w) => w.id !== wineId), limit) : [];
}
