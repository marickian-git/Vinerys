import { NextResponse } from 'next/server';
import { apiRoute } from '@/server/api';
import { getWineForUser } from '@/server/wines';
import { createTastingForUser, listTastings } from '@/server/tastings';
import { validationError } from '@/utils/errors';

export const GET = apiRoute('tastings', async (_request, { user, params }) => {
  await getWineForUser(user.id, params.id);
  return NextResponse.json({ tastings: await listTastings(user.id, { wineId: params.id }) });
});

export const POST = apiRoute('tastings', async (request, { user, params }) => {
  await getWineForUser(user.id, params.id);
  const body = await request.json().catch(() => ({}));
  const result = await createTastingForUser(user.id, { ...body, wineId: params.id });
  if (result.error) throw validationError(typeof result.error === 'object' ? result.error : undefined, typeof result.error === 'string' ? result.error : undefined);
  return NextResponse.json({ tasting: result.tasting }, { status: 201 });
});
