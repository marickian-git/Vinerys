// ARCH-006: serviciul de vinuri. Logică de domeniu fără Next (fără headers/redirect/revalidate),
// folosită de server actions (UI) și de API-ul /api/v1 (aplicația mobilă). Primește userId explicit.
import prisma from '../utils/db';
import { createLogger, serializeError } from '../utils/logger';
import { forbidden, notFound } from '../utils/errors';
import { dedupeLocations, normalizeWineData } from '../utils/normalize';
import { likePattern, parseSearchQuery } from '../utils/searchQuery';
import { countsBy } from '../utils/stats';
import { releaseImages } from './media';
import { getRates } from './fx';
import { DEFAULT_CURRENCY, sumInCurrency } from '../utils/currency';

const logger = createLogger('wines');

// ── Istoric (WineLog) ──

function serializeForLog(value) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

export function diffWine(before, after) {
  const changes = {};
  for (const [key, next] of Object.entries(after)) {
    if (key === 'updatedAt' || !(key in before)) continue;
    const from = serializeForLog(before[key]);
    const to = serializeForLog(next);
    if (JSON.stringify(from) !== JSON.stringify(to)) changes[key] = { from, to };
  }
  return changes;
}

export async function logWineAction({ wineId, userId, action, details }) {
  try {
    await prisma.wineLog.create({ data: { wineId, userId, action, details } });
  } catch (error) {
    // Istoricul nu trebuie să blocheze acțiunea principală
    logger.error('wine log write failed', { action, wineId, userId, error: serializeError(error) });
  }
}

// ── Listă și căutare (CELLAR-009) ──

export async function userLocations(userId) {
  const rows = await prisma.wine.findMany({
    where: { userId, cellarLocation: { not: null } },
    select: { cellarLocation: true },
    distinct: ['cellarLocation'],
  });
  return dedupeLocations(rows.map((row) => row.cellarLocation));
}

// Map id → scor: trigrame pe nume/producător (tolerant la greșeli și diacritice lipsă)
// plus potrivire exactă în regiune, țară, soiuri, arome, asocieri și note
async function fuzzyWineMatches(userId, text) {
  const like = likePattern(text);
  try {
    return await trigramWineMatches(userId, text, like);
  } catch (error) {
    // Fără pg_trgm (extensia nu a putut fi creată): potrivire simplă, fără toleranță la greșeli
    logger.warn('trigram search unavailable, falling back to ILIKE', { error: serializeError(error) });
    const rows = await prisma.$queryRaw`
      SELECT id FROM "Wine"
      WHERE "userId" = ${userId} AND translate(lower(concat_ws(' ', name, producer, region, subregion, country,
        array_to_string("grapeVarieties", ' '), array_to_string("aromaProfile", ' '), array_to_string("foodPairing", ' '), "tastingNotes")),
        'ăâîșşțţ', 'aaisstt') LIKE ${like}`;
    return new Map(rows.map((row) => [row.id, 1]));
  }
}

async function trigramWineMatches(userId, text, like) {
  // translate() scoate diacriticele românești fără extensia unaccent; textul căutat e deja fără diacritice (foldKey)
  const rows = await prisma.$queryRaw`
    WITH w AS (
      SELECT id,
        translate(lower(name), 'ăâîșşțţ', 'aaisstt') AS n,
        translate(lower(coalesce(producer, '')), 'ăâîșşțţ', 'aaisstt') AS p,
        translate(lower(concat_ws(' ', region, subregion, country, array_to_string("grapeVarieties", ' '),
          array_to_string("aromaProfile", ' '), array_to_string("foodPairing", ' '), "tastingNotes")), 'ăâîșşțţ', 'aaisstt') AS other
      FROM "Wine" WHERE "userId" = ${userId}
    )
    SELECT id, GREATEST(word_similarity(${text}, n), word_similarity(${text}, p),
      CASE WHEN other LIKE ${like} THEN 0.5 ELSE 0 END)::float8 AS score
    FROM w
    WHERE ${text} <% n OR ${text} <% p OR n LIKE ${like} OR p LIKE ${like} OR other LIKE ${like}`;
  return new Map(rows.map((row) => [row.id, row.score]));
}

