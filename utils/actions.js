"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import { WineInputSchema, parseWineForm } from "../schemas/wine";
import { duplicateKey } from "./csvImport";
import { dedupeLocations, normalizeWineData } from "./normalize";
import { countsBy, monthlySeries, nearMaturityWines, overdueWines } from "./stats";
import { CellarNameSchema, PasswordChangeSchema, ProfileInputSchema, firstIssueMessage } from "../schemas/account";
import { AIAgentInputSchema } from "../schemas/ai";
import prisma from "./db";
import { auth } from "./auth";
import { decryptSecret, encryptSecret } from "./aiSecrets";
import { getProviderDefinition, isKnownProvider, listProviderDefinitions } from "./aiProviderRegistry";
import { validateProviderBaseUrl } from "./aiUrlSecurity";
import { listProviderModels } from "./aiProviders";
import { shareUrlFor } from "./share";
import { LIMITS, rateLimit, tooManyRequestsMessage } from "./rateLimit";
import { listUserObjects, objectKeyFromUrl, removeObjects } from "./storage";
import { createLogger, serializeError } from './logger';
import { forbidden, notFound, unauthenticated } from './errors';

const logger = createLogger('actions');

const STATS_WINE_SELECT = {
  id: true, name: true, producer: true, country: true, type: true, rating: true,
  purchasePrice: true, estimatedValue: true, quantity: true, purchaseDate: true, vintage: true,
  agingPotential: true, drinkFrom: true, drinkUntil: true, status: true,
  labelImageUrl: true, bottleImageUrl: true,
};

// ─────────────────────────────────────────
// HELPER - obține userul curent
// ─────────────────────────────────────────

// cache(): o singură citire a sesiunii pe request, chiar dacă pagina apelează mai multe acțiuni (DATA-006)
const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw unauthenticated();
  }

  return session.user;
});

// ─────────────────────────────────────────
// HELPER - istoric acțiuni (WineLog)
// ─────────────────────────────────────────

function serializeForLog(value) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

function diffWine(before, after) {
  const changes = {};
  for (const [key, next] of Object.entries(after)) {
    if (key === 'updatedAt' || !(key in before)) continue;
    const from = serializeForLog(before[key]);
    const to = serializeForLog(next);
    if (JSON.stringify(from) !== JSON.stringify(to)) changes[key] = { from, to };
  }
  return changes;
}

async function logWineAction({ wineId, userId, action, details }) {
  try {
    await prisma.wineLog.create({ data: { wineId, userId, action, details } });
  } catch (error) {
    // Istoricul nu trebuie să blocheze acțiunea principală
    logger.error('wine log write failed', { action, wineId, userId, error: serializeError(error) });
  }
}

// ─────────────────────────────────────────
// HELPER - imagini care nu mai sunt folosite
// ─────────────────────────────────────────

// Șterge din MinIO imaginile care nu mai sunt referite de niciun vin sau avatar
async function releaseImages(urls) {
  const keys = [];
  for (const url of new Set(urls.filter(Boolean))) {
    const key = objectKeyFromUrl(url);
    if (!key) continue;
    const [wineRefs, userRefs] = await Promise.all([
      prisma.wine.count({ where: { OR: [{ labelImageUrl: url }, { bottleImageUrl: url }] } }),
      prisma.user.count({ where: { image: url } }),
    ]);
    if (wineRefs + userRefs === 0) keys.push(key);
  }
  await removeObjects(keys);
}

// ─────────────────────────────────────────
// WINES - CRUD
// ─────────────────────────────────────────

