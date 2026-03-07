import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth';
import prisma from '@/utils/db';
import { analyzeWineLabel, AI_PROVIDERS } from '@/utils/aiProviders';

export async function POST(request) {
  // Auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
  }

  // Obține provider-ul salvat al userului
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiProvider: true, aiApiKey: true },
  });

  const provider = user?.aiProvider || 'gemini';
  const apiKey   = user?.aiApiKey;

  if (!apiKey) {
    return NextResponse.json({
      error: `Nicio cheie API configurată pentru ${AI_PROVIDERS[provider]?.name}. Adaugă cheia în Setări → AI.`
    }, { status: 400 });
  }

  // Parsează imaginea din body
  let imageBase64, mimeType;
  try {
    const body = await request.json();
    imageBase64 = body.imageBase64;
    mimeType    = body.mimeType || 'image/jpeg';

    if (!imageBase64) throw new Error('Lipsă imagine');
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
  }

  // Analizează
  try {
    const wineData = await analyzeWineLabel(imageBase64, mimeType, provider, apiKey);
    return NextResponse.json({ success: true, data: wineData, provider });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}