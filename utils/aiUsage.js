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
      })),
    });
  } catch (error) {
    log?.error('ai usage write failed', { error: serializeError(error) });
  }
}