export async function getWines(filters = {}) {
  const user = await getCurrentUser();

  const where = { userId: user.id };

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

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { producer: { contains: filters.search, mode: 'insensitive' } },
      { region: { contains: filters.search, mode: 'insensitive' } },
      { country: { contains: filters.search, mode: 'insensitive' } },
    ];
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

  const [wines, total] = await Promise.all([
    prisma.wine.findMany({ where, orderBy, skip, take: PAGE_SIZE }),
    prisma.wine.count({ where }),
  ]);

  return {
    wines,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

async function userLocations(userId) {
  const rows = await prisma.wine.findMany({
    where: { userId, cellarLocation: { not: null } },
    select: { cellarLocation: true },
    distinct: ['cellarLocation'],
  });
  return dedupeLocations(rows.map((row) => row.cellarLocation));
}

// Locațiile folosite deja, deduplicate (pentru autocomplete în formular)
export async function getCellarLocations() {
  const user = await getCurrentUser();
  return userLocations(user.id);
}

export async function getWineCountries() {
  const user = await getCurrentUser();
  const results = await prisma.wine.findMany({
    where: { userId: user.id, country: { not: null } },
    select: { country: true },
    distinct: ['country'],
    orderBy: { country: 'asc' },
  });
  return results.map(r => r.country).filter(Boolean);
}

export async function getWineById(id) {
  const user = await getCurrentUser();

  const wine = await prisma.wine.findUnique({ where: { id } });

  if (!wine) throw notFound("Vinul nu a fost găsit");
  if (wine.userId !== user.id) throw forbidden();

  return wine;
}

export async function createWine(formData) {
  const user = await getCurrentUser();

  const parsed = parseWineForm(formData);
  if (parsed.error) return { error: parsed.error };
  parsed.data = normalizeWineData(parsed.data, { existingLocations: await userLocations(user.id) });

  const wine = await prisma.wine.create({
    data: { ...parsed.data, userId: user.id },
  });

  await logWineAction({
    wineId: wine.id,
    userId: user.id,
    action: 'ADDED',
    details: { name: wine.name, quantity: wine.quantity, purchasePrice: wine.purchasePrice },
  });

  revalidatePath("/wines");
  redirect("/wines");
}

export async function updateWine(id, formData) {
  const user = await getCurrentUser();

  const existing = await prisma.wine.findUnique({ where: { id } });
  if (!existing) throw notFound("Vinul nu a fost găsit");
  if (existing.userId !== user.id) throw forbidden();

  const parsed = parseWineForm(formData);
  if (parsed.error) return { error: parsed.error };
  parsed.data = normalizeWineData(parsed.data, { existingLocations: await userLocations(user.id) });

  const updated = await prisma.wine.update({
    where: { id },
    data: parsed.data,
  });

  await releaseImages(
    [existing.labelImageUrl, existing.bottleImageUrl].filter(
      (url) => url && url !== updated.labelImageUrl && url !== updated.bottleImageUrl,
    ),
  );

  const changes = diffWine(existing, updated);
  if (Object.keys(changes).length) {
    await logWineAction({ wineId: id, userId: user.id, action: 'UPDATED', details: { changes } });
  }

  revalidatePath("/wines");
  revalidatePath(`/wines/${id}`);
  redirect(`/wines/${id}`);
}

export async function deleteWine(id) {
  const user = await getCurrentUser();

  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) throw notFound("Vinul nu a fost găsit");
  if (wine.userId !== user.id) throw forbidden();

  // Log-ul rămâne după ștergere (wineId devine null prin onDelete: SetNull)
  await logWineAction({
    wineId: id,
    userId: user.id,
    action: 'DELETE',
    details: { name: wine.name, producer: wine.producer, vintage: wine.vintage, quantity: wine.quantity },
  });
  await prisma.wine.delete({ where: { id } });
  await releaseImages([wine.labelImageUrl, wine.bottleImageUrl]);

  revalidatePath("/wines");
  redirect("/wines");
}

export async function toggleFavorite(id) {
  const user = await getCurrentUser();

  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine || wine.userId !== user.id) throw forbidden();

  await prisma.wine.update({
    where: { id },
    data: { isFavorite: !wine.isFavorite },
  });

  await logWineAction({
    wineId: id,
    userId: user.id,
    action: 'UPDATED',
    details: { changes: { isFavorite: { from: wine.isFavorite, to: !wine.isFavorite } } },
  });

  revalidatePath("/wines");
  revalidatePath(`/wines/${id}`);
}

