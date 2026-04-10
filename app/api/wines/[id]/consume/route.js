import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import prisma from '@/utils/db';

export async function POST(request, { params }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const quantityToConsume = body.quantity || 1; // câte sticle se consumă

    const wine = await prisma.wine.findFirst({
      where: { id: params.id, user: { clerkId: userId } },
    });
    if (!wine) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (wine.quantity < quantityToConsume) {
      return NextResponse.json(
        { error: `Only ${wine.quantity} bottle(s) available` },
        { status: 400 }
      );
    }

    const newQuantity = wine.quantity - quantityToConsume;
    const newStatus = newQuantity === 0 ? 'CONSUMED' : wine.status;

    const updated = await prisma.wine.update({
      where: { id: params.id },
      data: {
        quantity: newQuantity,
        status: newStatus,
        ...(newQuantity === 0 ? { consumptionDate: new Date() } : {}),
      },
    });

    // --- LOG CONSUMED ---
    await prisma.wineLog.create({
      data: {
        wineId: params.id,
        userId: wine.userId,
        action: 'CONSUMED',
        details: {
          quantityConsumed: quantityToConsume,
          remainingQuantity: newQuantity,
          consumptionDate: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error consuming wine:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}