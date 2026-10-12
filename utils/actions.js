"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import { WineInputSchema, parseWineForm } from "../schemas/wine";
import { duplicateKey } from "./csvImport";
import { buildWrapped } from "./wrapped";
import { pendingFollowUps } from "./followUp";
import { evaluateBadges, nextChallenge } from "./badges";
import { buildPlan } from "./planner";
import { cleanText, normalizeAromas, normalizeList, normalizeWineData } from "./normalize";
import { countsBy, monthlySeries, nearMaturityWines, overdueWines } from "./stats";
import { CellarNameSchema, PasswordChangeSchema, ProfileInputSchema, firstIssueMessage } from "../schemas/account";
import { AIAgentInputSchema } from "../schemas/ai";
import { TastingInputSchema } from "../schemas/tasting";
import prisma from "./db";
import { releaseImages } from "../server/media";
import {
  consumeWineForUser, createWineForUser, dashboardStats, deleteWineForUser, getWineForUser,
  listWines, toggleFavoriteForUser, updateWineForUser, userLocations,
} from "../server/wines";
import { auth } from "./auth";
import { decryptSecret, encryptSecret } from "./aiSecrets";
import { getProviderDefinition, isKnownProvider, listProviderDefinitions } from "./aiProviderRegistry";
import { validateProviderBaseUrl } from "./aiUrlSecurity";
import { generateWithAgents, listProviderModels } from "./aiProviders";
import { normalizePairing, pairingKey, pairingPrompt } from "./pairing";
import { platformRequestsThisMonth, recordAIUsage } from "./aiUsage";
import { chooseAgents, monthStart, platformAgents, quotaFor, quotaMessage } from "./platformAI";
import { shareUrlFor } from "./share";
import { LIMITS, rateLimit, tooManyRequestsMessage } from "./rateLimit";
import { listUserObjects, removeObjects } from "./storage";
import { createLogger, serializeError } from './logger';
import { unauthenticated } from './errors';

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
// WINES - CRUD
// ─────────────────────────────────────────

export async function getWines(filters = {}) {
  const user = await getCurrentUser();
  return listWines(user.id, filters);
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
  return getWineForUser(user.id, id);
}

export async function createWine(formData) {
  const user = await getCurrentUser();
  const parsed = parseWineForm(formData);
  if (parsed.error) return { error: parsed.error };
  await createWineForUser(user.id, parsed.data);
  revalidatePath("/wines");
  redirect("/wines");
}

export async function updateWine(id, formData) {
  const user = await getCurrentUser();
  await getWineForUser(user.id, id);
  const parsed = parseWineForm(formData);
  if (parsed.error) return { error: parsed.error };
  await updateWineForUser(user.id, id, parsed.data);
  revalidatePath("/wines");
  revalidatePath(`/wines/${id}`);
  redirect(`/wines/${id}`);
}

export async function deleteWine(id) {
  const user = await getCurrentUser();
  await deleteWineForUser(user.id, id);
  revalidatePath("/wines");
  redirect("/wines");
}

export async function toggleFavorite(id) {
  const user = await getCurrentUser();
  await toggleFavoriteForUser(user.id, id);
  revalidatePath("/wines");
  revalidatePath(`/wines/${id}`);
}

export async function consumeWine(id, quantity = 1) {
  const user = await getCurrentUser();
  const result = await consumeWineForUser(user.id, id, quantity);
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
  return dashboardStats(user.id);
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
  // AI-012: cota lunară pe cheile platformei (doar dacă platforma are chei configurate)
  const role = (await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } }))?.role;
  const quotas = platformAgents().length
    ? await Promise.all(['scan', 'text'].map(async (kind) => ({
        kind,
        used: await platformRequestsThisMonth(user.id, kind, monthStart()),
        limit: quotaFor({ role }, kind),
      })))
    : null;
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
    quotas: quotas?.map((q) => ({ ...q, limit: Number.isFinite(q.limit) ? q.limit : null })) ?? null,
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

// ─────────────────────────────────────────
// „CE GĂTESC CU EL?” (HOME-003)
// ─────────────────────────────────────────

const PAIRING_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 };