export async function consumeWine(id, quantity = 1) {
  const user = await getCurrentUser();
  const amount = Number.parseInt(quantity, 10);
  if (!Number.isInteger(amount) || amount < 1) return { error: 'Cantitate invalidă' };

  const result = await prisma.$transaction(async (tx) => {
    const wine = await tx.wine.findFirst({ where: { id, userId: user.id } });
    if (!wine) return { error: 'Vinul nu a fost găsit' };

    // Decrement condiționat: evită cantități negative la click-uri simultane
    const { count } = await tx.wine.updateMany({
      where: { id, userId: user.id, quantity: { gte: amount } },
      data: { quantity: { decrement: amount } },
    });
    if (count === 0) return { error: `Mai ai doar ${wine.quantity} sticl${wine.quantity === 1 ? 'ă' : 'e'}` };

    const remaining = wine.quantity - amount;
    if (remaining === 0) {
      await tx.wine.update({
        where: { id },
        data: { status: 'CONSUMED', consumptionDate: new Date() },
      });
    }

    // Direct (nu prin logWineAction): o eroare înghițită ar lăsa tranzacția Postgres abortată
    await tx.wineLog.create({
      data: {
        wineId: id,
        userId: user.id,
        action: 'CONSUMED',
        details: { quantityConsumed: amount, remainingQuantity: remaining },
      },
    });

    return { success: true, remaining };
  });

  if (result.success) {
    revalidatePath("/wines");
    revalidatePath(`/wines/${id}`);
    revalidatePath("/dashboard");
  }
  return result;
}

// ─────────────────────────────────────────
// STATISTICI pentru Dashboard
// ─────────────────────────────────────────

export async function getDashboardStats() {
  const user = await getCurrentUser();
  const where = { userId: user.id };

  // Agregări în DB, fără să încărcăm vinurile în memorie (DATA-006).
  // Sticle și valoare = doar ce e fizic în pivniță; valoarea e per sticlă × cantitate.
  const [byTypeRows, byStatusRows, bottles, [value]] = await Promise.all([
    prisma.wine.groupBy({ by: ['type'], where, _count: { _all: true } }),
    prisma.wine.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.wine.aggregate({ where: { ...where, status: 'IN_CELLAR' }, _sum: { quantity: true } }),
    prisma.$queryRaw`
      SELECT COALESCE(SUM("estimatedValue" * "quantity"), 0)::float8 AS total
      FROM "Wine" WHERE "userId" = ${user.id} AND "status" = 'IN_CELLAR'`,
  ]);

  const byType = countsBy(byTypeRows, 'type');
  const byStatus = countsBy(byStatusRows, 'status');

  return {
    totalBottles: bottles._sum.quantity ?? 0,
    totalValue: Number(value?.total ?? 0),
    totalWines: Object.values(byType).reduce((sum, count) => sum + count, 0),
    byType,
    byStatus,
  };
}

// ─────────────────────────────────────────
// PROFIL
// ─────────────────────────────────────────

export async function getProfile() {
  const user = await getCurrentUser();
  return prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, name: true, email: true,
      image: true, role: true, createdAt: true,
      cellarName: true,
      _count: { select: { wines: true } },
    },
  });
}

export async function updateProfile(formData) {
  const user = await getCurrentUser();
  const parsed = ProfileInputSchema.safeParse({
    name: formData.get('name')?.toString() ?? '',
    image: formData.get('image')?.toString(),
  });
  if (!parsed.success) return { error: z.flattenError(parsed.error).fieldErrors };
  const { name, image } = parsed.data;

  const previous = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } });
  await prisma.user.update({
    where: { id: user.id },
    data: { name, image, updatedAt: new Date() },
  });
  if (previous?.image && previous.image !== image) await releaseImages([previous.image]);

  revalidatePath('/profile');
  revalidatePath('/settings');
}

