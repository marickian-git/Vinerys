import { NextResponse } from 'next/server';
import { apiRoute, readJson } from '@/server/api';
import { deleteWineForUser, getWineForUser, updateWineForUser } from '@/server/wines';
import { WineInputSchema } from '@/schemas/wine';

export const GET = apiRoute('wine', async (_request, { user, params }) => {
  return NextResponse.json({ wine: await getWineForUser(user.id, params.id) });
});

// PATCH: doar câmpurile trimise se schimbă (fără valori implicite peste cele existente)
export const PATCH = apiRoute('wine', async (request, { user, params }) => {
  const raw = await request.clone().json().catch(() => ({}));
  const body = await readJson(request, WineInputSchema.partial());
  const data = Object.fromEntries(Object.entries(body).filter(([key]) => key in raw));
  const wine = await updateWineForUser(user.id, params.id, data);
  return NextResponse.json({ wine });
});

export const DELETE = apiRoute('wine', async (_request, { user, params }) => {
  await deleteWineForUser(user.id, params.id);
  return new NextResponse(null, { status: 204 });
});
