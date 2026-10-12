import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth';
import prisma from '@/utils/db';
import { analyzeWineLabelEnsemble, AI_PROVIDERS } from '@/utils/aiProviders';
import { decryptSecret } from '@/utils/aiSecrets';
import { LIMITS, rateLimit, tooManyRequestsMessage } from '@/utils/rateLimit';
import { serializeError } from '@/utils/logger';
import { ScanRequestSchema } from '@/schemas/ai';
import { findCachedScan, hashImage, storeScan } from '@/utils/scanCache';
import { platformRequestsThisMonth, recordAIUsage } from '@/utils/aiUsage';
import { chooseAgents, monthStart, platformAgents, quotaFor, quotaMessage } from '@/utils/platformAI';
import { notFound, rateLimited, unauthenticated, validationError, withApiHandler } from '@/utils/errors';

function publicProviderErrors(items = []) {
  return items.map(({ raw, parsed, normalized, ...item }) => item);
}

function providerStatusFor(item) {
  if (item.providerStatus === 'RATE_LIMITED') return 'Rate limited';
  if (item.providerStatus === 'MODEL_UNAVAILABLE') return 'Model unavailable';
  if (item.resultStatus === 'EMPTY') return 'Invalid result';
  if (item.providerStatus === 'TIMEOUT') return 'Provider unavailable';
  return item.error?.startsWith('401:') || item.error?.startsWith('403:') ? 'Invalid credentials' : item.error?.startsWith('404:') ? 'Model unavailable' : item.error?.startsWith('429:') ? 'Rate limited' : 'Provider unavailable';
}


// Istoricul scanărilor (wine_log SCAN_AI); o eroare aici nu blochează răspunsul
async function logScan(userId, details, log) {
  try {
    await prisma.wineLog.create({
      data: {
        wineId: null,
        userId,
        action: 'SCAN_AI',
        details: { ...details, wineCreated: false, timestamp: new Date().toISOString() },
      },
    });
  } catch (err) {
    log.error('wine log write failed', { error: serializeError(err) });
  }
}