export async function updatePassword(formData) {
  const user = await getCurrentUser();
  const parsed = PasswordChangeSchema.safeParse({
    currentPassword: formData.get('currentPassword')?.toString(),
    newPassword: formData.get('newPassword')?.toString(),
    confirmPassword: formData.get('confirmPassword')?.toString(),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { currentPassword, newPassword } = parsed.data;

  const limited = rateLimit(`password:${user.id}`, LIMITS.passwordChange);
  if (!limited.ok) return { error: tooManyRequestsMessage(limited.retryAfter) };

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    if (error?.body?.code === 'INVALID_PASSWORD') return { error: 'Parola curentă e incorectă' };
    logger.error('password change failed', { userId: user.id, code: error?.body?.code ?? null, error: serializeError(error) });
    return { error: 'Eroare la schimbarea parolei' };
  }

  return { success: true };
}

export async function deleteAccount() {
  const user = await getCurrentUser();

  // Imaginile se listează înainte, ca să nu rămână fișiere orfane după ștergerea contului
  const imageKeys = await listUserObjects(user.id).catch((error) => {
    logger.error('list images failed', { userId: user.id, error: serializeError(error) });
    return [];
  });

  await prisma.wine.deleteMany({ where: { userId: user.id } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await removeObjects(imageKeys);

  redirect('/sign-in');
}

// ─────────────────────────────────────────
// STATISTICI AVANSATE
// ─────────────────────────────────────────

export async function getAdvancedStats() {
  const user = await getCurrentUser();
  const where = { userId: user.id };
  const withPrice = { ...where, purchasePrice: { gt: 0 } };
  const now = new Date();
  const currentYear = now.getFullYear();
  const since = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [topWines, countryRows, monthlyRows, priceAgg, mostExpensive, cellarWines] = await Promise.all([
    prisma.wine.findMany({
      where: { ...where, rating: { not: null } },
      orderBy: [{ rating: 'desc' }, { createdAt: 'asc' }],
      take: 5,
      select: STATS_WINE_SELECT,
    }),
    prisma.wine.groupBy({ by: ['country'], where: { ...where, country: { not: null } }, _count: { _all: true } }),
    prisma.$queryRaw`
      SELECT date_trunc('month', "purchaseDate") AS month, COUNT(*)::int AS count
      FROM "Wine"
      WHERE "userId" = ${user.id} AND "purchaseDate" >= ${since}
      GROUP BY 1`,
    prisma.wine.aggregate({ where: withPrice, _avg: { purchasePrice: true }, _max: { purchasePrice: true }, _min: { purchasePrice: true } }),
    prisma.wine.findFirst({ where: withPrice, orderBy: { purchasePrice: 'desc' }, select: STATS_WINE_SELECT }),
    // Doar vinurile din pivniță, cu câmpurile necesare ferestrei de consum
    prisma.wine.findMany({ where: { ...where, status: 'IN_CELLAR' }, select: STATS_WINE_SELECT }),
  ]);

  return {
    topWines,
    byCountry: countsBy(countryRows, 'country'),
    monthlyData: monthlySeries(monthlyRows, now),
    priceStats: {
      avg: priceAgg._avg.purchasePrice ?? 0,
      max: priceAgg._max.purchasePrice ?? 0,
      min: priceAgg._min.purchasePrice ?? 0,
      mostExpensive,
    },
    nearMaturity: nearMaturityWines(cellarWines, currentYear),
    overdueWines: overdueWines(cellarWines, currentYear),
  };
}

export async function updateCellarName(name) {
  const user = await getCurrentUser();

  const parsed = CellarNameSchema.safeParse(name?.toString());
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const trimmed = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: { cellarName: trimmed, updatedAt: new Date() },
  });

  revalidatePath('/', 'layout');
  return { success: true };
}

// ─────────────────────────────────────────
// PARTAJARE COLECȚIE (opt-in)
// ─────────────────────────────────────────

const newShareId = () => randomBytes(16).toString("base64url");

export async function setCollectionSharing(enabled) {
  const user = await getCurrentUser();
  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { shareId: true } });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      shareEnabled: Boolean(enabled),
      // Prima activare generează linkul; la reactivare se păstrează cel vechi
      ...(enabled && !current?.shareId ? { shareId: newShareId() } : {}),
    },
    select: { shareId: true, shareEnabled: true },
  });

  revalidatePath("/settings");
  return { success: true, enabled: updated.shareEnabled, shareUrl: shareUrlFor(updated.shareId) };
}

