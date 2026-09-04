import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { auth } from '@/utils/auth';
import prisma from '@/utils/db';
import { analyzeWineLabelEnsemble, AI_PROVIDERS } from '@/utils/aiProviders';
import { decryptSecret } from '@/utils/aiSecrets';


export async function POST(request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
  }

  const operationId = randomUUID();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, aiProvider: true, aiApiKey: true,
      aiAgents: {
        where: { enabled: true },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });
  if (!user) {
    return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 });
  }

  let imageBase64, mimeType;
  try {
    const body = await request.json();
    imageBase64 = body.imageBase64;
    mimeType = body.mimeType || 'image/jpeg';
  } catch {
    return NextResponse.json({ error: 'Date invalide (imageBase64 lipsă)' }, { status: 400 });
  }

  if (!imageBase64) {
    return NextResponse.json({ error: 'Lipsește imaginea (imageBase64)' }, { status: 400 });
  }

  const agents = user.aiAgents.map((agent) => ({
    ...agent,
    apiKey: decryptSecret(agent.encryptedApiKey),
  }));
  if (!agents.length && user.aiProvider && user.aiApiKey) {
    agents.push({
      provider: user.aiProvider,
      apiKey: user.aiApiKey,
      name: 'Legacy AI agent',
      enabled: true,
      priority: 0,
      timeoutMs: 20000,
      maxRetries: 1,
      weight: 1,
    });
  }
  if (!agents.length) {
    return NextResponse.json({ error: 'Configurează cel puțin un agent AI activ în Setări → AI.' }, { status: 400 });
  }

  let scanResult;
  try {
    console.info(`[scan:${operationId}] starting ${agents.length} agents`);
    scanResult = await analyzeWineLabelEnsemble(imageBase64, mimeType, agents, { providers: [] });
  } catch (err) {
    console.error(`[scan:${operationId}] AI error:`, err.message);
    return NextResponse.json({ error: 'Scanarea nu a putut fi finalizată. Verifică agenții AI configurați.', operationId }, { status: 502 });
  }

  try {
    await prisma.wineLog.create({
      data: {
        wineId: null,
        userId: user.id,
        action: 'SCAN_AI',
        details: {
          operationId,
          providers: scanResult.sources,
          providerErrors: scanResult.errors,
          imageMimeType: mimeType,
          aiResult: scanResult.result,
          wineCreated: false,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    console.error('[scan] Error logging scan action:', err);
  }

  return NextResponse.json({
    success: true,
    operationId,
    providers: scanResult.sources,
    providerErrors: scanResult.errors,
    data: scanResult.result,
    wine: null,
  });
}