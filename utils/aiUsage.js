// AI-013: o linie în ai_usage per apel de agent, cu tokeni și cost estimat. Nu aruncă: consumul e informativ.
import prisma from './db';
import { estimateCostUsd } from './aiPricing';
import { serializeError } from './logger';

export async function recordAIUsage(userId, requestId, entries = [], log) {
  if (!entries?.length) return;
  try {
    await prisma.aIUsage.createMany({
      data: entries.map((entry) => ({
        userId,
        requestId,
        agentId: entry.agentId,
        provider: entry.provider,
        model: entry.model,
        operation: entry.operation,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        costUsd: estimateCostUsd(entry),
        latencyMs: entry.latencyMs,
        success: entry.success,
        source: entry.source ?? 'byo',
      })),
    });
  } catch (error) {
    log?.error('ai usage write failed', { error: serializeError(error) });
  }
}

// AI-012: câte cereri pe cheile platformei a făcut utilizatorul luna aceasta (o cerere = un requestId)
const OPERATIONS = { scan: ['scan_identify'], text: ['pairing', 'sommelier'] };

export async function platformRequestsThisMonth(userId, kind, since) {
  const rows = await prisma.aIUsage.findMany({
    where: { userId, source: 'platform', operation: { in: OPERATIONS[kind] }, createdAt: { gte: since } },
    distinct: ['requestId'],
    select: { requestId: true },
  });
  return rows.length;
}