export async function regenerateShareLink() {
  const user = await getCurrentUser();
  // Linkul vechi devine invalid imediat
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { shareId: newShareId() },
    select: { shareId: true, shareEnabled: true },
  });

  revalidatePath("/settings");
  return { success: true, enabled: updated.shareEnabled, shareUrl: shareUrlFor(updated.shareId) };
}

export async function getAIAgents() {
  const user = await getCurrentUser();
  return prisma.aIAgent.findMany({
    where: { userId: user.id },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true, name: true, provider: true, providerType: true, baseUrl: true, model: true,
      billingType: true, capabilities: true,
      priority: true, timeoutMs: true, maxRetries: true, weight: true,
      lastStatus: true, lastError: true, suggestedModel: true, lastCheckedAt: true,
    },
  });
}

export async function saveAIAgent(input) {
  const user = await getCurrentUser();
  const parsedInput = AIAgentInputSchema.safeParse(input ?? {});
  if (!parsedInput.success) return { error: firstIssueMessage(parsedInput.error) };
  input = parsedInput.data;
  const { name, provider, model } = input;
  if (!isKnownProvider(provider)) return { error: 'Provider AI invalid' };

  const definition = getProviderDefinition(provider);
  let baseUrl = input.baseUrl || definition.baseUrl || null;
  if (provider === 'openai-compatible' && !baseUrl) return { error: 'Base URL este obligatoriu pentru providerul custom' };
  if (baseUrl && (provider === 'openai-compatible' || input.providerType === 'custom')) {
    try {
      baseUrl = await validateProviderBaseUrl(baseUrl);
    } catch (error) {
      return { error: error.message };
    }
  }

  const values = {
    name,
    provider,
    providerType: input.providerType || definition.type,
    baseUrl,
    model,
    billingType: input.billingType || definition.billingType || 'UNKNOWN',
    capabilities: input.capabilities || definition.capabilities || {},
    metadata: input.metadata || null,
    enabled: input.enabled !== false,
    priority: input.priority,
    timeoutMs: input.timeoutMs,
    maxRetries: input.maxRetries,
    weight: input.weight,
  };
  const apiKey = input.apiKey;

  if (input.id) {
    const existing = await prisma.aIAgent.findFirst({ where: { id: input.id, userId: user.id } });
    if (!existing) return { error: 'Agentul nu a fost găsit' };
    if (apiKey) values.encryptedApiKey = encryptSecret(apiKey);
    await prisma.aIAgent.update({ where: { id: existing.id }, data: values });
  } else {
    if (!apiKey) return { error: 'Cheia API este obligatorie pentru un agent nou' };
    await prisma.aIAgent.create({
      data: { ...values, encryptedApiKey: encryptSecret(apiKey), userId: user.id },
    });
  }
  revalidatePath('/settings');
  return { success: true };
}

export async function getAIProviderCatalog() {
  return listProviderDefinitions();
}

export async function discoverAIModels(input) {
  const user = await getCurrentUser();
  const provider = input?.provider?.toString();
  let apiKey = input?.apiKey?.toString().trim();
  if (!apiKey && input?.id) {
    const existing = await prisma.aIAgent.findFirst({ where: { id: input.id, userId: user.id } });
    if (existing) apiKey = decryptSecret(existing.encryptedApiKey);
  }
  if (!provider || !apiKey) return { status: 'ERROR', error: 'Providerul și cheia API sunt obligatorii' };
  try {
    const models = await listProviderModels({
      provider,
      providerType: input.providerType,
      baseUrl: input.baseUrl,
      apiKey,
      timeoutMs: 20000,
      capabilities: input.capabilities,
    });
    return models.length
      ? { status: 'SUCCESS', models: models.slice(0, 500) }
      : { status: 'UNSUPPORTED', models: [], error: 'Nu am putut încărca automat modelele acestui provider.' };
  } catch (error) {
    return {
      status: error.providerStatus || (error.status === 401 || error.status === 403 ? 'AUTH_ERROR' : error.status === 429 ? 'RATE_LIMITED' : 'ERROR'),
      error: 'Nu am putut încărca lista de modele.',
    };
  }
}