export const POST = withApiHandler('ai-scan', async (request, { log: baseLog, requestId }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw unauthenticated();

  const limited = rateLimit(`ai-scan:${session.user.id}`, LIMITS.aiScan);
  if (!limited.ok) throw rateLimited(tooManyRequestsMessage(limited.retryAfter), limited.retryAfter);

  const operationId = requestId;
  const startedAt = Date.now();
  const log = baseLog.child({ userId: session.user.id });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      aiAgents: {
        where: { enabled: true },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });
  if (!user) throw notFound('Utilizator negăsit');

  const body = await request.json().catch(() => {
    throw validationError(undefined, 'Date invalide (imageBase64 lipsă)');
  });
  const parsedBody = ScanRequestSchema.safeParse(body ?? {});
  if (!parsedBody.success) throw validationError(undefined, parsedBody.error.issues[0]?.message);
  const { imageBase64, mimeType, force } = parsedBody.data;

  // AI-008: aceeași imagine scanată deja → rezultatul din cache, fără apel AI
  const imageHash = hashImage(imageBase64);
  if (!force) {
    const cached = await findCachedScan(prisma, imageHash).catch((err) => {
      log.warn('scan cache read failed', { error: serializeError(err) });
      return null;
    });
    if (cached) {
      await logScan(user.id, { operationId, cached: true, providers: cached.providers, durationMs: Date.now() - startedAt, imageMimeType: mimeType, aiResult: cached.result }, log);
      log.info('scan served from cache', { durationMs: Date.now() - startedAt, providers: cached.providers });
      return NextResponse.json({
        success: true,
        cached: true,
        operationId,
        providers: cached.providers,
        providerErrors: [],
        enrichmentErrors: [],
        data: cached.result,
        wine: null,
      });
    }
  }

  // Un agent cu cheie care nu se poate decripta (ex. secret schimbat) e sărit, nu blochează scanarea
  const agents = user.aiAgents.flatMap((agent) => {
    try {
      return [{ ...agent, apiKey: decryptSecret(agent.encryptedApiKey) }];
    } catch {
      log.error('agent key cannot be decrypted', { agentId: agent.id, provider: agent.provider });
      return [];
    }
  });
  // AI-012: cheile proprii au prioritate; altfel cheile platformei, în limita cotei lunare
  const platform = platformAgents();
  const used = agents.length || !platform.length ? 0 : await platformRequestsThisMonth(user.id, 'scan', monthStart());
  const quota = quotaFor(user, 'scan');
  const choice = chooseAgents({ ownAgents: agents, platform, used, quota });
  if (choice.error) {
    throw choice.error === 'QUOTA_EXCEEDED'
      ? rateLimited(quotaMessage(choice.error, quota))
      : validationError(undefined, quotaMessage(choice.error, quota));
  }

  let scanResult;
  try {
    log.info('scan started', { agents: choice.agents.length, source: choice.source, providers: choice.agents.map((agent) => agent.provider) });
    scanResult = await analyzeWineLabelEnsemble(imageBase64, mimeType, choice.agents, { providers: [] });
    await Promise.all(scanResult.successfulAgentIds.map((id) => prisma.aIAgent.updateMany({
      where: { id, userId: user.id },
      data: { lastStatus: 'Healthy', lastError: null, lastCheckedAt: new Date() },
    })));
    await Promise.all(scanResult.errors.filter((item) => item.agentId).map((item) => prisma.aIAgent.updateMany({
      where: { id: item.agentId, userId: user.id },
      data: {
        lastStatus: providerStatusFor(item),
        lastError: item.error.slice(0, 500),
        lastCheckedAt: new Date(),
      },
    })));
  } catch (err) {
    await Promise.all((err.providerErrors || []).filter((item) => item.agentId).map((item) => prisma.aIAgent.updateMany({
      where: { id: item.agentId, userId: user.id },
      data: {
        lastStatus: providerStatusFor(item),
        lastError: item.error.slice(0, 500),
        lastCheckedAt: new Date(),
      },
    })));
    await recordAIUsage(user.id, operationId, err.usage, log);
    log.error('scan failed', {
      error: serializeError(err),
      durationMs: Date.now() - startedAt,
      providerErrors: publicProviderErrors(err.providerErrors || []),
    });
    return NextResponse.json({
      error: 'Scanarea nu a putut fi finalizată. Verifică agenții AI configurați.',
      code: 'AI_FAILED',
      operationId,
      providerErrors: publicProviderErrors(err.providerErrors || []),
    }, { status: 502 });
  }

  await logScan(user.id, {
    operationId,
    providers: scanResult.sources,
    providerErrors: scanResult.errors,
    enrichmentErrors: scanResult.enrichmentErrors || [],
    identificationConfidence: scanResult.result.identification?.confidence ?? scanResult.result.confidence?.identity ?? null,
    enrichmentConfidence: scanResult.result.enrichment?.confidence ?? null,
    drinkingWindow: {
      from: scanResult.result.drinkFrom ?? null,
      until: scanResult.result.drinkUntil ?? null,
      confidence: scanResult.result.confidence?.drinkWindow ?? null,
      basis: scanResult.result.drinkWindowBasis ?? null,
    },
    durationMs: Date.now() - startedAt,
    imageMimeType: mimeType,
    aiResult: scanResult.result,
  }, log);

  await recordAIUsage(user.id, operationId, scanResult.usage, log);
  await storeScan(prisma, imageHash, scanResult).catch((err) => {
    log.warn('scan cache write failed', { error: serializeError(err) });
  });

  log.debug('provider pipeline', { providerDebug: scanResult.providerDebug });
  log.info('scan completed', {
    durationMs: Date.now() - startedAt,
    providers: scanResult.sources,
    agentTimings: scanResult.agentTimings,
    identityConfidence: scanResult.result.confidence?.identity ?? null,
    drinkFrom: scanResult.result.drinkFrom ?? null,
    drinkUntil: scanResult.result.drinkUntil ?? null,
  });

  return NextResponse.json({
    success: true,
    operationId,
    providers: scanResult.sources,
    providerErrors: publicProviderErrors(scanResult.errors),
    enrichmentErrors: scanResult.enrichmentErrors || [],
    cached: false,
    data: scanResult.result,
    wine: null,
  });
});
