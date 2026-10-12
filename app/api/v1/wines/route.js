import { NextResponse } from 'next/server';
import { apiRoute, readJson } from '@/server/api';
import { createWineForUser, listWines } from '@/server/wines';
import { WineInputSchema } from '@/schemas/wine';

const FILTERS = ['search', 'type', 'status', 'country', 'sort', 'page', 'pageSize', 'vintage', 'vintageMin', 'vintageMax', 'ratingMin', 'priceMax', 'isFavorite'];

// GET /api/v1/wines?search=&type=&status=&page=&pageSize= → listă paginată (aceeași căutare ca în aplicație)
export const GET = apiRoute('wines', async (request, { user }) => {
  const params = new URL(request.url).searchParams;
  const filters = Object.fromEntries(FILTERS.filter((key) => params.get(key)).map((key) => [key, params.get(key)]));
  filters.pageSize = String(Math.min(Number(filters.pageSize) || 24, 100));
  return NextResponse.json(await listWines(user.id, filters));
});

// POST /api/v1/wines → vin nou (JSON, aceleași reguli ca formularul)
export const POST = apiRoute('wines', async (request, { user }) => {
  const data = await readJson(request, WineInputSchema);
  const wine = await createWineForUser(user.id, { ...data, drinkFrom: data.drinkFrom ?? null, drinkUntil: data.drinkUntil ?? null });
  return NextResponse.json({ wine }, { status: 201 });
});
