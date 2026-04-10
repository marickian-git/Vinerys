import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth';
import prisma from '@/utils/db';
import { analyzeWineLabel, AI_PROVIDERS } from '@/utils/aiProviders';


export async function POST(request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, aiProvider: true, aiApiKey: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 });
  }

  let imageBase64, mimeType, createWine = true, providerOverride;
  try {
    const body = await request.json();
    imageBase64 = body.imageBase64;
    mimeType = body.mimeType || 'image/jpeg';
    createWine = body.createWine !== undefined ? body.createWine : true;
    providerOverride = body.provider; // opțional
  } catch {
    return NextResponse.json({ error: 'Date invalide (imageBase64 lipsă)' }, { status: 400 });
  }

  if (!imageBase64) {
    return NextResponse.json({ error: 'Lipsește imaginea (imageBase64)' }, { status: 400 });
  }

  let provider = providerOverride || user.aiProvider || 'gemini';
  let apiKey = user.aiApiKey;

  if (!apiKey && AI_PROVIDERS[provider]?.free) {
    const envKeyName = AI_PROVIDERS[provider].envKey;
    if (envKeyName) apiKey = process.env[envKeyName];
  }

  if (!apiKey) {
    return NextResponse.json({
      error: `Nicio cheie API configurată pentru ${AI_PROVIDERS[provider]?.name || provider}. Adaugă cheia în Setări → AI.`,
    }, { status: 400 });
  }

  let wineData;
  try {
    wineData = await analyzeWineLabel(imageBase64, mimeType, provider, apiKey);
  } catch (err) {
    console.error('[scan] AI error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  let createdWine = null;
  if (createWine) {
    try {
      const wineCreateData = {
        name: wineData.name || 'Vin scanat',
        producer: wineData.producer,
        country: wineData.country,
        region: wineData.region,
        subregion: wineData.subregion,
        type: wineData.type,
        color: wineData.type === 'RED' ? 'RED' : (wineData.type === 'WHITE' ? 'WHITE' : null),
        vintage: wineData.vintage ? parseInt(wineData.vintage) : null,
        grapeVarieties: wineData.grapeVarieties ? wineData.grapeVarieties.split(',').map(s => s.trim()) : [],
        alcoholPercentage: wineData.alcoholPercentage ? parseFloat(wineData.alcoholPercentage) : null,
        quantity: parseInt(wineData.quantity) || 1,
        purchasePrice: wineData.estimatedValue ? parseFloat(wineData.estimatedValue) : null,
        estimatedValue: wineData.estimatedValue ? parseFloat(wineData.estimatedValue) : null,
        tastingNotes: wineData.tastingNotes,
        servingTemperature: wineData.servingTemperature,
        foodPairing: wineData.foodPairing ? wineData.foodPairing.split(',').map(s => s.trim()) : [],
        agingPotential: wineData.agingPotential,
        bottleSize: wineData.bottleSize,
        bottleImageUrl: null, // Opțional: salvează imaginea în MinIO mai târziu
        isFavorite: false,
        status: 'IN_CELLAR',
        userId: user.id,
      };
      createdWine = await prisma.wine.create({ data: wineCreateData });
    } catch (err) {
      console.error('[scan] Error creating wine:', err);
      return NextResponse.json(
        { error: 'Vinul nu a putut fi salvat', details: err.message },
        { status: 500 }
      );
    }
  }

  try {
    await prisma.wineLog.create({
      data: {
        wineId: createdWine ? createdWine.id : null, // null dacă nu s-a creat
        userId: user.id,
        action: 'SCAN_AI',
        details: {
          provider,
          imageMimeType: mimeType,
          aiResult: wineData,
          wineCreated: !!createdWine,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    console.error('[scan] Error logging scan action:', err);
  }

  return NextResponse.json({
    success: true,
    provider,
    data: wineData,
    wine: createdWine,
  });
}