import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import prisma from '@/utils/db';

// GET /api/wines/[id] - Detalii vin
export async function GET(request, { params }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wine = await prisma.wine.findFirst({
      where: {
        id: params.id,
        user: { clerkId: userId },
      },
    });

    if (!wine) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(wine);
  } catch (error) {
    console.error('Error fetching wine:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/wines/[id] - Actualizează vin
export async function PUT(request, { params }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Pregătim datele pentru update (doar câmpurile care există în body)
    const updateData = {};
    
    const fields = [
      'name', 'producer', 'country', 'region', 'subregion', 'type', 'color',
      'vintage', 'grapeVarieties', 'alcoholPercentage', 'price', 'quantity',
      'cellarLocation', 'purchaseDate', 'purchasePrice', 'estimatedValue',
      'rating', 'tastingNotes', 'servingTemperature', 'foodPairing',
      'agingPotential', 'bottleSize', 'bottleImageUrl', 'labelImageUrl',
      'isFavorite', 'consumptionDate', 'status'
    ];

    fields.forEach(field => {
      if (body[field] !== undefined) {
        // Conversii pentru tipuri numerice
        if (field === 'vintage' || field === 'quantity' || field === 'rating') {
          updateData[field] = body[field] ? parseInt(body[field]) : null;
        } else if (field === 'alcoholPercentage' || field === 'price' || 
                   field === 'purchasePrice' || field === 'estimatedValue') {
          updateData[field] = body[field] ? parseFloat(body[field]) : null;
        } else if (field === 'purchaseDate' || field === 'consumptionDate') {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else {
          updateData[field] = body[field];
        }
      }
    });

    const wine = await prisma.wine.updateMany({
      where: {
        id: params.id,
        user: { clerkId: userId },
      },
      data: updateData,
    });

    if (wine.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating wine:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/wines/[id] - Șterge vin
export async function DELETE(request, { params }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wine = await prisma.wine.deleteMany({
      where: {
        id: params.id,
        user: { clerkId: userId },
      },
    });

    if (wine.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wine:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}