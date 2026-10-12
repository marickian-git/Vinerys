import { NextResponse } from 'next/server';
import { apiRoute } from '@/server/api';
import { getWinePairing } from '@/utils/actions';
import { validationError } from '@/utils/errors';

// GET /api/v1/wines/:id/pairing[?refresh=1] → „Ce gătesc cu el?” (din cache dacă există)
export const GET = apiRoute('pairing', async (request, { params }) => {
  const refresh = new URL(request.url).searchParams.get('refresh') === '1';
  const result = await getWinePairing(params.id, { refresh });
  if (result.error) throw validationError(undefined, result.error);
  return NextResponse.json(result);
});