export async function testAIModelConfiguration(input) {
  await getCurrentUser();
  const provider = input?.provider?.toString();
  const model = input?.model?.toString().trim();
  const apiKey = input?.apiKey?.toString().trim();
  if (!provider || !model || !apiKey) return { status: 'ERROR', error: 'Providerul, modelul și cheia API sunt obligatorii' };
  try {
    const models = await listProviderModels({ provider, providerType: input.providerType, baseUrl: input.baseUrl, apiKey, timeoutMs: 20000, capabilities: input.capabilities });
    const selected = models.find((item) => item.id === model);
    if (!selected && models.length) return { status: 'MODEL_UNAVAILABLE', error: 'Modelul nu apare în catalogul providerului.' };
    if (selected?.imageInput === false) return { status: 'IMAGE_UNSUPPORTED', error: 'Modelul nu poate analiza imagini.' };
    return { status: selected?.imageInput === true ? 'SUCCESS' : 'IMAGE_UNKNOWN', model: selected || { id: model, name: model } };
  } catch (error) {
    return { status: error.providerStatus || 'ERROR', error: 'Nu am putut verifica modelul. Poți salva și testa ulterior.' };
  }
}

export async function testAIAgent(id) {
  const user = await getCurrentUser();
  const agent = await prisma.aIAgent.findFirst({ where: { id, userId: user.id } });
  if (!agent) return { error: 'Agentul nu a fost găsit' };

  try {
    const models = await listProviderModels({
      ...agent,
      apiKey: decryptSecret(agent.encryptedApiKey),
    });
    const selected = models.find((model) => model.id === agent.model);
    const status = selected && (agent.capabilities?.imageInput === false || selected.imageInput === false)
      ? 'Needs attention'
      : selected
        ? 'Healthy'
        : models.length
          ? 'Model unavailable'
          : 'Model availability unknown';
    await prisma.aIAgent.update({
      where: { id: agent.id },
      data: { lastStatus: status, lastError: status === 'Healthy' ? null : 'Nu s-a putut confirma disponibilitatea sau suportul de imagini', lastCheckedAt: new Date(), suggestedModel: models.find((model) => model.imageInput)?.id || null },
    });
    return { success: true, status, models: models.slice(0, 200) };
  } catch (error) {
    const message = error.message || 'Provider unavailable';
    const status = error.status === 401 || error.status === 403 ? 'Invalid credentials' : error.status === 404 ? 'Model unavailable' : error.status === 429 ? 'Rate limited' : 'Provider unavailable';
    await prisma.aIAgent.update({ where: { id: agent.id }, data: { lastStatus: status, lastError: message.slice(0, 500), lastCheckedAt: new Date() } });
    return { error: message, status };
  }
}

export async function deleteAIAgent(id) {
  const user = await getCurrentUser();
  await prisma.aIAgent.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/settings');
  return { success: true };
}

// ─────────────────────────────────────────
// CONSUM AI (AI-013)
// ─────────────────────────────────────────

