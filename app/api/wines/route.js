import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import prisma from '@/utils/db';

// GET /api/wines - Lista toate vinurile utilizatorului
export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const search = searchParams.get('search');

    // Construim where clause dinamic
    const where = { userId };
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (country) where.country = country;
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { producer: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
      ];
    }

    const wines = await prisma.wine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(wines);
  } catch (error) {
    console.error('Error fetching wines:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/wines - Creează vin nou
export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validare simplă
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Găsește user-ul în baza noastră de date
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Creează user dacă nu există
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: body.email || '',
          name: body.name || '',
        },
      });
    }

    // Pregătim datele pentru creare
    const wineData = {
      name: body.name,
      producer: body.producer || null,
      country: body.country || null,
      region: body.region || null,
      subregion: body.subregion || null,
      type: body.type || 'RED',
      color: body.color || null,
      vintage: body.vintage ? parseInt(body.vintage) : null,
      grapeVarieties: body.grapeVarieties || [],
      alcoholPercentage: body.alcoholPercentage ? parseFloat(body.alcoholPercentage) : null,
      price: body.price ? parseFloat(body.price) : null,
      quantity: body.quantity ? parseInt(body.quantity) : 1,
      cellarLocation: body.cellarLocation || null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
      estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
      rating: body.rating ? parseInt(body.rating) : null,
      tastingNotes: body.tastingNotes || null,
      servingTemperature: body.servingTemperature || null,
      foodPairing: body.foodPairing || [],
      agingPotential: body.agingPotential || null,
      bottleSize: body.bottleSize || '0.75L',
      bottleImageUrl: body.bottleImageUrl || null,
      labelImageUrl: body.labelImageUrl || null,
      isFavorite: body.isFavorite || false,
      consumptionDate: body.consumptionDate ? new Date(body.consumptionDate) : null,
      status: body.status || 'IN_CELLAR',
      userId: user.id,
    };

    const wine = await prisma.wine.create({
      data: wineData,
    });

    return NextResponse.json(wine, { status: 201 });
  } catch (error) {
    console.error('Error creating wine:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}