// Răspunsul din cache dacă identitatea vinului nu s-a schimbat; altfel (sau la refresh) îl generează cu agenții AI
export async function getWinePairing(wineId, { refresh = false } = {}) {
  const user = await getCurrentUser();
  const wine = await prisma.wine.findFirst({ where: { id: wineId, userId: user.id } });
  if (!wine) return { error: 'Vinul nu a fost găsit' };

  const key = pairingKey(wine);
  if (!refresh && wine.pairing && wine.pairingKey === key) return { pairing: wine.pairing, cached: true };

  const limited = rateLimit(`pairing:${user.id}`, PAIRING_LIMIT);
  if (!limited.ok) return { error: tooManyRequestsMessage(limited.retryAfter) };

  const agents = (await prisma.aIAgent.findMany({ where: { userId: user.id, enabled: true } })).flatMap((agent) => {
    try {
      return [{ ...agent, apiKey: decryptSecret(agent.encryptedApiKey) }];
    } catch {
      return [];
    }
  });
  const platform = platformAgents();
  const quota = quotaFor(await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } }), 'text');
  const used = agents.length || !platform.length ? 0 : await platformRequestsThisMonth(user.id, 'text', monthStart());
  const choice = chooseAgents({ ownAgents: agents, platform, used, quota });
  if (choice.error) return { error: quotaMessage(choice.error, quota) };

  const requestId = randomBytes(8).toString('hex');
  const log = logger.child({ requestId, userId: user.id, wineId });
  try {
    const { result, usage, provider } = await generateWithAgents(choice.agents, pairingPrompt(wine), normalizePairing, { operation: 'pairing' });
    await recordAIUsage(user.id, requestId, usage, log);
    const pairing = { ...result, provider, generatedAt: new Date().toISOString() };
    await prisma.wine.update({ where: { id: wine.id }, data: { pairing, pairingKey: key } });
    log.info('pairing generated', { provider });
    return { pairing, cached: false };
  } catch (error) {
    await recordAIUsage(user.id, requestId, error.usage, log);
    log.warn('pairing failed', { error: serializeError(error) });
    return { error: 'Sommelierul AI nu a răspuns. Încearcă din nou.' };
  }
}

// ─────────────────────────────────────────
// FILTRE SALVATE (CELLAR-009)
// ─────────────────────────────────────────

const FILTER_KEYS = ['search', 'type', 'status', 'country', 'sort', 'vintageMin', 'vintageMax', 'ratingMin', 'priceMax', 'isFavorite'];

export async function getSavedFilters() {
  const user = await getCurrentUser();
  return prisma.savedFilter.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, params: true } });
}

export async function saveFilter(name, params) {
  const user = await getCurrentUser();
  const label = name?.toString().trim().slice(0, 40);
  if (!label) return { error: 'Dă-i un nume filtrului' };
  const clean = Object.fromEntries(FILTER_KEYS.filter((key) => params?.[key]).map((key) => [key, String(params[key]).slice(0, 200)]));
  if (!Object.keys(clean).length) return { error: 'Nu există niciun filtru activ' };
  if ((await prisma.savedFilter.count({ where: { userId: user.id } })) >= 20) return { error: 'Maximum 20 de filtre salvate' };
  const saved = await prisma.savedFilter.upsert({
    where: { userId_name: { userId: user.id, name: label } },
    create: { userId: user.id, name: label, params: clean },
    update: { params: clean },
    select: { id: true, name: true, params: true },
  });
  revalidatePath('/wines');
  return { success: true, filter: saved };
}

export async function deleteSavedFilter(id) {
  const user = await getCurrentUser();
  await prisma.savedFilter.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/wines');
  return { success: true };
}

// ─────────────────────────────────────────
// VINERYS WRAPPED (SOCIAL-001)
// ─────────────────────────────────────────

const WRAPPED_WINE_SELECT = {
  id: true, name: true, producer: true, country: true, type: true, grapeVarieties: true,
  rating: true, isFavorite: true, purchasePrice: true, estimatedValue: true,
};

export async function getWrapped(year = new Date().getFullYear()) {
  const user = await getCurrentUser();
  const target = Number.parseInt(year, 10) || new Date().getFullYear();
  const from = new Date(target, 0, 1);
  const to = new Date(target + 1, 0, 1);

  const [logs, consumedWithoutLog, cellar] = await Promise.all([
    prisma.wineLog.findMany({
      where: { userId: user.id, action: 'CONSUMED', createdAt: { gte: from, lt: to } },
      select: { createdAt: true, details: true, wine: { select: WRAPPED_WINE_SELECT } },
    }),
    // Istoricul vechi (dinainte de wine_log): vinurile consumate au doar consumptionDate
    prisma.wine.findMany({
      where: { userId: user.id, status: 'CONSUMED', consumptionDate: { gte: from, lt: to }, wineLogs: { none: { action: 'CONSUMED' } } },
      select: { ...WRAPPED_WINE_SELECT, consumptionDate: true },
    }),
    prisma.wine.findMany({ where: { userId: user.id, status: 'IN_CELLAR' }, select: { quantity: true, estimatedValue: true } }),
  ]);

  const consumptions = [
    ...logs.map((log) => ({ at: log.createdAt, quantity: Number(log.details?.quantityConsumed) || 1, wine: log.wine })),
    ...consumedWithoutLog.map(({ consumptionDate, ...wine }) => ({ at: consumptionDate, quantity: 1, wine })),
  ];
  return buildWrapped({ year: target, consumptions, cellar });
}