export async function listWines(userId, filters = {}) {
  const where = { userId };

  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.country) where.country = { equals: filters.country, mode: 'insensitive' };

  if (filters.isFavorite === 'true') where.isFavorite = true;
  if (filters.vintage) where.vintage = parseInt(filters.vintage);
  if (filters.vintageMin || filters.vintageMax) {
    where.vintage = {};
    if (filters.vintageMin) where.vintage.gte = parseInt(filters.vintageMin);
    if (filters.vintageMax) where.vintage.lte = parseInt(filters.vintageMax);
  }
  if (filters.ratingMin) where.rating = { gte: parseInt(filters.ratingMin) };
  if (filters.priceMax) where.purchasePrice = { lte: parseFloat(filters.priceMax) };

  // CELLAR-009: limbaj natural („roșii gata de băut sub 150 lei”) + text fuzzy (pg_trgm)
  let relevance = null;
  if (filters.search?.trim()) {
    const query = parseSearchQuery(filters.search);
    const year = new Date().getFullYear();
    if (query.type && !filters.type) where.type = query.type;
    if (query.vintage && !filters.vintage) where.vintage = query.vintage;
    if (query.isFavorite) where.isFavorite = true;
    if (query.priceMax != null || query.priceMin != null) {
      where.purchasePrice = { ...(where.purchasePrice ?? {}), ...(query.priceMax != null && { lte: query.priceMax }), ...(query.priceMin != null && { gte: query.priceMin }) };
    }
    const windowFilters = [];
    if (query.readyNow) windowFilters.push({ drinkFrom: { lte: year }, drinkUntil: { gte: year } });
    if (query.overdue) windowFilters.push({ drinkUntil: { lt: year } });
    if (query.readyNow || query.overdue) where.status = where.status ?? 'IN_CELLAR';
    if (windowFilters.length) where.AND = [...(where.AND ?? []), ...windowFilters];
    if (query.text) {
      relevance = await fuzzyWineMatches(userId, query.text);
      where.id = { in: [...relevance.keys()] };
    }
  }

  const SORT_MAP = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    name_asc: { name: 'asc' },
    name_desc: { name: 'desc' },
    vintage_desc: { vintage: 'desc' },
    vintage_asc: { vintage: 'asc' },
    price_desc: { purchasePrice: 'desc' },
    price_asc: { purchasePrice: 'asc' },
    rating_desc: { rating: 'desc' },
    rating_asc: { rating: 'asc' },
  };
  const orderBy = SORT_MAP[filters.sort] ?? { createdAt: 'desc' };

  const PAGE_SIZE = parseInt(filters.pageSize) || 24;
  const page = Math.max(1, parseInt(filters.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  let wines, total;
  if (relevance && (!filters.sort || filters.sort === 'newest')) {
    // Fără sortare explicită, rezultatele căutării vin în ordinea relevanței
    const all = await prisma.wine.findMany({ where });
    all.sort((x, y) => (relevance.get(y.id) ?? 0) - (relevance.get(x.id) ?? 0));
    [wines, total] = [all.slice(skip, skip + PAGE_SIZE), all.length];
  } else {
    [wines, total] = await Promise.all([
      prisma.wine.findMany({ where, orderBy, skip, take: PAGE_SIZE }),
      prisma.wine.count({ where }),
    ]);
  }

  return {
    wines,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

// ── Istoric valoare (CELLAR-008) ──

export async function recordValuation(wine, source = 'manual') {
  if (wine.estimatedValue == null) return;
  try {
    await prisma.wineValuation.create({
      data: { wineId: wine.id, userId: wine.userId, value: wine.estimatedValue, currency: wine.currency ?? 'EUR', source },
    });
  } catch (error) {
    logger.error('valuation write failed', { wineId: wine.id, error: serializeError(error) });
  }
}

// ── Citire ──

export async function getWineForUser(userId, id) {
  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) throw notFound('Vinul nu a fost găsit');
  if (wine.userId !== userId) throw forbidden();
  return wine;
}

// ── Scriere (data = intrare validată cu WineInputSchema) ──

export async function createWineForUser(userId, data) {
  const normalized = normalizeWineData(data, { existingLocations: await userLocations(userId) });
  const wine = await prisma.wine.create({ data: { ...normalized, userId } });
  await recordValuation(wine, 'initial');
  await logWineAction({
    wineId: wine.id,
    userId,
    action: 'ADDED',
    details: { name: wine.name, quantity: wine.quantity, purchasePrice: wine.purchasePrice },
  });
  return wine;
}

export async function updateWineForUser(userId, id, data) {
  const existing = await getWineForUser(userId, id);
  const normalized = normalizeWineData(data, { existingLocations: await userLocations(userId) });
  const updated = await prisma.wine.update({ where: { id }, data: normalized });

  await releaseImages(
    [existing.labelImageUrl, existing.bottleImageUrl].filter(
      (url) => url && url !== updated.labelImageUrl && url !== updated.bottleImageUrl,
    ),
  );
  if (updated.estimatedValue !== existing.estimatedValue || updated.currency !== existing.currency) await recordValuation(updated, 'manual');
  const changes = diffWine(existing, updated);
  if (Object.keys(changes).length) {
    await logWineAction({ wineId: id, userId, action: 'UPDATED', details: { changes } });
  }
  return updated;
}

export async function deleteWineForUser(userId, id) {
  const wine = await getWineForUser(userId, id);
  // Log-ul rămâne după ștergere (wineId devine null prin onDelete: SetNull)
  await logWineAction({
    wineId: id,
    userId,
    action: 'DELETE',
    details: { name: wine.name, producer: wine.producer, vintage: wine.vintage, quantity: wine.quantity },
  });
  await prisma.wine.delete({ where: { id } });
  await releaseImages([wine.labelImageUrl, wine.bottleImageUrl]);
  return wine;
}

export async function toggleFavoriteForUser(userId, id) {
  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine || wine.userId !== userId) throw forbidden();
  const updated = await prisma.wine.update({ where: { id }, data: { isFavorite: !wine.isFavorite } });
  await logWineAction({
    wineId: id,
    userId,
    action: 'UPDATED',
    details: { changes: { isFavorite: { from: wine.isFavorite, to: !wine.isFavorite } } },
  });
  return updated;
}

// { success, remaining } sau { error }
export async function consumeWineForUser(userId, id, quantity = 1) {
  const amount = Number.parseInt(quantity, 10);
  if (!Number.isInteger(amount) || amount < 1) return { error: 'Cantitate invalidă' };

  return prisma.$transaction(async (tx) => {
    const wine = await tx.wine.findFirst({ where: { id, userId } });
    if (!wine) return { error: 'Vinul nu a fost găsit' };

    // Decrement condiționat: evită cantități negative la click-uri simultane
    const { count } = await tx.wine.updateMany({
      where: { id, userId, quantity: { gte: amount } },
      data: { quantity: { decrement: amount } },
    });
    if (count === 0) return { error: `Mai ai doar ${wine.quantity} sticl${wine.quantity === 1 ? 'ă' : 'e'}` };

    const remaining = wine.quantity - amount;
    if (remaining === 0) {
      await tx.wine.update({ where: { id }, data: { status: 'CONSUMED', consumptionDate: new Date() } });
    }

    // Direct (nu prin logWineAction): o eroare înghițită ar lăsa tranzacția Postgres abortată
    await tx.wineLog.create({
      data: { wineId: id, userId, action: 'CONSUMED', details: { quantityConsumed: amount, remainingQuantity: remaining } },
    });
    return { success: true, remaining };
  });
}

// ── Statistici (DATA-006, DATA-007) ──

// Valoarea pivniței în moneda preferată a utilizatorului (prețurile rămân în moneda lor originală)
export async function dashboardStats(userId, { rates } = {}) {
  const where = { userId };
  const [byTypeRows, byStatusRows, bottles, valueRows, user] = await Promise.all([
    prisma.wine.groupBy({ by: ['type'], where, _count: { _all: true } }),
    prisma.wine.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.wine.aggregate({ where: { ...where, status: 'IN_CELLAR' }, _sum: { quantity: true } }),
    prisma.$queryRaw`
      SELECT currency, COALESCE(SUM("estimatedValue" * "quantity"), 0)::float8 AS amount
      FROM "Wine" WHERE "userId" = ${userId} AND "status" = 'IN_CELLAR' GROUP BY currency`,
    prisma.user.findUnique({ where: { id: userId }, select: { currency: true } }),
  ]);
  const currency = user?.currency ?? DEFAULT_CURRENCY;
  const needsRates = valueRows.some((row) => row.currency !== currency && row.amount > 0);
  const { total, unconverted } = sumInCurrency(valueRows, currency, needsRates ? rates ?? await getRates() : null);
  const byType = countsBy(byTypeRows, 'type');
  const byStatus = countsBy(byStatusRows, 'status');
  return {
    totalBottles: bottles._sum.quantity ?? 0,
    totalValue: total,
    currency,
    unconvertedValue: Object.keys(unconverted).length ? unconverted : null,
    totalWines: Object.values(byType).reduce((sum, count) => sum + count, 0),
    byType,
    byStatus,
  };
}