// Rezumat pe ultimele 6 luni: per lună și per agent pentru utilizator; adminul vede și totalul platformei
export async function getAIUsageSummary() {
  const user = await getCurrentUser();
  const since = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);

  const [byMonth, byAgent, agents, platform] = await Promise.all([
    prisma.$queryRaw`
      SELECT date_trunc('month', "createdAt") AS month,
             COUNT(*)::int AS calls,
             COALESCE(SUM("inputTokens"), 0)::int AS "inputTokens",
             COALESCE(SUM("outputTokens"), 0)::int AS "outputTokens",
             SUM("costUsd")::float8 AS "costUsd",
             COUNT(*) FILTER (WHERE NOT "success")::int AS failures
      FROM "ai_usage" WHERE "userId" = ${user.id} AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1 DESC`,
    prisma.aIUsage.groupBy({
      by: ['agentId', 'provider'],
      where: { userId: user.id, createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, costUsd: true },
      _avg: { latencyMs: true },
    }),
    prisma.aIAgent.findMany({ where: { userId: user.id }, select: { id: true, name: true } }),
    user.role === 'ADMIN'
      ? prisma.$queryRaw`
          SELECT date_trunc('month', "createdAt") AS month, COUNT(DISTINCT "userId")::int AS users,
                 COUNT(*)::int AS calls, SUM("costUsd")::float8 AS "costUsd"
          FROM "ai_usage" WHERE "createdAt" >= ${since} GROUP BY 1 ORDER BY 1 DESC`
      : Promise.resolve(null),
  ]);

  const agentNames = new Map(agents.map((agent) => [agent.id, agent.name]));
  return {
    byMonth: byMonth.map((row) => ({ ...row, month: new Date(row.month).toISOString().slice(0, 7) })),
    byAgent: byAgent.map((row) => ({
      agentId: row.agentId,
      name: agentNames.get(row.agentId) ?? `${row.provider} (șters)`,
      provider: row.provider,
      calls: row._count._all,
      inputTokens: row._sum.inputTokens ?? 0,
      outputTokens: row._sum.outputTokens ?? 0,
      costUsd: row._sum.costUsd,
      avgLatencyMs: row._avg.latencyMs == null ? null : Math.round(row._avg.latencyMs),
    })).sort((a, b) => b.calls - a.calls),
    platform: platform?.map((row) => ({ ...row, month: new Date(row.month).toISOString().slice(0, 7) })) ?? null,
  };
}

// ─────────────────────────────────────────
// IMPORT CSV (INT-001 / INT-002)
// ─────────────────────────────────────────

const IMPORT_MAX_ROWS = 1000;

// Cheile de duplicat ale colecției, pentru preview-ul din client
export async function getImportDuplicateKeys() {
  const user = await getCurrentUser();
  const wines = await prisma.wine.findMany({ where: { userId: user.id }, select: { name: true, producer: true, vintage: true } });
  return wines.map(duplicateKey);
}

// Primește vinurile mapate în client; le revalidează, normalizează și sare peste duplicate
export async function importWines(rows, { source = 'csv' } = {}) {
  const user = await getCurrentUser();
  if (!Array.isArray(rows) || !rows.length) return { error: 'Nimic de importat' };
  if (rows.length > IMPORT_MAX_ROWS) return { error: `Maximum ${IMPORT_MAX_ROWS} de vinuri pe import` };

  const [existing, existingLocations] = await Promise.all([getImportDuplicateKeys(), userLocations(user.id)]);
  const seen = new Set(existing);
  const valid = [];
  const skipped = [];
  rows.forEach((row, index) => {
    const parsed = WineInputSchema.safeParse(row);
    if (!parsed.success) return skipped.push({ index, reason: firstIssueMessage(parsed.error) });
    const key = duplicateKey(parsed.data);
    if (seen.has(key)) return skipped.push({ index, reason: 'duplicat' });
    seen.add(key);
    valid.push(normalizeWineData({ ...parsed.data, drinkFrom: parsed.data.drinkFrom ?? null, drinkUntil: parsed.data.drinkUntil ?? null }, { existingLocations }));
  });

  if (valid.length) {
    await prisma.$transaction(async (tx) => {
      const created = await tx.wine.createManyAndReturn({
        data: valid.map((wine) => ({ ...wine, userId: user.id })),
        select: { id: true, name: true, quantity: true },
      });
      await tx.wineLog.createMany({
        data: created.map((wine) => ({
          wineId: wine.id,
          userId: user.id,
          action: 'ADDED',
          details: { name: wine.name, quantity: wine.quantity, source: `import:${source}` },
        })),
      });
    });
    revalidatePath('/wines');
    revalidatePath('/dashboard');
  }

  return { success: true, imported: valid.length, skipped };
}