// ─────────────────────────────────────────
// „CUMPĂRĂ DIN NOU” (INT-003)
// ─────────────────────────────────────────

// Readuce în pivniță un vin terminat (aceeași fișă, sticle noi), cu istoric ADDED { restock: true }
export async function restockWine(id, input = {}) {
  const user = await getCurrentUser();
  const quantity = Number.parseInt(input.quantity, 10);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) return { error: 'Cantitate invalidă' };
  const price = input.purchasePrice === '' || input.purchasePrice == null ? null : Number(input.purchasePrice);
  if (price != null && (!Number.isFinite(price) || price < 0)) return { error: 'Preț invalid' };

  const wine = await prisma.wine.findFirst({ where: { id, userId: user.id } });
  if (!wine) return { error: 'Vinul nu a fost găsit' };

  await prisma.$transaction([
    prisma.wine.update({
      where: { id },
      data: {
        quantity: { increment: quantity },
        status: 'IN_CELLAR',
        consumptionDate: null,
        purchaseDate: new Date(),
        ...(price != null && { purchasePrice: price }),
      },
    }),
    prisma.wineLog.create({
      data: { wineId: id, userId: user.id, action: 'ADDED', details: { restock: true, quantity, purchasePrice: price } },
    }),
  ]);

  revalidatePath('/wines');
  revalidatePath(`/wines/${id}`);
  revalidatePath('/dashboard');
  return { success: true };
}

// ─────────────────────────────────────────
// DEGUSTĂRI (DATA-003 / CELLAR-003)
// ─────────────────────────────────────────

// Ratingul vinului = media degustărilor cu rating (compatibilitate cu listele și statisticile existente)
async function syncWineRating(tx, wineId) {
  if (!wineId) return;
  const { _avg } = await tx.tasting.aggregate({ where: { wineId, rating: { not: null } }, _avg: { rating: true } });
  if (_avg.rating != null) await tx.wine.update({ where: { id: wineId }, data: { rating: Math.round(_avg.rating) } });
}

function tastingData(input) {
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

export async function getTastings({ wineId, limit = 100 } = {}) {
  const user = await getCurrentUser();
  return prisma.tasting.findMany({
    where: { userId: user.id, ...(wineId && { wineId }) },
    orderBy: { tastedAt: 'desc' },
    take: Math.min(Number(limit) || 100, 500),
    include: { wine: { select: { id: true, name: true, producer: true, vintage: true, type: true, labelImageUrl: true } } },
  });
}

export async function createTasting(input) {
  const user = await getCurrentUser();
  const parsed = tastingData(input);
  if (parsed.error) return { error: parsed.error };
  const wine = await prisma.wine.findFirst({ where: { id: parsed.data.wineId, userId: user.id }, select: { id: true, name: true } });
  if (!wine) return { error: 'Vinul nu a fost găsit' };

  const tasting = await prisma.$transaction(async (tx) => {
    const created = await tx.tasting.create({ data: { ...parsed.data, userId: user.id, wineName: wine.name } });
    await syncWineRating(tx, wine.id);
    await tx.wineLog.create({ data: { wineId: wine.id, userId: user.id, action: 'TASTED', details: { tastingId: created.id, rating: created.rating } } });
    return created;
  });

  revalidatePath(`/wines/${wine.id}`);
  revalidatePath('/tastings');
  return { success: true, tasting };
}

export async function updateTasting(id, input) {
  const user = await getCurrentUser();
  const existing = await prisma.tasting.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: 'Degustarea nu a fost găsită' };
  const parsed = tastingData({ ...input, wineId: existing.wineId ?? input?.wineId });
  if (parsed.error) return { error: parsed.error };
  const { wineId, ...data } = parsed.data;

  const tasting = await prisma.$transaction(async (tx) => {
    const updated = await tx.tasting.update({ where: { id }, data });
    await syncWineRating(tx, existing.wineId);
    return updated;
  });
  await releaseImages(existing.photoUrls.filter((url) => !tasting.photoUrls.includes(url)));

  revalidatePath(`/wines/${wineId}`);
  revalidatePath('/tastings');
  return { success: true, tasting };
}

export async function deleteTasting(id) {
  const user = await getCurrentUser();
  const existing = await prisma.tasting.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: 'Degustarea nu a fost găsită' };
  await prisma.$transaction(async (tx) => {
    await tx.tasting.delete({ where: { id } });
    await syncWineRating(tx, existing.wineId);
  });
  await releaseImages(existing.photoUrls);
  if (existing.wineId) revalidatePath(`/wines/${existing.wineId}`);
  revalidatePath('/tastings');
  return { success: true };
}

// ─────────────────────────────────────────
// „CUM A FOST?” (HOME-005)
// ─────────────────────────────────────────

export async function getFollowUps({ wineId, minAgeHours = 12 } = {}) {
  const user = await getCurrentUser();
  const since = new Date(Date.now() - 7 * 86_400_000);
  const [logs, tastings] = await Promise.all([
    prisma.wineLog.findMany({
      where: { userId: user.id, action: 'CONSUMED', createdAt: { gte: since }, wineId: wineId ?? { not: null } },
      select: { wineId: true, createdAt: true, wine: { select: { name: true } } },
    }),
    prisma.tasting.findMany({ where: { userId: user.id, tastedAt: { gte: new Date(since.getTime() - 86_400_000) } }, select: { wineId: true, tastedAt: true } }),
  ]);
  return pendingFollowUps(
    logs.map((log) => ({ wineId: log.wineId, at: log.createdAt, wineName: log.wine?.name ?? '' })),
    tastings,
    { minAgeHours },
  );
}

// ─────────────────────────────────────────
// BADGE-URI (SOCIAL-005)
// ─────────────────────────────────────────

export async function getBadges() {
  const user = await getCurrentUser();
  const [counts] = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(DISTINCT country)::int FROM "Wine" WHERE "userId" = ${user.id} AND country IS NOT NULL) AS countries,
      (SELECT COUNT(DISTINCT lower(g))::int FROM "Wine", unnest("grapeVarieties") AS g WHERE "userId" = ${user.id}) AS varieties,
      (SELECT COUNT(*)::int FROM "tasting" WHERE "userId" = ${user.id}) AS tastings,
      (SELECT COALESCE(SUM(quantity), 0)::int FROM "Wine" WHERE "userId" = ${user.id} AND status = 'IN_CELLAR') AS "bottlesInCellar",
      (SELECT COUNT(DISTINCT lower(region))::int FROM "Wine" WHERE "userId" = ${user.id} AND country IN ('România', 'Romania') AND region IS NOT NULL) AS "romanianRegions",
      (SELECT COUNT(*)::int FROM "wine_log" WHERE "userId" = ${user.id} AND action = 'SCAN_AI') AS scans`;
  // Sticle consumate: din istoric + vinurile consumate înainte de wine_log (o sticlă fiecare)
  const [consumed] = await prisma.$queryRaw`
    SELECT
      COALESCE((SELECT SUM(COALESCE(("details"->>'quantityConsumed')::int, 1)) FROM "wine_log" WHERE "userId" = ${user.id} AND action = 'CONSUMED'), 0)::int AS logged,
      (SELECT COUNT(*)::int FROM "Wine" w WHERE w."userId" = ${user.id} AND w.status = 'CONSUMED'
        AND NOT EXISTS (SELECT 1 FROM "wine_log" l WHERE l."wineId" = w.id AND l.action = 'CONSUMED')) AS legacy,
      COALESCE((SELECT SUM(COALESCE((l."details"->>'quantityConsumed')::int, 1)) FROM "wine_log" l JOIN "Wine" w ON w.id = l."wineId"
        WHERE l."userId" = ${user.id} AND l.action = 'CONSUMED'
          AND w."drinkFrom" <= EXTRACT(YEAR FROM l."createdAt") AND w."drinkUntil" >= EXTRACT(YEAR FROM l."createdAt")), 0)::int AS "inWindow"`;
  const badges = evaluateBadges({ ...counts, bottlesConsumed: consumed.logged + consumed.legacy, openedInWindow: consumed.inWindow });
  return { badges, challenge: nextChallenge(badges) };
}

// ─────────────────────────────────────────
// PLANIFICATOR DE CONSUM (CELLAR-006)
// ─────────────────────────────────────────

export async function getConsumptionPlan({ horizon = 10 } = {}) {
  const user = await getCurrentUser();
  const wines = await prisma.wine.findMany({
    where: { userId: user.id, status: 'IN_CELLAR', quantity: { gt: 0 } },
    select: { id: true, name: true, producer: true, vintage: true, type: true, quantity: true, status: true, drinkFrom: true, drinkUntil: true, agingPotential: true },
  });
  return buildPlan(wines, { horizon: Math.min(Math.max(Number(horizon) || 10, 3), 25) });
}
